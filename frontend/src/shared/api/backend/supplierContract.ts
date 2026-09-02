// Профиль поставщика на проводе — зеркало `api-specs/importing.yaml`.
//
// Профиль проходит ту же модерацию, что и объявление: витрина, опубликованная без
// проверки, ничем не отличается от объявления, обходящего очередь.

export type SupplierStatus = 'draft' | 'pending' | 'published' | 'rejected'

export interface SupplierProfileWire {
  user_id: string
  company_name: string | null
  countries: string[]
  brands: string[]
  delivery_days_min: number | null
  delivery_days_max: number | null
  terms: string | null
  description: string | null
  status: SupplierStatus
  /** Причина отказа. Правка возвращает профиль в черновик и снимает её: иначе модератор
   *  видел бы «отклонён» рядом с уже исправленным текстом. */
  reject_reason: string | null
  updated_at: string | null
}

/** Любое подмножество полей. Статуса здесь нет: он меняется только отправкой в очередь
 *  и решением модератора. */
export interface SupplierProfileUpdate {
  company_name?: string
  countries?: string[]
  brands?: string[]
  delivery_days_min?: number
  delivery_days_max?: number
  terms?: string
  description?: string
}

export interface SupplierQueueWire {
  items: SupplierProfileWire[]
  total: number
}
