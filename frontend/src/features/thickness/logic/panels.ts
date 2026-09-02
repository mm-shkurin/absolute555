// Панели кузова и то, как статус панели превращается в цвет.
//
// Порогов здесь нет намеренно: статус (`factory` / `repaint` / `filler`) считает сервер
// и присылает готовым. Копия порога на клиенте — это вторая копия в вебе и третья в
// мобилке, и однажды они разойдутся на одном и том же замере.
import type { BodyPanel, PanelStatus } from '../../../shared/api/backend/thicknessContract'

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

export const GRADE_COLOR: Record<Grade, string> = {
  factory: 'var(--measure-ok)',
  repaint: 'var(--measure-warn)',
  filler: 'var(--measure-bad)',
  none: 'var(--measure-none)',
}

export const GRADE_WORD: Record<Grade, string> = {
  factory: 'заводская',
  repaint: 'перекрашено',
  filler: 'шпаклёвка',
  none: 'не замерено',
}

// Подписи легенды. Числа — те, по которым считает сервер (спека
// `sale_car_thickness.yaml`); они здесь текст для человека, а не правило: цвет панели
// приходит статусом, и ни одна ветка кода не сравнивает число с этими границами.
export const GRADE_RANGE: Record<Grade, string | null> = {
  factory: 'меньше 200 мкм',
  repaint: '200–499',
  filler: 'от 500',
  none: null,
}
