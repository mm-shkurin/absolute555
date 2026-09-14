// Клиент мастера продажи. Ходит по контрактам историй 4, 5 и 6: черновик заводится пустым,
// поля дописываются правкой, снимок СТС уходит отдельной ручкой и читается в фоне.
//
// `api-specs/sale_car_draft.yaml`, `sale_car_sts.yaml`, `sale_car_photos.yaml`,
// `sale_car_lifecycle.yaml`.
import { patchListing } from '../../../shared/api/backend/saleCarApi'
import type { SaleCarPatch, SaleCarWire } from '../../../shared/api/backend/saleCarContract'
import type { Draft } from '../logic/draft'
import { toDraft, toPatch } from '../logic/draftWire'

export type { SaleCarWire }

/** Сохраняет то, что человек успел ввести. Пустая правка сервером отвергается, поэтому
 *  вызывающий проверяет, есть ли что сохранять. */
export function saveDraft(saleCarId: string, draft: Draft): Promise<SaleCarWire> {
  return patchListing(saleCarId, toPatch(draft))
}

export function isEmptyPatch(patch: SaleCarPatch): boolean {
  return Object.keys(patch).length === 0
}

export { toDraft }
