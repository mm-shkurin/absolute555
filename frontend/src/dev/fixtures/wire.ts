// Фикстуры в форме настоящего провода.
//
// Прежние заглушки отвечали на выдуманные адреса (`/listings`, `/chats`, `/users/me`), и
// когда экраны переехали на `/sale_car`, `/chat`, `/user/profile`, мок замолчал вместе с
// браузерными сценариями. Здесь те же демонстрационные данные, но в формах из
// `api-specs/`: расхождение с сервером теперь видно и в заглушке.
import type { FeedCardWire, FeedPageWire } from '../../shared/api/backend/feedContract'
import type { OfferWire } from '../../shared/api/backend/offerContract'
import type { SaleCarWire, SellerWire } from '../../shared/api/backend/saleCarContract'
import { FEED, IMPORT_CARS } from './cars'
import { offers as offerFixtures } from './people'
import { thicknessSummary } from './thickness'

const HOURS = 3_600_000

export const VIEWER_ID = 'u1'

/** Продавец приезжает с агрегатом: рейтинг, отзывы и сделки живут в блоке `seller`, а
 *  не отдельным вызовом. `null` у продавца без отзывов — заглушка держит и этот случай. */
export function seller(
  userId: string,
  name: string | null,
  rating: number | null,
  reviewsCount: number,
  dealsCount: number,
): SellerWire {
  return {
    user_id: userId,
    name,
    avatar_url: null,
    rating,
    reviews_count: reviewsCount,
    deals_count: dealsCount,
  }
}

export function toCard(car: (typeof FEED)[number]): FeedCardWire {
  return {
    sale_car_id: car.id,
    brand: car.brand,
    model: car.model,
    year: car.year,
    price: car.price,
    milleage: car.mileage_km,
    transmission: car.transmission,
    status: 'published',
    preview_photo_url: car.photo_url,
    published_at: new Date(Date.now() - 30 * HOURS).toISOString(),
    thickness: thicknessSummary(car.id),
    // Привозные позиции живут в тех же фикстурах, отличаясь только каналом: лента одна
    // на оба вида, и заглушка обязана изображать именно это.
    listing_kind: car.is_import ? 'import' : 'stock',
    import_country: car.import_country,
    // Срок на проводе — число дней; строка «55–70 дней» живёт только в старых
    // выдуманных фикстурах и до сервера не доезжает.
    delivery_days: car.is_import ? 60 : null,
    turnkey_price: car.turnkey_price,
  }
}

const number = (value: string | null): number | null => {
  const parsed = Number(value ?? '')
  return value && Number.isFinite(parsed) ? parsed : null
}

// Фильтры работают по-настоящему: иначе пустое состояние ленты — единственное, которое
// нельзя увидеть, а именно оно чаще всего и ломается.
export function feedPage(query: URLSearchParams): FeedPageWire {
  const priceFrom = number(query.get('price_from'))
  const priceTo = number(query.get('price_to'))
  const yearFrom = number(query.get('year_from'))
  const gearboxes = query.getAll('transmission')
  const mapped = query.get('with_thickness_map') === 'true'

  const kind = query.get('kind')
  let items = [...FEED, ...IMPORT_CARS].map(toCard).filter((card) => {
    if (kind && card.listing_kind !== kind) return false
    if (priceFrom !== null && (card.price ?? 0) < priceFrom) return false
    if (priceTo !== null && (card.price ?? 0) > priceTo) return false
    if (yearFrom !== null && (card.year ?? 0) < yearFrom) return false
    if (gearboxes.length > 0 && !gearboxes.includes(card.transmission ?? '')) return false
    if (mapped && !card.thickness?.is_complete) return false
    return true
  })

  const sort = query.get('sort') ?? 'newest'
  if (sort === 'price_asc') items = items.toSorted((a, b) => (a.price ?? 0) - (b.price ?? 0))
  if (sort === 'price_desc') items = items.toSorted((a, b) => (b.price ?? 0) - (a.price ?? 0))

  const size = number(query.get('size')) ?? 20
  const page = number(query.get('page')) ?? 1
  return { items: items.slice((page - 1) * size, page * size), total: items.length, page, size }
}

export function saleCar(saleCarId: string): SaleCarWire | null {
  const card = FEED.map(toCard).find((item) => item.sale_car_id === saleCarId)
  if (!card) return null
  return {
    ...card,
    // Своим считается третье объявление, а не первое: первое открывает лента в браузерных
    // сценариях, и владельцу вместо колонки с торгом показалась бы панель управления.
    user_id: saleCarId === 'l3' ? VIEWER_ID : 'u9',
    vin: 'XW8ZZZ61ZJG012345',
    body_number: null,
    mark_raw: null,
    model_raw: null,
    engine_power: 249,
    task_id: null,
    task_status: null,
    phone_number: '+7 913 000-00-00',
    description: 'Один владелец, сервисная книжка, зимняя резина в комплекте.',
    reject_reason: null,
    reject_label: null,
    created_at: new Date(Date.now() - 40 * HOURS).toISOString(),
    updated_at: new Date(Date.now() - 30 * HOURS).toISOString(),
    photos: [],
    autofill: { state: 'done', brand_source: 'ocr', model_source: 'ocr', updated_at: null },
    seller: seller('u9', 'Дмитрий', 4.8, 12, 15),
    thickness: thicknessSummary(saleCarId),
  }
}

const MY_STATUSES: SaleCarWire['status'][] = [
  'draft',
  'moderation',
  'published',
  'rejected',
  // Снятое держится в заглушке отдельно: без него единственное состояние, где продавцу
  // предлагают вернуть объявление в продажу, нельзя увидеть ни разу.
  'withdrawn',
  'sold',
]

export function myCars(): SaleCarWire[] {
  return FEED.map(toCard)
    .slice(0, MY_STATUSES.length)
    .map((card, index) => {
      const car = saleCar(card.sale_car_id) as SaleCarWire
      const status = MY_STATUSES[index]
      const rejected = status === 'rejected'
      car.status = status
      car.user_id = VIEWER_ID
      car.reject_reason = rejected ? 'Видны номера на фотографиях' : null
      car.reject_label = rejected ? 'plate_or_face_visible' : null
      return car
    })
}

/** Отправленные: право на отзыв живёт здесь. Один принятый оффер уже с отзывом, чтобы
 *  экран показывал обе кнопки — «оставить» и «изменить». */
export function myOffers(): OfferWire[] {
  return offerFixtures('outgoing').items.map((offer, index) => ({
    offer_id: offer.id,
    sale_car_id: offer.listing_id,
    user_id: VIEWER_ID,
    price: offer.amount,
    status: offer.status,
    expires_at: offer.expires_at,
    created_at: offer.created_at,
    updated_at: null,
    can_review: offer.status === 'accepted',
    review_id: offer.status === 'accepted' && index % 2 === 1 ? `rv-${offer.id}` : null,
  }))
}

/** Полученные: оценка односторонняя, поэтому оба поля пусты всегда. */
export function carOffers(saleCarId: string): OfferWire[] {
  return offerFixtures('incoming').items.map((offer) => ({
    offer_id: offer.id,
    sale_car_id: saleCarId,
    user_id: 'u9',
    price: offer.amount,
    status: offer.status,
    expires_at: offer.expires_at,
    created_at: offer.created_at,
    updated_at: null,
    can_review: false,
    review_id: null,
  }))
}
