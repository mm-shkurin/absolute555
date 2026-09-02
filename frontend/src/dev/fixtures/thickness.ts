// Карта замеров в заглушке. Форма — контракт истории 14: статус панели приходит с
// сервера, счётчики тоже, а незамеренная панель просто отсутствует в списке.
import type {
  BodyPanel,
  PanelStatus,
  ThicknessMapWire,
  ThicknessSummaryWire,
} from '../../shared/api/backend/thicknessContract'

const TOTAL_PANELS = 13

// Карта есть только у первого объявления: у остальных её нет вовсе, и карточка обязана
// честно молчать про замеры, а не показывать пустую.
const MEASURED: [BodyPanel, number, PanelStatus][] = [
  ['hood', 96, 'factory'],
  ['roof', 91, 'factory'],
  ['trunk_lid', 168, 'factory'],
  ['front_left_fender', 103, 'factory'],
  ['front_right_fender', 640, 'filler'],
  ['rear_left_fender', 99, 'factory'],
  ['front_left_door', 94, 'factory'],
  ['front_right_door', 210, 'repaint'],
  ['rear_left_door', 97, 'factory'],
  ['front_bumper', 189, 'factory'],
  ['rear_bumper', 102, 'factory'],
]

const MAPPED_CAR = 'l1'

export function thicknessSummary(saleCarId: string): ThicknessSummaryWire | null {
  if (saleCarId !== MAPPED_CAR) return null
  return {
    measured_panels: MEASURED.length,
    total_panels: TOTAL_PANELS,
    is_complete: MEASURED.length === TOTAL_PANELS,
  }
}

export function thicknessMap(saleCarId: string): ThicknessMapWire {
  const measurements = saleCarId === MAPPED_CAR ? MEASURED : []
  return {
    sale_car_id: saleCarId,
    measurements: measurements.map(([panel, value_um, status]) => ({
      panel,
      value_um,
      status,
      photo_url: '',
      updated_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    })),
    measured_panels: measurements.length,
    total_panels: TOTAL_PANELS,
    is_complete: measurements.length === TOTAL_PANELS,
  }
}
