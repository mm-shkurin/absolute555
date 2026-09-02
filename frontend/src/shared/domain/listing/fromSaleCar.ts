// Перевод объявления с реального провода в форму, которую читает карточка.
//
// Два разных объекта: `SaleCarWire` — то, что отдаёт сервер сегодня, `ListingWire` — то,
// что рисует лента. Пока они не сошлись, перевод живёт здесь, в одном месте, и здесь же
// видно, каких полей на сервере ещё нет.
import type { SaleCarWire } from '../../api/backend/saleCarContract'
import type { ListingWire } from './listingWire'

/** Марка из справочника, если распознавание её связало; иначе — как прочиталось
 *  с документа; иначе пусто. Прочерк рисует уже карточка, а не перевод. */
function brandOf(car: SaleCarWire): string {
  return car.brand ?? car.mark_raw ?? ''
}

function modelOf(car: SaleCarWire): string {
  return car.model ?? car.model_raw ?? ''
}

export function toListingWire(car: SaleCarWire): ListingWire {
  return {
    id: car.sale_car_id,
    brand: brandOf(car),
    model: modelOf(car),
    year: car.year ?? 0,
    price: car.price ?? 0,
    mileage_km: car.milleage,
    engine_power_hp: car.engine_power,
    transmission: car.transmission,
    // Города на сервере нет: площадка пока одногородняя, и подставлять «Омск» значило бы
    // выдумать поле, которого в ответе не было.
    city: null,
    photo_url: car.preview_photo_url,
    // Бейдж обещает полную карту — значит, `is_complete`, а не «есть хоть один замер».
    has_thickness_map: car.thickness?.is_complete ?? false,
    // VIN проверен, если он есть в ответе: сервер записывает его только из распознанного
    // документа, вручную его не вписывают.
    vin_verified: Boolean(car.vin),
    // Канала «под заказ» на сервере нет: всё, что приходит, — машины в наличии.
    import_delivery_days: null,
  }
}
