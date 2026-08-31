// Клиент ленты. Ходит по контракту истории 7 (`api-specs/sale_car_feed.yaml`): страница,
// точный счётчик, фильтры и сортировка — всё на стороне сервера.
import { fetchFeed as fetchFeedPage } from '../../../shared/api/backend/saleCarApi'
import type { FeedCardWire } from '../../../shared/api/backend/feedContract'
import type { ListingWire } from '../../../shared/domain/listing/listingWire'
import { toFeedFilters, type FeedQuery } from '../logic/feedQuery'

export type { ListingWire }

export interface FeedWire {
  items: ListingWire[]
  total: number
}

// Карточка списка беднее объявления целиком, и перевод у неё свой: ни VIN, ни фотографий,
// кроме обложки, в ленте нет — по контракту, а не по недосмотру.
function toListing(card: FeedCardWire): ListingWire {
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
    // Замеры — история 14, канал «под заказ» — история 17. До них ни одно объявление в
    // ленте не может заявить ни карту, ни срок доставки.
    has_thickness_map: false,
    vin_verified: false,
    import_delivery_days: null,
  }
}

export async function fetchFeed(query: FeedQuery, signal?: AbortSignal): Promise<FeedWire> {
  const page = await fetchFeedPage(toFeedFilters(query), signal)
  return { items: page.items.map(toListing), total: page.total }
}
