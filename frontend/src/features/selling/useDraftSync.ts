// Черновик на сервере: завести один раз и досылать правки.
//
// Отдельно от `useDraftState`, потому что состояние мастера обязано работать и без сети:
// человек фотографирует машину во дворе, и потеря связи не должна стирать введённое.
// Отсюда правило — сохранение может провалиться молча, а мастер продолжает работать.
import type { ListingKind } from '../../shared/api/backend/saleCarContract'
import type { Draft } from './logic/draft'
import { useDraftSave, useRecognitionStart } from './useDraftActions'
import { useDraftCreation } from './useDraftCreation'

export interface DraftSync {
  saleCarId: string | null
  /** Последняя правка сохранена на сервере. Пока черновик не заведён — false. */
  saved: boolean
  save: (draft: Draft) => Promise<void>
  /** Приложить снимок СТС. Возвращает false, если черновика на сервере ещё нет или
   *  загрузка не удалась: мастер тогда остаётся на шаге с документом. */
  attachDocument: (file: File) => Promise<boolean>
  /** Запустить распознавание по вписанному VIN. Возвращает false там же, где и снимок:
   *  черновика на сервере нет или запрос не удался. */
  decodeByVin: (vin: string) => Promise<boolean>
  /** Перечитать объявление после распознавания. `null`, если читать нечего. */
  reload: () => Promise<Draft | null>
}

/** `existingId` — черновик, начатый раньше: мастер открыт по ссылке из «Моих объявлений»,
 *  и заводить второй черновик на ту же машину нельзя. */
export function useDraftSync(enabled: boolean, existingId?: string, kind?: ListingKind): DraftSync {
  const { saleCarId, idRef, draftId } = useDraftCreation(enabled, existingId, kind)
  return { saleCarId, ...useDraftSave(idRef), ...useRecognitionStart(draftId) }
}
