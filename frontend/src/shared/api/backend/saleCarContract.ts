// Объявление на проводе — зеркало `backend/app/schemas/sale_cars.py`.
//
// Змеиный регистр сохранён: так отдаёт FastAPI, и переименование скрыло бы расхождение
// с сервером до первого запроса в проде. Перевод в то, что рисует экран, — дело
// `shared/domain/listing`, а не этого файла.

/** Чем кончилось чтение фотографии СТС. `unreadable` лечится новым снимком,
 *  `undecoded` — только ручным вводом: поэтому они не слиты в одно значение. */
export type AutofillState = 'none' | 'pending' | 'unreadable' | 'undecoded' | 'done'

/** Кто вписал значение. `seller` старше `ocr` и распознаванием не перетирается. */
export type FieldSource = 'ocr' | 'seller'

export type SaleCarStatus = 'draft' | 'moderation' | 'published' | 'rejected' | 'withdrawn' | 'sold'

export interface AutofillWire {
  state: AutofillState
  brand_source: FieldSource | null
  model_source: FieldSource | null
  updated_at: string | null
}

export interface PhotoWire {
  photo_id: string
  url: string
  preview_url: string
}

export interface SaleCarWire {
  sale_car_id: string
  user_id: string
  vin: string | null
  /** Из справочника, если марка распознана и связана. */
  brand: string | null
  model: string | null
  /** Как прочиталось с документа, до связывания со справочником. */
  mark_raw: string | null
  model_raw: string | null
  year: number | null
  transmission: string | null
  engine_power: number | null
  task_id: string | null
  task_status: string | null
  phone_number: string | null
  price: number | null
  /** Пробег. Опечатка в имени поля — на сервере, и повторена здесь намеренно. */
  milleage: number | null
  description: string | null
  status: SaleCarStatus
  reject_reason: string | null
  published_at: string | null
  created_at: string | null
  updated_at: string | null
  car_data: Record<string, unknown> | null
  preview_photo_url: string | null
  photos: PhotoWire[]
  autofill: AutofillWire | null
}

/** Любое подмножество полей. Сервер отвергает неизвестные ключи, а не игнорирует их,
 *  поэтому `status` сюда не входит: он меняется только переходами жизненного цикла. */
export interface SaleCarPatch {
  vin?: string
  phone_number?: string
  price?: number
  milleage?: number
  description?: string
  brand_id?: string
  model_id?: string
  mark_raw?: string
  model_raw?: string
  year?: number
  transmission?: string
  engine_power?: number
}

export interface GalleryWire {
  sale_car_id: string
  photos: PhotoWire[]
  limit: number
}

export interface StatusChangedWire {
  sale_car_id: string
  status: SaleCarStatus
  updated_at: string
}

/** Ссылка на скан СТС живёт недолго и выдаётся только владельцу и модератору. */
export interface DocumentLinkWire {
  url: string
  expires_at: string
}

/** Ответ на загрузку скана: принято, но не сделано — чтение идёт в очереди. */
export interface StsAcceptedWire {
  sale_car_id: string
  autofill: AutofillWire
}
