// Поток событий распознавания СТС для одного объявления.
//
// Не запрос, а `text/event-stream`: сообщения приходят, пока идёт чтение документа, и
// экран при этом не блокируется.
//
// Читается через `fetch`, а не `EventSource`. История 11 закрыла ручку авторизацией —
// поток несёт то, как прочитали чужой документ, — а `EventSource` не умеет слать
// заголовок `Authorization` и предлагает единственную замену: токен в адресе, то есть в
// истории браузера, в логах прокси и в реферере. Поэтому поток открывается запросом с
// заголовком и разбирается вручную; протокол SSE для этого достаточно прост.
//
// До этой правки поток отвечал 401 всем и всегда: экран доезжал только на страховочном
// перечитывании объявления, поэтому на быстром ответе казался рабочим, а на медленном —
// зависшим.
import { currentSession } from '../../session/authSession'
import { BACKEND } from './paths'

/** Значения статуса — те же, что пишет очередь в `backend/app/tasks/status_updater.py`. */
export type TaskStatus =
  | 'Pending'
  | 'Started'
  | 'OcrStarted'
  | 'OcrSuccess'
  | 'OcrFailed'
  | 'DecodeStarted'
  | 'DecodeProcessing'
  | 'DecodeSuccess'
  | 'DecodeFailed'

export interface ListingEvent {
  /** `initial` приходит первым и несёт текущий статус, `heartbeat` — раз в 30 секунд,
   *  чтобы соединение не закрыли посредники. */
  type?: 'initial' | 'heartbeat' | 'error' | string
  sale_car_id?: string
  status?: TaskStatus | string
  message?: string
  timestamp?: number
}

export interface ListingStreamHandlers {
  onEvent: (event: ListingEvent) => void
  onError?: (error: unknown) => void
}

/** Возвращает функцию закрытия. Разбор битого сообщения не роняет поток: одно
 *  испорченное событие не повод оборвать чтение, которое ещё идёт. */
export function openListingStream(saleCarId: string, handlers: ListingStreamHandlers): () => void {
  const stop = new AbortController()

  void read(saleCarId, handlers, stop.signal).catch((error) => {
    // Прерывание — не сбой: так поток закрывает сам экран, уходя со страницы.
    if (stop.signal.aborted) return
    handlers.onError?.(error)
  })

  return () => stop.abort()
}

async function read(
  saleCarId: string,
  handlers: ListingStreamHandlers,
  signal: AbortSignal,
): Promise<void> {
  const token = currentSession()?.accessToken
  const answer = await fetch(BACKEND.stream.listing(saleCarId), {
    headers: {
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  })

  if (!answer.ok || !answer.body) throw new Error(`Поток не открылся: ${answer.status}`)

  const reader = answer.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    // Куски читаются по очереди по определению: это поток, а не набор запросов, и
    // «собрать в массив и дождаться всех» здесь означало бы дождаться конца чтения.
    // eslint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read()
    if (done) return
    buffer += decoder.decode(value, { stream: true })

    // Событие SSE кончается пустой строкой; всё, что после неё, — начало следующего.
    let split = buffer.indexOf('\n\n')
    while (split !== -1) {
      emit(buffer.slice(0, split), handlers)
      buffer = buffer.slice(split + 2)
      split = buffer.indexOf('\n\n')
    }
  }
}

function emit(chunk: string, handlers: ListingStreamHandlers): void {
  const payload = chunk
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('\n')
  if (!payload) return

  try {
    handlers.onEvent(JSON.parse(payload) as ListingEvent)
  } catch {
    handlers.onEvent({ type: 'error', message: payload })
  }
}
