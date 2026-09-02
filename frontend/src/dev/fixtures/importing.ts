import type { SupplierWire } from '../../features/importFeed/api/importApi'

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
