// Перевод черновика между экраном и проводом.
//
// Экран держит каждое поле вместе с его происхождением: подставленное распознаванием надо
// перечитать, введённое руками — уже прочитано автором. Сервер хранит происхождение только
// у марки и модели (`autofill.brand_source`, `model_source`), поэтому у остальных полей
// оно живёт до перезагрузки страницы и не восстанавливается.
import type {
  FieldSource as WireSource,
  SaleCarPatch,
  SaleCarWire,
} from '../../../shared/api/backend/saleCarContract'
import type { Draft, DraftField, FieldSource } from './draft'
import { EMPTY_DRAFT } from './draft'

// `ocr` на проводе означает «прочитано с документа»: распознавание СТС — единственный
// источник, который сервер отличает от продавца.
const SOURCE: Record<WireSource, FieldSource> = { ocr: 'document', seller: 'manual' }

function field(value: string | number | null, source: WireSource | null): DraftField {
  return {
    value: value === null ? '' : String(value),
    source: source ? SOURCE[source] : 'manual',
  }
}

const text = (value: string | number | null): string => (value === null ? '' : String(value))

export function toDraft(car: SaleCarWire): Draft {
  return {
    ...EMPTY_DRAFT,
    brand: field(car.brand ?? car.mark_raw, car.autofill?.brand_source ?? null),
    model: field(car.model ?? car.model_raw, car.autofill?.model_source ?? null),
    // Год, коробка, мощность и VIN приезжают из того же распознавания, но своего
    // происхождения на проводе не имеют: сервер помечает только марку и модель.
    year: field(car.year, car.autofill?.brand_source ?? null),
    transmission: field(car.transmission, car.autofill?.brand_source ?? null),
    enginePower: field(car.engine_power, car.autofill?.brand_source ?? null),
    vin: field(car.vin, car.vin ? 'ocr' : null),
    price: text(car.price),
    mileage: text(car.milleage),
    phone: text(car.phone_number),
    description: text(car.description),
    photosCount: car.photos.length,
  }
}

function put(patch: SaleCarPatch, key: keyof SaleCarPatch, value: string, asNumber = false) {
  const trimmed = value.trim()
  if (!trimmed) return
  if (!asNumber) {
    Object.assign(patch, { [key]: trimmed })
    return
  }
  const parsed = Number(trimmed)
  // Нечисло в числовом поле не уходит на сервер: он отвергнет весь запрос, и человек
  // потеряет остальные правки из-за одной опечатки в пробеге.
  if (Number.isFinite(parsed)) Object.assign(patch, { [key]: parsed })
}

/** Только заполненное. Марка и модель уходят как `mark_raw`/`model_raw`: справочник
 *  подставляется на сервере, а идентификаторов у экрана пока нет — их даст выбор из
 *  списка марок, когда он появится в мастере. */
export function toPatch(draft: Draft): SaleCarPatch {
  const patch: SaleCarPatch = {}
  put(patch, 'mark_raw', draft.brand.value)
  put(patch, 'model_raw', draft.model.value)
  put(patch, 'year', draft.year.value, true)
  put(patch, 'transmission', draft.transmission.value)
  put(patch, 'engine_power', draft.enginePower.value, true)
  put(patch, 'vin', draft.vin.value)
  put(patch, 'price', draft.price, true)
  put(patch, 'milleage', draft.mileage, true)
  put(patch, 'phone_number', draft.phone)
  put(patch, 'description', draft.description)
  return patch
}
