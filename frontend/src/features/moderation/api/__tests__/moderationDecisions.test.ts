import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  approveListing,
  dismissComplaint,
  fetchComplaints,
  rejectListing,
  unpublishListing,
} from '../moderationApi'
import { toComplaintCase } from '../../logic/complaintView'
import { complain } from '../../../../shared/api/backend/moderationApi'
import { BACKEND } from '../../../../shared/api/backend/paths'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../../test/fakeServer'

// Копия `ComplaintGroup`: карточка ленты и жалобы на неё.
const group = {
  sale_car_id: 'car1',
  listing: {
    sale_car_id: 'car1',
    brand: 'Lexus',
    model: 'GS',
    year: 2012,
    price: 1900000,
    preview_photo_url: 'https://cdn/gs.jpg',
    published_at: '2026-09-10T08:00:00',
  },
  complaints: [
    {
      complaint_id: 'c1',
      sale_car_id: 'car1',
      author: { user_id: 'b1', name: 'Анна', avatar_url: null },
      reason: 'bait_price',
      text: 'Цена в два раза ниже рынка',
      status: 'open',
      created_at: '2026-09-14T10:15:00',
      handled_at: null,
    },
  ],
}

let server: FakeServer

beforeEach(() => {
  server = fakeServer()
  signedIn('m1', 'manager')
})
afterEach(resetServer)

// Feature: Жалобы и решения модератора
describe('решения модератора', () => {
  it('Scenario: модератор видит жалобу с причиной словами и текстом покупателя', async () => {
    // Given покупатель пожаловался на цену-приманку
    server.on('GET', BACKEND.moderation.complaints, {
      status: 200,
      body: { items: [group], total: 1, page: 1, size: 20 },
    })
    // When модератор открывает жалобы
    const { items, open } = await fetchComplaints()
    const view = toComplaintCase(items[0], new Date(2026, 8, 14, 18, 0))
    // Then карточка называет машину, число жалоб, причину словами и когда пожаловались
    expect(open).toBe(1)
    expect(view).toMatchObject({ listingId: 'car1', count: '1 жалоба' })
    expect(view.title).toContain('Lexus GS · 2012')
    expect(view.complaints[0]).toMatchObject({
      author: 'Анна',
      meta: '· сегодня, 10:15 · причина: Цена-приманка',
      body: 'Цена в два раза ниже рынка',
    })
  })

  it('Scenario: жалоба необоснованна — модератор её отклоняет, объявление остаётся', async () => {
    server.on('POST', BACKEND.moderation.dismissComplaint('c1'), {
      status: 200,
      body: { ...group.complaints[0], status: 'handled' },
    })

    await dismissComplaint('c1')

    expect(server.callsTo('POST', BACKEND.moderation.dismissComplaint('c1'))).toHaveLength(1)
  })

  it('Scenario: снять с публикации по жалобе можно только с причиной для продавца', async () => {
    server.on('POST', BACKEND.moderation.unpublish('car1'), {
      status: 200,
      body: { status: 'rejected' },
    })

    await unpublishListing('car1', 'bait_price', '  цена ниже рынка вдвое ')

    expect(server.callsTo('POST', BACKEND.moderation.unpublish('car1'))[0].body).toEqual({
      label: 'bait_price',
      comment: 'цена ниже рынка вдвое',
    })
  })

  it('Scenario: отклонение без комментария отправляет только причину', async () => {
    server.on('POST', BACKEND.saleCar.reject('car1'), { status: 200, body: { status: 'rejected' } })

    await rejectListing('car1', 'too_few_photos', '   ')

    expect(server.callsTo('POST', BACKEND.saleCar.reject('car1'))[0].body).toEqual({
      label: 'too_few_photos',
    })
  })

  it('Scenario: модератор публикует объявление', async () => {
    server.on('POST', BACKEND.saleCar.approve('car1'), {
      status: 200,
      body: { status: 'published' },
    })

    await expect(approveListing('car1')).resolves.toEqual({ status: 'published' })
  })

  it('Scenario: повторная жалоба того же покупателя — отказ сервера текстом', async () => {
    server.on('POST', BACKEND.moderation.complain('car1'), {
      status: 409,
      body: { code: 'DUPLICATE', message: 'Вы уже жаловались' },
    })

    const failure = await complain('car1', 'other', 'ещё раз').catch((error: unknown) => error)

    expect((failure as Error).message).toBe(
      'Данные успели измениться. Обновите страницу и попробуйте снова.',
    )
  })
})
