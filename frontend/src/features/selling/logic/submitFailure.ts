// Почему объявление не ушло на модерацию.
//
// Отдельно от общего `failureText`: тот переводит код в одну фразу, а здесь отказ несёт
// список незаполненных полей — и человек должен прочитать, чего именно не хватает, а не
// «заполните объявление».
import { isHttpError } from '../../../shared/api/httpClient'
import { failureText } from '../../../shared/api/failureText'

const FIELD_LABEL: Record<string, string> = {
  vin: 'VIN',
  price: 'цена',
  milleage: 'пробег',
  phone_number: 'телефон',
  year: 'год выпуска',
  brand_id: 'марка',
  model_id: 'модель',
  transmission: 'коробка',
  engine_power: 'мощность',
  description: 'описание',
  photos: 'фотографии',
  // Привоз (история 17): у машины, которой в стране нет, эти три поля обязательны, а
  // VIN и СТС — нет: VIN появится только после растаможки.
  import_country: 'страна, откуда везут',
  delivery_days: 'срок доставки',
  turnkey_price: 'цена под ключ',
}

export function submitFailureText(error: unknown): string {
  if (isHttpError(error) && error.errorCode === 'LISTING_INCOMPLETE') {
    const missing = error.details?.missing_fields
    const named = Array.isArray(missing)
      ? missing.map((field) => FIELD_LABEL[String(field)] ?? String(field))
      : []
    if (named.length > 0) return `Не хватает: ${named.join(', ')}.`
  }
  return failureText(error)
}
