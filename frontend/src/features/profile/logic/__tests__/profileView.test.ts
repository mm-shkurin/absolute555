import { describe, expect, it } from 'vitest'
import { toProfileView } from '../profileView'
import type { ProfileWire } from '../../api/profileApi'

const wire: ProfileWire = {
  id: 'u1',
  name: 'Михаил',
  rating: 4.8,
  deals_count: 12,
  reviews_count: 9,
  member_since: 'марта',
  listings_count: 6,
  rejected_listings: 1,
  incoming_offers: 3,
  outgoing_offers: 4,
  unread_messages: 2,
  supplier_status: 'pending',
  supplier_applied_at: new Date(2026, 7, 24).toISOString(),
  import_requests: [
    {
      id: 'r1',
      title: 'Toyota Land Cruiser 300, 2022–2023',
      budget_max: 12000000,
      created_at: new Date(2026, 7, 20).toISOString(),
      responses_count: 4,
      active: true,
    },
  ],
}

describe('профиль', () => {
  it('собирает строку под именем из оценки, сделок и срока', () => {
    expect(toProfileView(wire).line).toBe('4,8 · 12 сделок · на площадке с марта')
  })

  it('в плитках показывает, что ждёт решения', () => {
    const shortcuts = toProfileView(wire).shortcuts
    expect(shortcuts.map((item) => item.meta)).toEqual([
      '6 · 1 отклонено',
      '3 полученных, 4 отправленных',
      '2 непрочитанных',
      '9 отзывов · средняя 4,8',
    ])
  })

  it('пустой раздел говорит об этом прямо, а не молчит', () => {
    const view = toProfileView({
      ...wire,
      listings_count: 0,
      rejected_listings: 0,
      unread_messages: 0,
      reviews_count: 0,
    })
    expect(view.shortcuts[0].meta).toBe('ещё ни одного')
    expect(view.shortcuts[2].meta).toBe('всё прочитано')
    expect(view.shortcuts[3].meta).toBe('отзывов пока нет')
  })

  it('поданная заявка показывает дату, неподанная — приглашение', () => {
    expect(toProfileView(wire).supplier).toEqual({
      badge: 'заявка на рассмотрении с 24 августа',
      tone: 'wait',
      invitation: false,
      approved: false,
    })
    expect(
      toProfileView({ ...wire, supplier_status: 'none', supplier_applied_at: null }).supplier,
    ).toEqual({ badge: null, tone: 'info', invitation: true, approved: false })
  })

  it('одобренной роли профиль поставщика уже принадлежит', () => {
    const view = toProfileView({ ...wire, supplier_status: 'approved', supplier_applied_at: null })
    expect(view.supplier.approved).toBe(true)
  })

  it('заявка на привоз называет бюджет, дату и число откликов', () => {
    const [request] = toProfileView(wire).requests
    expect(request.meta).toBe('бюджет до 12\u202F000\u202F000 ₽ · создана 20 августа')
    expect(request.responses).toBe('4 отклика')
    expect(request.badge).toBe('активна')
  })
})
