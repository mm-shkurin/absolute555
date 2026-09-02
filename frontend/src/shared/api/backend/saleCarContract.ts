// Объявление на проводе — зеркало `backend/app/schemas/sale_cars.py`.
//
// Змеиный регистр сохранён: так отдаёт FastAPI, и переименование скрыло бы расхождение
// с сервером до первого запроса в проде. Перевод в то, что рисует экран, — дело
// `shared/domain/listing`, а не этого файла.

/** Чем кончилось чтение фотографии СТС. `unreadable` лечится новым снимком,
 *  `undecoded` — только ручным вводом: поэтому они не слиты в одно значение. */
import type { ThicknessSummaryWire } from './thicknessContract'

export type AutofillState = 'none' | 'pending' | 'unreadable' | 'undecoded' | 'done'

/** Кто вписал значение. `seller` старше `ocr` и распознаванием не перетирается. */
export type FieldSource = 'ocr' | 'seller'

/** Машина в наличии или под привоз. Одна лента и один словарь статусов на оба вида:
 *  покупатель ищет машину, а не канал поставки. */
export type ListingKind = 'stock' | 'import'

export type SaleCarStatus = 'draft' | 'moderation' | 'published' | 'rejected' | 'withdrawn' | 'sold'

export interface AutofillWire {
  state: AutofillState
  brand_source: FieldSource | null
  model_source: FieldSource | null
  updated_at: string | null
}

/** Продавец в карточке: имя и аватар от провайдера входа. Рейтинг и число сделок
 *  приедут с отзывами — история 12. */
export interface SellerWire {
  user_id: string
  name: string | null
  avatar_url: string | null
  /** `null` у продавца без отзывов: ноль читался бы как «оценили на ноль». */
  rating: number | null
  reviews_count: number
  /** Принятые офферы, а не отзывы: сделка бывает без отзыва, и числа расходятся. */
  deals_count: number
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
  listing_kind: ListingKind
  /** Откуда везут. Только у привоза. */
  import_country: string | null
  /** Срок доставки в днях. Только у привоза. */
  delivery_days: number | null
  /** Цена под ключ — с доставкой, растаможкой и оформлением. Стоит рядом с ценой, а не
   *  вместо неё: сравнивают по цене, а платят эту. */
  turnkey_price: number | null
  reject_reason: string | null
  /** Причина отказа из фиксированного списка: текст говорит одному продавцу, что
   *  исправить, а метка отвечает, что отклоняют чаще всего. */
  reject_label: string | null
  published_at: string | null
  created_at: string | null
  updated_at: string | null
  preview_photo_url: string | null
  photos: PhotoWire[]
  autofill: AutofillWire | null
  seller: SellerWire | null
  /** Сводка карты замеров. `null` у объявления без единого замера. */
  thickness: ThicknessSummaryWire | null
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
  /** Поля привоза правятся как остальные; сам вид объявления — нет: он выбран при
   *  создании, и смена на живом объявлении означала бы, что покупатель торговался за
   *  машину другого канала. */
  import_country?: string
  delivery_days?: number
  turnkey_price?: number
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
