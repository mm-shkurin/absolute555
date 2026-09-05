import { afterEach, describe, expect, it, vi } from 'vitest'
import { openListingStream, type ListingEvent } from '../listingStream'
import { endSession, startSession } from '../../../session/authSession'

// Поток отдаётся кусками, как его отдаёт сервер: событие может прийти разрезанным
// посередине, и склеивать его — работа читателя, а не сервера.
function streamOf(chunks: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk))
      controller.close()
    },
  })
  return new Response(body, { status: 200 })
}

function collect(chunks: string[]): Promise<ListingEvent[]> {
  const seen: ListingEvent[] = []
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamOf(chunks)))
  return new Promise((done) => {
    openListingStream('l1', { onEvent: (event) => seen.push(event) })
    setTimeout(() => done(seen), 30)
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  endSession()
})

describe('поток распознавания', () => {
  it('читает события, приходящие по одному', async () => {
    const seen = await collect([
      'data: {"status":"OcrStarted"}\n\n',
      'data: {"status":"DecodeSuccess"}\n\n',
    ])

    expect(seen.map((one) => one.status)).toEqual(['OcrStarted', 'DecodeSuccess'])
  })

  it('склеивает событие, разрезанное между кусками', async () => {
    const seen = await collect(['data: {"sta', 'tus":"DecodeSuccess"}\n\n'])

    expect(seen).toEqual([{ status: 'DecodeSuccess' }])
  })

  it('не роняет поток на испорченном событии', async () => {
    const seen = await collect(['data: не json\n\n', 'data: {"status":"DecodeSuccess"}\n\n'])

    expect(seen[0].type).toBe('error')
    expect(seen[1].status).toBe('DecodeSuccess')
  })

  it('прикладывает токен сессии — иначе сервер отвечает 401', async () => {
    const fetching = vi.fn().mockResolvedValue(streamOf([]))
    vi.stubGlobal('fetch', fetching)
    startSession({
      accessToken: 'a1',
      refreshToken: 'r1',
      userId: 'u1',
      role: 'user',
      displayName: 'Продавец',
      avatarUrl: null,
    })

    openListingStream('l1', { onEvent: () => undefined })
    await new Promise((done) => setTimeout(done, 20))

    const [, options] = fetching.mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer a1')
  })
})
