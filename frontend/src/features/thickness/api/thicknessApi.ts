// Карта замеров одного объявления. Отдельный запрос от карточки: замеры весят больше самой
// карточки (у каждой панели снимок экрана прибора), и тянуть их в ленту незачем.
import { API } from '../../../shared/api/endpoints'
import { send } from '../../../shared/api/send'
import type { PanelCode } from '../logic/panels'

export interface PanelWire {
  panel: PanelCode
  micrometers: number | null
  photo_url: string | null
  // Правка после распознавания. Покупатель обязан её видеть: число, введённое человеком,
  // стоит меньше, чем считанное с экрана прибора.
  manually_corrected: boolean
}

export interface ThicknessMapWire {
  listing_id: string
  listing_title: string
  factory_micrometers: number | null
  panels: PanelWire[]
}

export async function fetchThicknessMap(
  listingId: string,
  signal?: AbortSignal,
): Promise<ThicknessMapWire> {
  return send<ThicknessMapWire>(API.thickness.map(listingId), { signal })
}
