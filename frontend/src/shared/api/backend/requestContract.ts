// Заявка покупателя и отклики поставщиков — зеркало `api-specs/importing.yaml`.
//
// Заявка живёт своей таблицей: у неё нет ни машины, ни фотографий, ни продавца — это
// спрос, а не объявление.

export type BuyerRequestStatus = 'open' | 'closed'

export interface BuyerRequestWire {
  request_id: string
  user_id: string
  /** Название марки, а не идентификатор: заявку читают, а не фильтруют по ней. */
  brand: string | null
  model: string | null
  year_from: number | null
  budget_max: number | null
  comment: string | null
  status: BuyerRequestStatus
  responses_count: number
  created_at: string
}

export interface BuyerRequestCreate {
  brand_id?: string
  model_id?: string
  year_from?: number
  budget_max?: number
  comment?: string
}

export interface BuyerRequestPageWire {
  items: BuyerRequestWire[]
  total: number
  page: number
  size: number
}

export interface SupplierResponseWire {
  response_id: string
  request_id: string
  supplier_id: string
  price: number
  delivery_days: number
  comment: string | null
  updated_at: string | null
}

export interface SupplierResponseCreate {
  price: number
  delivery_days: number
  comment?: string
}
