import type { SupplierProfileWire } from '../../features/supplier/api/supplierApi'
import type { BidWire, RequestWire } from '../../features/importRequest/api/requestApi'
import type { ImportRequestCardWire, SupplierWire } from '../../features/importFeed/api/importApi'

const HOURS = 3600_000
const DAYS = 24 * HOURS

export const SUPPLIERS: SupplierWire[] = [
  {
    id: 's1',
    name: 'Восток-Авто',
    rating: 4.7,
    deliveries_count: 18,
    countries: ['Япония', 'Корея'],
    brands: ['Toyota', 'Lexus', 'Honda'],
    delivery_days: '45–70 дней',
    prepayment_percent: 30,
  },
  {
    id: 's2',
    name: 'АвтоЛинк',
    rating: 4.9,
    deliveries_count: 31,
    countries: ['Корея', 'Китай'],
    brands: ['Kia', 'Hyundai', 'Chery'],
    delivery_days: '30–50 дней',
    prepayment_percent: 20,
  },
]

export function supplierProfile(id: string): SupplierProfileWire {
  const base = SUPPLIERS.find((item) => item.id === id) ?? SUPPLIERS[0]
  return {
    ...base,
    reviews_count: 18,
    member_since: 'июня 2026',
    approved: true,
    about:
      'Вожу с аукционов Японии пятый год. Под заказ беру конкретный лот с аукционного листа, растаможку веду сам.',
    listings: [],
  }
}

export const REQUEST_CARDS: ImportRequestCardWire[] = [
  {
    id: 'r1',
    title: 'Toyota Land Cruiser 300',
    years: '2022–2023',
    extra: 'до 60 000 км',
    budget_max: 12000000,
    responses_count: 4,
    created_at: new Date(Date.now() - 8 * DAYS).toISOString(),
  },
  {
    id: 'r2',
    title: 'Honda Vezel',
    years: '2019–2021',
    extra: 'гибрид',
    budget_max: 2400000,
    responses_count: 1,
    created_at: new Date(Date.now() - 1 * DAYS).toISOString(),
  },
]

export function importRequest(id: string): RequestWire {
  return {
    id,
    title: 'Toyota Land Cruiser 300',
    years: '2022–2023',
    budget_max: 12000000,
    mileage_max_km: 60000,
    countries: ['Япония', 'Корея', 'ОАЭ'],
    wait_days_max: 90,
    comment:
      'Нужна комплектация не ниже средней, желательно светлый салон. Важна прозрачная растаможка с документами.',
    created_at: new Date(Date.now() - 8 * DAYS).toISOString(),
    active: true,
    owned_by_me: true,
  }
}

export const BIDS: BidWire[] = [
  {
    id: 'b1',
    supplier_id: 's1',
    supplier_name: 'Восток-Авто',
    rating: 4.7,
    deliveries_count: 18,
    comment: 'Есть лот 2022 года, 42 000 км, аукцион 4.5B. Срок 65 дней, документы полные.',
    price: 11400000,
    delivery_days: 65,
  },
  {
    id: 'b2',
    supplier_id: 's3',
    supplier_name: 'Сергей К.',
    rating: 4.2,
    deliveries_count: 6,
    comment: 'Могу из ОАЭ, но комплектация будет базовая. Срок меньше.',
    price: 10900000,
    delivery_days: 40,
  },
  {
    id: 'b3',
    supplier_id: 's2',
    supplier_name: 'АвтоЛинк',
    rating: 4.9,
    deliveries_count: 31,
    comment: 'В бюджет не уложусь, но могу предложить 2021 год в максималке.',
    price: 12800000,
    delivery_days: 70,
  },
]
