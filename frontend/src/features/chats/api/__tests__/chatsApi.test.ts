import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DialogWire, MessageWire } from '../../../../shared/api/backend/chatContract'
import { endSession, startSession } from '../../../../shared/session/authSession'

const wire = vi.hoisted(() => ({
  fetchDialogs: vi.fn(),
  fetchMessages: vi.fn(),
  sendMessage: vi.fn(),
  markRead: vi.fn(),
}))
vi.mock('../../../../shared/api/backend/chatApi', () => wire)

import { fetchChats, fetchMessages, markConversationRead } from '../chatsApi'

// Формы ответов — копии `DialogResponse` и `MessageResponse` (`api-specs/chat.yaml`).
const fromBuyer: MessageWire = {
  message_id: 'm1',
  dialog_id: 'd1',
  author_id: 'buyer',
  kind: 'text',
  text: 'Торг уместен?',
  read_at: null,
  created_at: '2026-09-14T10:00:00Z',
}
const system: MessageWire = { ...fromBuyer, message_id: 'm0', author_id: null, kind: 'system' }

const listingDialog: DialogWire = {
  dialog_id: 'd1',
  sale_car_id: 'car1',
  listing: {
    sale_car_id: 'car1',
    brand: 'Lexus',
    model: 'GS',
    year: null,
    price: 1900000,
    milleage: null,
    transmission: null,
    status: 'published',
    preview_photo_url: 'https://cdn/gs.jpg',
    published_at: null,
    listing_kind: 'stock',
    import_country: null,
    delivery_days: null,
    turnkey_price: null,
    thickness: null,
  },
  request: null,
  storefront: null,
  counterpart: {
    user_id: 'seller',
    name: 'Дмитрий',
    avatar_url: null,
    rating: null,
    reviews_count: 0,
    deals_count: 0,
  },
  last_message: fromBuyer,
  unread: 1,
  can_review: false,
  review_id: null,
}

function signIn(userId: string) {
  startSession({
    accessToken: 'a1',
    refreshToken: 'r1',
    userId,
    role: 'user',
    displayName: 'Покупатель',
    avatarUrl: null,
  })
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => endSession())

describe('чаты на проводе сервера', () => {
  it('Scenario: список переписок показывает машину, собеседника и последнюю строку', async () => {
    // Given у покупателя переписка с продавцом по Lexus GS
    wire.fetchDialogs.mockResolvedValue([listingDialog])
    // When он открывает чаты
    const { items } = await fetchChats()
    // Then строка называет машину, цену, собеседника и последнее сообщение
    expect(items[0]).toMatchObject({
      id: 'd1',
      subject: 'listing',
      listing_id: 'car1',
      listing_title: 'Lexus GS',
      listing_price: 1900000,
      listing_photo: 'https://cdn/gs.jpg',
      counterparty_name: 'Дмитрий',
      last_message: 'Торг уместен?',
      unread_count: 1,
    })
  })

  it('Scenario: переписка по заявке называет заявку и бюджет, а не машину', async () => {
    const request = {
      request_id: 'r1',
      brand: null,
      model: null,
      year_from: null,
      budget_max: 3000000,
      status: 'open',
    }
    wire.fetchDialogs.mockResolvedValue([
      { ...listingDialog, listing: null, sale_car_id: null, request },
    ])

    const { items } = await fetchChats()

    expect(items[0]).toMatchObject({
      subject: 'request',
      listing_title: 'Заявка: без марки',
      listing_price: 3000000,
    })
  })

  it('Scenario: одна переписка у двух сторон — своё сообщение справа только у автора', async () => {
    wire.fetchMessages.mockResolvedValue({
      items: [system, fromBuyer],
      total: 2,
      page: 1,
      size: 50,
    })

    signIn('buyer')
    const atBuyer = (await fetchMessages('d1')).items
    endSession()
    signIn('seller')
    const atSeller = (await fetchMessages('d1')).items

    expect(atBuyer.map((one) => one.outgoing)).toEqual([false, true])
    expect(atSeller.map((one) => one.outgoing)).toEqual([false, false])
    expect(atSeller[1].body).toBe('Торг уместен?')
  })

  it('открытая переписка отмечает прочитанными только чужие непрочитанные', async () => {
    signIn('seller')
    wire.fetchMessages.mockResolvedValue({ items: [fromBuyer], total: 1, page: 1, size: 50 })
    const { items } = await fetchMessages('d1')

    await markConversationRead('d1', items)

    expect(wire.markRead).toHaveBeenCalledWith('d1', ['m1'])
  })
})
