// Перевод карточки с провода в то, что видит человек, и одно решение: в каком режиме
// показывать правую колонку. Режим считается здесь, а не в разметке — иначе три экрана
// мокапа превратились бы в три ветки JSX, разъезжающиеся при первой же правке.
import { formatAmount, formatPrice } from '../../../shared/format/money'
import { dealsLabel, stars } from '../../../shared/format/rating'
import type { ListingDetailWire, OfferWire } from '../api/listingApi'

export type ViewerMode = 'guest' | 'buyer' | 'sold' | 'owner'

export interface SpecRow {
  label: string
  value: string
  mono?: boolean
}

export interface OfferRow {
  id: string
  when: string
  amount: string
}

export interface ListingDetailView {
  id: string
  title: string
  summary: string
  price: string
  photos: string[]
  photosTotal: number
  description: string | null
  specs: SpecRow[]
  hasThicknessMap: boolean
  thicknessBadge: string | null
  sellerId: string
  sellerName: string
  sellerStars: string
  sellerRating: string
  soldOn: string | null
  phoneAvailable: boolean
  chatAllowed: boolean
  publishedOn: string | null
  /** Когда модератор решил по объявлению и, если смотрит модератор, кто именно.
   *  Продавцу сервер имени не отдаёт, поэтому здесь оно просто пусто. */
  decidedOn: string | null
  decidedBy: string | null
  stats: { label: string; value: string }[]
  measuredPanels: number
  totalPanels: number
  thicknessPercent: number
}

// Владелец видит своё объявление и после продажи: архивная карточка — тоже его, и
// счётчики по ней остаются единственным итогом сделки.
export function viewerMode(wire: ListingDetailWire, signedIn: boolean): ViewerMode {
  if (wire.owned_by_me) return 'owner'
  if (wire.status === 'sold') return 'sold'
  return signedIn ? 'buyer' : 'guest'
}

const DASH = '—'

function specs(wire: ListingDetailWire): SpecRow[] {
  return [
    { label: 'Марка и модель', value: `${wire.brand} ${wire.model}`.trim() },
    { label: 'Год выпуска', value: String(wire.year) },
    {
      label: 'Пробег',
      value: wire.mileage_km === null ? DASH : `${formatAmount(wire.mileage_km)} км`,
    },
    { label: 'Коробка', value: wire.transmission ?? DASH },
    {
      label: 'Мощность',
      value: wire.engine_power_hp === null ? DASH : `${wire.engine_power_hp} л.с.`,
    },
    // VIN приходит уже замаскированным: полный номер в открытой карточке — подарок
    // перекупу, который клонирует объявление вместе с историей машины.
    { label: 'VIN', value: wire.vin_masked ?? DASH, mono: true },
    // Строки привоза дописываются, а не заменяют существующие: канал добавляет к машине
    // факты, а не превращает её в другую сущность.
    ...(wire.is_import ? importSpecs(wire) : []),
  ]
}

function importSpecs(wire: ListingDetailWire): SpecRow[] {
  return [
    { label: 'Откуда везут', value: wire.import_country ?? DASH },
    {
      label: 'Срок доставки',
      value: wire.delivery_days === null ? DASH : `${wire.delivery_days} дней`,
    },
    {
      label: 'Цена под ключ',
      // Ноль читался бы как «доставка бесплатно», поэтому неназванная цена — прочерк.
      value: wire.turnkey_price === null ? DASH : formatPrice(wire.turnkey_price),
    },
  ]
}

function summary(wire: ListingDetailWire): string {
  const parts = [String(wire.year)]
  if (wire.mileage_km !== null) parts.push(`${formatAmount(wire.mileage_km)} км`)
  if (wire.city) parts.push(wire.city)
  return parts.join(' · ')
}

const DATE = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const TIME = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

export function toListingDetailView(wire: ListingDetailWire): ListingDetailView {
  return {
    id: wire.id,
    title: `${wire.brand} ${wire.model}`.trim(),
    summary: summary(wire),
    price: formatPrice(wire.price),
    photos: wire.photo_urls,
    photosTotal: wire.photos_total,
    description: wire.description,
    specs: specs(wire),
    hasThicknessMap: wire.has_thickness_map,
    thicknessBadge: wire.thickness_map_complete
      ? 'полная карта'
      : wire.has_thickness_map
        ? 'частичная карта'
        : null,
    sellerId: wire.seller.id,
    sellerName: wire.seller.name,
    sellerStars: stars(wire.seller.rating),
    sellerRating:
      wire.seller.rating === null
        ? 'пока без отзывов'
        : `${wire.seller.rating.toFixed(1).replace('.', ',')} · ${dealsLabel(wire.seller.deals_count)}`,
    soldOn: wire.sold_at ? DATE.format(new Date(wire.sold_at)) : null,
    phoneAvailable: wire.phone_available,
    chatAllowed: wire.chat_allowed,
    publishedOn: wire.published_at ? DATE.format(new Date(wire.published_at)) : null,
    decidedOn: wire.moderation?.decided_at ? DATE.format(new Date(wire.moderation.decided_at)) : null,
    decidedBy: wire.moderation?.decided_by?.name ?? null,
    stats: [
      { label: 'показов', value: formatAmount(wire.views_count) },
      { label: 'открытий', value: formatAmount(wire.opens_count) },
      { label: 'офферов', value: formatAmount(wire.offers_count) },
    ],
    measuredPanels: wire.measured_panels,
    totalPanels: wire.total_panels,
    thicknessPercent:
      wire.total_panels === 0 ? 0 : Math.round((wire.measured_panels / wire.total_panels) * 100),
  }
}

export function toOfferRows(offers: OfferWire[], now: Date): OfferRow[] {
  return offers.map((offer) => {
    const at = new Date(offer.created_at)
    return {
      id: offer.id,
      when: `${dayWord(at, now)}, ${TIME.format(at)}`,
      amount: formatPrice(offer.amount),
    }
  })
}

// «Сегодня в 14:55» человек соотносит с торгом мгновенно, полная дата требует вычитания.
function dayWord(at: Date, now: Date): string {
  const days = Math.round((startOfDay(now).getTime() - startOfDay(at).getTime()) / 86_400_000)
  if (days <= 0) return 'сегодня'
  if (days === 1) return 'вчера'
  return DATE.format(at)
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}
