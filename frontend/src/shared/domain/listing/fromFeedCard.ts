// Карточка с провода в карточку экрана. Общая для ленты и профиля продавца: профиль
// отдаёт ту же `FeedCard`, и второй перевод разошёлся бы с первым на первом же поле.
import type { FeedCardWire } from '../../api/backend/feedContract'
import type { ListingWire } from './listingWire'

export function fromFeedCard(card: FeedCardWire): ListingWire {
  return {
    id: card.sale_car_id,
    brand: card.brand ?? '',
    model: card.model ?? '',
    year: card.year ?? 0,
    price: card.price,
    mileage_km: card.milleage,
    engine_power_hp: null,
    transmission: card.transmission,
    city: null,
    photo_url: card.preview_photo_url,
    // Сводка замеров приходит в самой карточке; канал «под заказ» — история 17, и до
    // неё ни одна карточка в ленте не может заявить срок доставки.
    has_thickness_map: (card.thickness?.measured_panels ?? 0) > 0,
    vin_verified: false,
    import_delivery_days: null,
  }
}
