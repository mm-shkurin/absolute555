// Сборка карточки объявления из того, что сервер отдаёт сегодня.
//
// Карточка на экране богаче ответа сервера: продавца с рейтингом, счётчики показов, чат и
// карту замеров он не отдаёт вовсе. Недостающее заполняется нейтрально и в одном месте —
// чтобы, когда ручки появятся, было видно, что именно менять.
import type { OfferWire as BackendOffer } from '../../../shared/api/backend/offerContract'
import type { SaleCarWire } from '../../../shared/api/backend/saleCarContract'
import { maskVin } from '../../../shared/domain/listing/vin'
import type { ListingDetailWire, OfferWire } from '../api/listingApi'

const TOTAL_PANELS = 11

function toOffer(offer: BackendOffer): OfferWire {
  return { id: offer.offer_id, amount: offer.price, created_at: offer.created_at }
}

export function toListingDetailWire(
  car: SaleCarWire,
  context: { viewerId: string | null; offers: BackendOffer[] | null },
): ListingDetailWire {
  const owned = context.viewerId !== null && context.viewerId === car.user_id
  const sold = car.status === 'sold'
  return {
    id: car.sale_car_id,
    brand: car.brand ?? car.mark_raw ?? '',
    model: car.model ?? car.model_raw ?? '',
    year: car.year ?? 0,
    price: car.price ?? 0,
    mileage_km: car.milleage,
    engine_power_hp: car.engine_power,
    transmission: car.transmission,
    city: null,
    vin_masked: maskVin(car.vin),
    description: car.description,
    photo_urls: car.photos.map((photo) => photo.url),
    photos_total: car.photos.length,
    status: sold ? 'sold' : 'published',
    // Отдельного времени продажи сервер не хранит: последняя правка статуса — ближайшее
    // честное приближение, и оно перестанет им быть, как только объявление отредактируют.
    sold_at: sold ? car.updated_at : null,
    thickness_map_complete: false,
    has_thickness_map: false,
    // По контракту истории 7 телефон — отдельный запрос `POST /{id}/reveal-phone`, а не
    // поле карточки: полем телефоны площадки выкачиваются одним проходом. Поэтому для
    // чужого объявления кнопка доступна всем вошедшим, а решает сервер; владельцу же
    // показывать нечего, кроме того, что он сам вписал.
    phone_available: owned ? Boolean(car.phone_number) : true,
    chat_allowed: false,
    owned_by_me: owned,
    published_at: car.published_at,
    views_count: 0,
    opens_count: 0,
    offers_count: context.offers?.length ?? 0,
    measured_panels: 0,
    total_panels: TOTAL_PANELS,
    // Имя и рейтинг продавца сервер не отдаёт: профиль чужого пользователя закрыт, а
    // отзывов нет вовсе. Пустое имя честнее выдуманного.
    seller: { id: car.user_id, name: '', rating: null, deals_count: 0 },
    offers: context.offers ? context.offers.map(toOffer) : null,
  }
}
