// Панели кузова и правило, по которому замер превращается в цвет.
//
// Порог живёт здесь и в `styles/tokens-light.css` (`--measure-ok-max`, `--measure-warn-max`).
// Двух источников быть не должно, но цвет нужен и CSS, и разметке SVG; если правите число —
// правьте оба места, иначе легенда разойдётся с заливкой.
export const OK_MAX = 150
export const WARN_MAX = 300

export type PanelCode =
  | 'hood'
  | 'roof'
  | 'trunk'
  | 'fender-fl'
  | 'fender-fr'
  | 'fender-rl'
  | 'fender-rr'
  | 'door-fl'
  | 'door-fr'
  | 'door-rl'
  | 'door-rr'
  | 'bumper-f'
  | 'bumper-r'

export type Grade = 'ok' | 'warn' | 'bad' | 'none'

// Порядок списка — порядок осмотра машины, а не алфавит: сверху вниз и спереди назад.
export const PANELS: { code: PanelCode; label: string }[] = [
  { code: 'hood', label: 'Капот' },
  { code: 'roof', label: 'Крыша' },
  { code: 'trunk', label: 'Крышка багажника' },
  { code: 'fender-fl', label: 'Крыло переднее левое' },
  { code: 'fender-fr', label: 'Крыло переднее правое' },
  { code: 'fender-rl', label: 'Крыло заднее левое' },
  { code: 'fender-rr', label: 'Крыло заднее правое' },
  { code: 'door-fl', label: 'Дверь передняя левая' },
  { code: 'door-fr', label: 'Дверь передняя правая' },
  { code: 'door-rl', label: 'Дверь задняя левая' },
  { code: 'door-rr', label: 'Дверь задняя правая' },
  { code: 'bumper-f', label: 'Бампер передний' },
  { code: 'bumper-r', label: 'Бампер задний' },
]

export const PANEL_LABEL: Record<PanelCode, string> = Object.fromEntries(
  PANELS.map((panel) => [panel.code, panel.label]),
) as Record<PanelCode, string>

export function gradeOf(micrometers: number | null): Grade {
  if (micrometers === null) return 'none'
  if (micrometers <= OK_MAX) return 'ok'
  if (micrometers <= WARN_MAX) return 'warn'
  return 'bad'
}

export const GRADE_COLOR: Record<Grade, string> = {
  ok: 'var(--measure-ok)',
  warn: 'var(--measure-warn)',
  bad: 'var(--measure-bad)',
  none: 'var(--measure-none)',
}

export const GRADE_WORD: Record<Grade, string> = {
  ok: 'заводская',
  warn: 'перекрашено',
  bad: 'шпаклёвка',
  none: 'не замерено',
}
