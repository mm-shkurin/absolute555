import { describe, expect, it } from 'vitest'
import { toListingDetailView, toOfferRows, viewerMode } from '../listingDetail'
import { dealsLabel, stars } from '../../../../shared/format/rating'
import type { ListingDetailWire } from '../../api/listingApi'

const wire: ListingDetailWire = {
  id: 'l1',
  brand: 'Lexus',
  model: 'LX 570',
  year: 2012,
  price: 4020000,
  mileage_km: 180000,
  engine_power_hp: 367,
  transmission: 'АКПП',
  city: 'Омск',
  vin_masked: 'JTJHY00W***40218',
  description: 'Машина в семье с 2016 года.',
  photo_urls: [],
  photos_total: 12,
  status: 'published',
  sold_at: null,
  is_import: false,
  import_country: null,
  delivery_days: null,
  turnkey_price: null,
  thickness_map_complete: true,
  has_thickness_map: true,
  phone_available: true,
  chat_allowed: true,
  owned_by_me: false,
  moderation: null,
  published_at: new Date(2026, 7, 22).toISOString(),
  views_count: 1284,
  opens_count: 96,
  offers_count: 4,
  measured_panels: 11,
  total_panels: 13,
  seller: { id: 'u1', name: 'Михаил', rating: 4.8, deals_count: 12 },
  offers: null,
}

describe('карточка объявления', () => {
  it('собирает сводку из года, пробега и города', () => {
    expect(toListingDetailView(wire).summary).toBe('2012 · 180\u202F000 км · Омск')
  })

  it('показывает замаскированный VIN как есть и помечает его моноширинным', () => {
    const vin = toListingDetailView(wire).specs.find((row) => row.label === 'VIN')
    expect(vin).toEqual({ label: 'VIN', value: 'JTJHY00W***40218', mono: true })
  })

  it('владелец видит своё объявление своей колонкой, в том числе проданное', () => {
    expect(viewerMode({ ...wire, owned_by_me: true }, true)).toBe('owner')
    expect(viewerMode({ ...wire, owned_by_me: true, status: 'sold' }, true)).toBe('owner')
  })

  it('считает воронку и заполненность карты для владельца', () => {
    const view = toListingDetailView(wire)
    expect(view.stats.map((stat) => `${stat.value} ${stat.label}`)).toEqual([
      '1 284 показов',
      '96 открытий',
      '4 офферов',
    ])
    expect(view.thicknessPercent).toBe(85)
    expect(view.publishedOn).toBe('22 августа')
  })

  it('проданное объявление даёт режим «продано» даже вошедшему', () => {
    expect(viewerMode({ ...wire, status: 'sold' }, true)).toBe('sold')
    expect(viewerMode(wire, true)).toBe('buyer')
    expect(viewerMode(wire, false)).toBe('guest')
  })

  it('рисует звёзды по рейтингу, а не пять подряд', () => {
    expect(stars(4.8)).toBe('★★★★★')
    expect(stars(3.2)).toBe('★★★☆☆')
    expect(stars(null)).toBe('☆☆☆☆☆')
    expect(dealsLabel(12)).toBe('12 сделок')
    expect(dealsLabel(2)).toBe('2 сделки')
  })

  it('свежие предложения датируются словом, старые — числом', () => {
    const now = new Date(2026, 7, 28, 18, 0)
    const rows = toOfferRows(
      [
        { id: 'o1', amount: 3850000, created_at: new Date(2026, 7, 28, 14, 55).toISOString() },
        { id: 'o2', amount: 3700000, created_at: new Date(2026, 7, 27, 19, 2).toISOString() },
        { id: 'o3', amount: 3600000, created_at: new Date(2026, 7, 20, 9, 41).toISOString() },
      ],
      now,
    )
    expect(rows[0].when).toBe('сегодня, 14:55')
    expect(rows[1].when).toBe('вчера, 19:02')
    expect(rows[2].when).toBe('20 августа, 09:41')
    expect(rows[0].amount).toBe('3\u202F850\u202F000 ₽')
  })

  it('привоз дописывает к характеристикам страну, срок и цену под ключ', () => {
    const view = toListingDetailView(
      {
        ...wire,
        is_import: true,
        import_country: 'Япония',
        delivery_days: 60,
        turnkey_price: 6690000,
      },
    )
    expect(view.specs.map((row) => row.label)).toContain('Откуда везут')
    expect(view.specs.find((row) => row.label === 'Срок доставки')?.value).toBe('60 дней')
    expect(view.specs.find((row) => row.label === 'Цена под ключ')?.value).toContain('690')
  })

  it('машина в наличии строк привоза не получает', () => {
    const view = toListingDetailView(wire)
    expect(view.specs.map((row) => row.label)).not.toContain('Откуда везут')
  })
})

describe('решение модератора (история 22)', () => {
  it('показывает владельцу, когда решили', () => {
    const view = toListingDetailView({
      ...wire,
      moderation: { decided_at: new Date(2026, 8, 3, 12).toISOString(), decided_by: null },
    })

    expect(view.decidedOn).toBe('3 сентября')
    // Имя сервер владельцу не отдаёт — и экран не достраивает его по роли.
    expect(view.decidedBy).toBeNull()
  })

  it('называет модератору того, кто решил', () => {
    const view = toListingDetailView({
      ...wire,
      moderation: {
        decided_at: new Date(2026, 8, 3, 12).toISOString(),
        decided_by: { user_id: 'm1', name: 'Иван Петров' },
      },
    })

    expect(view.decidedBy).toBe('Иван Петров')
  })

  it('молчит про объявление, по которому решения не было', () => {
    const view = toListingDetailView({ ...wire, moderation: null })

    expect(view.decidedOn).toBeNull()
    expect(view.decidedBy).toBeNull()
  })
})
