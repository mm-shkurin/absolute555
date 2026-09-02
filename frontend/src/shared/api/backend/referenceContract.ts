// Справочник марок и моделей — зеркало `backend/app/schemas/catalog.py`.
export interface BrandWire {
  brand_id: string
  slug: string
  name_ru: string
  name_en: string
  is_popular: boolean
}

export interface CarModelWire {
  model_id: string
  brand_id: string
  slug: string
  name: string
}
