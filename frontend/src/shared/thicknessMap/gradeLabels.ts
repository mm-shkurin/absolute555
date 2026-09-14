// Как статус панели превращается в цвет и слова для человека.
import type { Grade } from './bodyPanels'

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
