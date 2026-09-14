// Панели кузова и порядок их осмотра.
//
// Порогов здесь нет намеренно: статус (`factory` / `repaint` / `filler`) считает сервер
// и присылает готовым. Копия порога на клиенте — это вторая копия в вебе и третья в
// мобилке, и однажды они разойдутся на одном и том же замере.
import type { BodyPanel, PanelStatus } from '../../api/backend/thicknessContract'

export type PanelCode = BodyPanel

/** Статус панели плюс `none` — незамеренная панель. Провод её просто не присылает,
 *  а экран обязан показать: её отсутствие и есть то, что покупатель ищет. */
export type Grade = PanelStatus | 'none'

// Порядок списка — порядок осмотра машины, а не алфавит: сверху вниз и спереди назад.
export const PANELS: { code: PanelCode; label: string }[] = [
  { code: 'hood', label: 'Капот' },
  { code: 'roof', label: 'Крыша' },
  { code: 'trunk_lid', label: 'Крышка багажника' },
  { code: 'front_left_fender', label: 'Крыло переднее левое' },
  { code: 'front_right_fender', label: 'Крыло переднее правое' },
  { code: 'rear_left_fender', label: 'Крыло заднее левое' },
  { code: 'rear_right_fender', label: 'Крыло заднее правое' },
  { code: 'front_left_door', label: 'Дверь передняя левая' },
  { code: 'front_right_door', label: 'Дверь передняя правая' },
  { code: 'rear_left_door', label: 'Дверь задняя левая' },
  { code: 'rear_right_door', label: 'Дверь задняя правая' },
  { code: 'front_bumper', label: 'Бампер передний' },
  { code: 'rear_bumper', label: 'Бампер задний' },
]

export const PANEL_LABEL: Record<PanelCode, string> = Object.fromEntries(
  PANELS.map((panel) => [panel.code, panel.label]),
) as Record<PanelCode, string>
