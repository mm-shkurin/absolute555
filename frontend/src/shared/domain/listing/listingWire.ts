// Форма объявления на проводе. В shared, а не в ленте: тот же объект приходит в выдаче
// профиля продавца и в подборках, и второй его экземпляр разошёлся бы с первым.
//
// Змеиный регистр — это провод, а не наш код: так отдаёт FastAPI, и переименование здесь
// скрыло бы расхождение с контрактом до первого запроса в проде.
export interface ListingWire {
  id: string
  brand: string
  model: string
  year: number
  price: number
  mileage_km: number | null
  engine_power_hp: number | null
  transmission: string | null
  city: string | null
  photo_url: string | null
  has_thickness_map: boolean
  vin_verified: boolean
  /** Канал поставки приходит полем, а не выводится из срока доставки: объявление под
   *  привоз без проставленного срока иначе выглядело бы машиной в наличии. */
  is_import: boolean
  /** Откуда везут и за сколько дней. Строкой, потому что показывается как есть. */
  import_country: string | null
  import_delivery_days: string | null
  /** Цена под ключ — с доставкой и растаможкой. Рядом с ценой, а не вместо неё. */
  turnkey_price: number | null
}
