// Справочник марок и моделей для заглушки. Три марки вместо семидесяти одной: экран
// проверяется выбором, а не полнотой каталога — полный список живёт на сервере.
import type { BrandWire, CarModelWire } from '../../shared/api/backend/referenceContract'

export const BRANDS: BrandWire[] = [
  { brand_id: 'b-toyota', slug: 'toyota', name_ru: 'Toyota', name_en: 'Toyota', is_popular: true },
  { brand_id: 'b-lexus', slug: 'lexus', name_ru: 'Lexus', name_en: 'Lexus', is_popular: true },
  { brand_id: 'b-mazda', slug: 'mazda', name_ru: 'Mazda', name_en: 'Mazda', is_popular: false },
]

const BY_BRAND: Record<string, string[]> = {
  'b-toyota': ['Camry', 'Land Cruiser', 'RAV4'],
  'b-lexus': ['LX 570', 'RX 350'],
  'b-mazda': ['CX-5', 'Mazda6'],
}

export function MODELS(brandId: string): CarModelWire[] {
  return (BY_BRAND[brandId] ?? []).map((name, index) => ({
    model_id: `${brandId}-m${index}`,
    brand_id: brandId,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    name,
  }))
}
