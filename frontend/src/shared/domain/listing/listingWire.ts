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
  import_delivery_days: string | null
}
