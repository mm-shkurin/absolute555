// Перевод объявления с провода в то, что читает человек в карточке. Чистые функции: числа
// форматируются одинаково в ленте, в карточке и в офферах, а неразрывный пробел в цене
// нельзя увидеть в коде — только в тесте.
import { formatAmount, formatPrice, pluralize } from '../../format/money'
import type { Grade } from '../../thicknessMap/logic/bodyPanels'
import { GRADE_COLOR } from '../../thicknessMap/logic/gradeLabels'
import type { ListingWire } from './listingWire'

export interface ListingView {
  id: string
  title: string
  year: string
  price: string
  spec: string
  city: string
  vinNote: string
  photoUrl: string | null
  hasThicknessMap: boolean
  /** Цвет каждой панели по порядку; пусто — полоску не рисовать. */
  paintStrip: string[]
  isImport: boolean
  /** Откуда везут — пустая строка у машины в наличии. */
  importFrom: string
  /** Цена под ключ, подписью. `null` — сервер её не назвал. */
  turnkey: string | null
}

function specLine(listing: ListingWire): string {
  const parts: string[] = []
  if (listing.import_delivery_days) parts.push(`срок доставки ${listing.import_delivery_days}`)
  else if (listing.mileage_km !== null) parts.push(`${formatAmount(listing.mileage_km)} км`)
  if (listing.engine_power_hp !== null) parts.push(`${listing.engine_power_hp} л.с.`)
  if (listing.transmission) parts.push(listing.transmission)
  return parts.join(' · ')
}

export function toListingView(listing: ListingWire): ListingView {
  const isImport = listing.is_import
  return {
    id: listing.id,
    title: `${listing.brand} ${listing.model}`.trim(),
    year: String(listing.year),
    price: formatPrice(listing.price),
    spec: specLine(listing),
    city: listing.city ?? '—',
    // Машина под заказ ещё за границей: VIN у неё появится только после растаможки, и
    // «VIN не проверен» читалось бы как претензия к продавцу, а не как факт о канале.
    vinNote: isImport ? 'без VIN' : listing.vin_verified ? 'VIN проверен' : 'VIN не проверен',
    photoUrl: listing.photo_url,
    hasThicknessMap: listing.has_thickness_map,
    paintStrip: paintStrip(listing.thickness_panels ?? []),
    isImport,
    importFrom: isImport ? (listing.import_country ?? '') : '',
    // Цена под ключ показывается только у привоза и только когда сервер её назвал: ноль
    // читался бы как «доставка бесплатно».
    turnkey:
      isImport && listing.turnkey_price !== null
        ? `${formatPrice(listing.turnkey_price)} под ключ`
        : null,
  }
}

export function countLabel(total: number): string {
  return `${formatAmount(total)} ${pluralize(total, 'объявление', 'объявления', 'объявлений')}`
}

function isGrade(status: string | null): status is Grade {
  return status !== null && Object.hasOwn(GRADE_COLOR, status)
}

/** Полоска рисуется, только если замерена хоть одна панель: тринадцать серых отрезков
 *  сказали бы «проверено и пусто», а это «не проверяли». */
function paintStrip(panels: (string | null)[]): string[] {
  if (!panels.some(Boolean)) return []
  return panels.map((status) => (isGrade(status) ? GRADE_COLOR[status] : GRADE_COLOR.none))
}
