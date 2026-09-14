import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fetchQueue } from '../moderationApi'
import { toQueueRow, toReviewCard } from '../../logic/queueView'
import { BACKEND } from '../../../../shared/api/backend/paths'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../../test/fakeServer'

// Копия `QueueItem` (backend/app/features/moderation/schemas/moderation.py): FeedCard + продавец.
const item = (over: Record<string, unknown> = {}) => ({
  sale_car_id: 'car1',
  brand: 'Lexus',
  model: 'GS',
  year: 2012,
  price: 1900000,
  milleage: 96400,
  transmission: 'АКПП',
  status: 'review',
  preview_photo_url: 'https://cdn/gs.jpg',
  published_at: null,
  listing_kind: 'stock',
  import_country: null,
  delivery_days: null,
  turnkey_price: null,
  thickness: { measured_panels: 13, total_panels: 13, is_complete: true },
  seller: { user_id: 'u9', name: 'Дмитрий', avatar_url: null, rating: 4.8, deals_count: 3 },
  open_complaints: 0,
  submitted_at: '2026-09-14T09:30:00Z',
  ...over,
})

let server: FakeServer

beforeEach(() => {
  server = fakeServer()
  signedIn('m1', 'manager')
  server.on('GET', BACKEND.moderation.counts, { status: 200, body: { waiting: 1, complained: 0, handled_today: 4 } })
})
afterEach(resetServer)

function queueWith(...items: ReturnType<typeof item>[]) {
  server.on('GET', BACKEND.moderation.queue, { status: 200, body: { items, total: items.length, page: 1, size: 20 } })
}

// Feature: Очередь модерации
describe('очередь модерации на проводе сервера', () => {
  it('Scenario: продавец заполнил карту замеров — модератор видит полную карту', async () => {
    // Given продавец замерил все 13 панелей и отправил объявление
    queueWith(item())
    // When модератор открывает очередь
    const { items } = await fetchQueue('pending')
    // Then в строке и в карточке проверки карта 13 из 13, а не «не заполнена»
    expect(toQueueRow(items[0]).meta).toContain('карта 13 из 13')
    expect(toReviewCard(items[0]).facts.find((fact) => fact.label === 'Карта замеров')?.value).toBe('13 из 13')
  })

  it('Scenario: объявление без замеров помечено «без карты»', async () => {
    queueWith(item({ thickness: null }))

    const { items } = await fetchQueue('pending')

    expect(toQueueRow(items[0]).meta).toContain('без карты')
  })

  it('Scenario: машина под заказ помечена в очереди как «под заказ»', async () => {
    queueWith(item({ listing_kind: 'import', import_country: 'Япония' }))

    const { items } = await fetchQueue('pending')

    expect(toQueueRow(items[0]).badge).toBe('под заказ')
  })

  it('Scenario: вкладки называют числа сервера', async () => {
    queueWith(item())

    const queue = await fetchQueue('done')

    expect(queue).toMatchObject({ pending: 1, flagged: 0, done_today: 4 })
    expect(server.calls.find((call) => call.path.startsWith(BACKEND.moderation.queue))?.path).toContain('handled_today')
  })

  it('Scenario: продавец без закрытых сделок назван новым', async () => {
    queueWith(item({ seller: { user_id: 'u9', name: 'Олег', avatar_url: null, rating: null, deals_count: 0 } }))

    const { items } = await fetchQueue('pending')

    expect(toQueueRow(items[0]).meta).toContain('Олег · новый продавец')
  })

  it('Scenario: на объявление пожаловались — строка помечена жалобами', async () => {
    queueWith(item({ open_complaints: 2 }))

    const { items } = await fetchQueue('flagged')

    expect(toQueueRow(items[0])).toMatchObject({ flag: '2 жалобы', badge: 'жалобы', tone: 'bad' })
  })
})
