// Поток событий распознавания СТС для одного объявления.
//
// Не запрос, а `text/event-stream`: сообщения приходят, пока идёт чтение документа, и
// экран при этом не блокируется. Токен в EventSource приложить нельзя — поток открыт
// по идентификатору объявления, и сервер сегодня его не проверяет.
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
  onError?: (error: Event) => void
}

/** Возвращает функцию закрытия. Разбор битого сообщения не роняет поток: одно
 *  испорченное событие не повод оборвать чтение, которое ещё идёт. */
export function openListingStream(saleCarId: string, handlers: ListingStreamHandlers): () => void {
  const source = new EventSource(BACKEND.stream.listing(saleCarId))

  source.addEventListener('message', (message) => {
    try {
      handlers.onEvent(JSON.parse(message.data) as ListingEvent)
    } catch {
      handlers.onEvent({ type: 'error', message: message.data })
    }
  })

  if (handlers.onError) source.addEventListener('error', handlers.onError)

  return () => source.close()
}
