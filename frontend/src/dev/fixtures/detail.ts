import type { ListingDetailWire } from '../../features/listing/api/listingApi'
import type { ThicknessMapWire } from '../../features/thickness/api/thicknessApi'

const HOURS = 3600_000

export function listingDetail(id: string, owned: boolean): ListingDetailWire {
  return {
    id,
    brand: 'Lexus',
    model: 'LX 570',
    year: 2012,
    price: 4020000,
    mileage_km: 180000,
    engine_power_hp: 367,
    transmission: 'АКПП',
    city: 'Омск',
    vin_masked: 'JTJHY00W***40218',
    description:
      'Машина в семье с 2016 года, обслуживание у официального дилера до 2021-го, дальше — проверенный сервис в Омске, чеки сохранены. Переднее правое крыло перекрашивалось после парковочного контакта, это видно в карте замеров.',
    photo_urls: [],
    photos_total: 12,
    status: 'published',
    sold_at: null,
    thickness_map_complete: false,
    has_thickness_map: true,
    phone_available: true,
    chat_allowed: true,
    owned_by_me: owned,
    published_at: new Date(Date.now() - 6 * 24 * HOURS).toISOString(),
    views_count: 1284,
    opens_count: 96,
    offers_count: 4,
    measured_panels: 11,
    total_panels: 13,
    seller: { id: 'u2', name: 'Михаил', rating: 4.8, deals_count: 12 },
    offers: [
      { id: 'o1', amount: 3850000, created_at: new Date(Date.now() - 2 * HOURS).toISOString() },
      { id: 'o2', amount: 3700000, created_at: new Date(Date.now() - 5 * HOURS).toISOString() },
      { id: 'o3', amount: 3600000, created_at: new Date(Date.now() - 30 * HOURS).toISOString() },
    ],
  }
}

export function thicknessMap(listingId: string): ThicknessMapWire {
  return {
    listing_id: listingId,
    listing_title: 'Lexus LX 570',
    factory_micrometers: 100,
    panels: [
      { panel: 'hood', micrometers: 96, photo_url: null, manually_corrected: false },
      { panel: 'roof', micrometers: 91, photo_url: null, manually_corrected: false },
      { panel: 'trunk', micrometers: 168, photo_url: null, manually_corrected: false },
      { panel: 'fender-fl', micrometers: 103, photo_url: null, manually_corrected: false },
      { panel: 'fender-fr', micrometers: 640, photo_url: null, manually_corrected: true },
      { panel: 'fender-rl', micrometers: 99, photo_url: null, manually_corrected: false },
      { panel: 'door-fl', micrometers: 94, photo_url: null, manually_corrected: false },
      { panel: 'door-fr', micrometers: 210, photo_url: null, manually_corrected: false },
      { panel: 'door-rl', micrometers: 97, photo_url: null, manually_corrected: false },
      { panel: 'bumper-f', micrometers: 189, photo_url: null, manually_corrected: false },
      { panel: 'bumper-r', micrometers: 102, photo_url: null, manually_corrected: false },
    ],
  }
}
