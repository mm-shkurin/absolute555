// Перевод объявления с провода в то, что читает человек в карточке. Чистые функции: числа
// форматируются одинаково в ленте, в карточке и в офферах, а неразрывный пробел в цене
// нельзя увидеть в коде — только в тесте.
import { formatAmount, formatPrice, pluralize } from '../../format/money'
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
  isImport: boolean
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
  const isImport = listing.import_delivery_days !== null
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
    isImport,
  }
}

export function countLabel(total: number): string {
  return `${formatAmount(total)} ${pluralize(total, 'объявление', 'объявления', 'объявлений')}`
}
