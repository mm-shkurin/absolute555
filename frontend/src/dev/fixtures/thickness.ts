// Карта замеров в заглушке. Форма — контракт истории 14: статус панели приходит с
// сервера, счётчики тоже, а незамеренная панель просто отсутствует в списке.
//
// Карта здесь живая: запись и снятие меняют её на время сессии. Общий `{ok:true}` на
// PUT вернул бы экрану успех без карты, и панель осталась бы серой — сценарий падал бы
// на шаге, который ни при чём.
import type {
  BodyPanel,
  PanelStatus,
  ThicknessMapWire,
  ThicknessMeasurementWire,
  ThicknessSummaryWire,
} from '../../shared/api/backend/thicknessContract'

const TOTAL_PANELS = 13

// Карта есть только у первого объявления: у остальных её нет вовсе, и карточка обязана
// честно молчать про замеры, а не показывать пустую.
const MAPPED_CAR = 'l1'

const START: [BodyPanel, number][] = [
  ['hood', 96],
  ['roof', 91],
  ['trunk_lid', 168],
  ['front_left_fender', 103],
  ['front_right_fender', 640],
  ['rear_left_fender', 99],
  ['front_left_door', 94],
  ['front_right_door', 210],
  ['rear_left_door', 97],
  ['front_bumper', 189],
  ['rear_bumper', 102],
]

const measured = new Map<string, Map<BodyPanel, number>>([[MAPPED_CAR, new Map(START)]])

// Те же пороги, что у сервера: заглушка изображает его ответ, а не считает свой.
function statusOf(valueUm: number): PanelStatus {
  if (valueUm < 200) return 'factory'
  return valueUm < 500 ? 'repaint' : 'filler'
}

function panelsOf(saleCarId: string): Map<BodyPanel, number> {
  const existing = measured.get(saleCarId)
  if (existing) return existing
  const empty = new Map<BodyPanel, number>()
  measured.set(saleCarId, empty)
  return empty
}

export function writeMeasurement(saleCarId: string, panel: BodyPanel, valueUm: number): void {
  panelsOf(saleCarId).set(panel, valueUm)
}

export function eraseMeasurement(saleCarId: string, panel: BodyPanel): void {
  panelsOf(saleCarId).delete(panel)
}

export function thicknessSummary(saleCarId: string): ThicknessSummaryWire | null {
  const panels = measured.get(saleCarId)
  if (!panels || panels.size === 0) return null
  return {
    measured_panels: panels.size,
    total_panels: TOTAL_PANELS,
    is_complete: panels.size === TOTAL_PANELS,
  }
}

export function thicknessMap(saleCarId: string): ThicknessMapWire {
  const panels = panelsOf(saleCarId)
  const measurements: ThicknessMeasurementWire[] = [...panels].map(([panel, value_um]) => ({
    panel,
    value_um,
    status: statusOf(value_um),
    source: 'seller',
    ocr_value_um: null,
    photo_url: '',
    updated_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  }))
  return {
    sale_car_id: saleCarId,
    measurements,
    measured_panels: measurements.length,
    total_panels: TOTAL_PANELS,
    is_complete: measurements.length === TOTAL_PANELS,
  }
}
