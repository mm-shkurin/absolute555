// Сборка карточки объявления из того, что сервер отдаёт сегодня.
//
// Карточка на экране богаче ответа сервера: продавца с рейтингом, счётчики показов, чат и
// карту замеров он не отдаёт вовсе. Недостающее заполняется нейтрально и в одном месте —
// чтобы, когда ручки появятся, было видно, что именно менять.
import type { OfferWire as BackendOffer } from '../../../shared/api/backend/offerContract'
import type { SaleCarWire } from '../../../shared/api/backend/saleCarContract'
import { maskVin } from '../../../shared/domain/listing/vin'
import type { ListingDetailWire, OfferWire } from '../api/listingApi'

// Набор панелей знает сервер и присылает его в сводке. Число здесь — только на случай
// объявления без единого замера, где сводки нет вовсе.
const TOTAL_PANELS = 13

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
    is_import: car.listing_kind === 'import',
    import_country: car.import_country,
    delivery_days: car.delivery_days,
    turnkey_price: car.turnkey_price,
    thickness_map_complete: car.thickness?.is_complete ?? false,
    has_thickness_map: (car.thickness?.measured_panels ?? 0) > 0,
    // Телефон — отдельный запрос `POST /{id}/reveal-phone`, а не поле карточки: полем
    // телефоны площадки выкачиваются одним проходом. Владельцу сервер отдаёт его сразу.
    phone_available: owned ? Boolean(car.phone_number) : true,
    chat_allowed: false,
    owned_by_me: owned,
    published_at: car.published_at,
    views_count: 0,
    opens_count: 0,
    offers_count: context.offers?.length ?? 0,
    measured_panels: car.thickness?.measured_panels ?? 0,
    total_panels: car.thickness?.total_panels ?? TOTAL_PANELS,
    // Имя и аватар приходят от провайдера входа. Рейтинга и числа сделок в выдаче нет:
    // отзывы — история 12, и ноль сделок читался бы как «сделок не было», а не «не знаем».
    seller: {
      id: car.seller?.user_id ?? car.user_id,
      name: car.seller?.name ?? '',
      // Агрегат едет в блоке продавца — отдельного вызова ради трёх чисел нет.
      rating: car.seller?.rating ?? null,
      deals_count: car.seller?.deals_count ?? 0,
    },
    offers: context.offers ? context.offers.map(toOffer) : null,
  }
}
