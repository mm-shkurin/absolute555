// Формы, из которых собрана схема кузова. Проекция — не картинка, а данные: одна панель
// встречается в нескольких проекциях, и подсветка обязана зажечься во всех сразу.
import type { PanelCode } from '../bodyPanels'

export interface Zone {
  code: PanelCode
  d: string
}

export interface Wheel {
  cx: number
  cy: number
  r: number
}

export interface Projection {
  label: string
  labelX: number
  labelY: number
  zones: Zone[]
  outline: string[]
  /** Фары, фонари, стёкла, колёса. Рисуются поверх заливки цветом карточки: панель на
   *  чертеже обходит их не всегда замкнуто, и вырез подпутём срабатывает не везде. */
  cutouts: string[]
  wheels: Wheel[]
  /** Преобразование группы проекции. Правый борт — отражённый левый: вторая копия тех же
   *  координат разошлась бы с первой на первой же правке обвода. */
  transform?: string
}

/** Зеркальный код панели: левая сторона кузова превращается в правую. Панели без стороны
 *  (капот, крыша, бамперы) остаются собой. */
const MIRROR: Record<PanelCode, PanelCode> = {
  hood: 'hood',
  roof: 'roof',
  trunk_lid: 'trunk_lid',
  front_bumper: 'front_bumper',
  rear_bumper: 'rear_bumper',
  front_left_fender: 'front_right_fender',
  front_right_fender: 'front_left_fender',
  rear_left_fender: 'rear_right_fender',
  rear_right_fender: 'rear_left_fender',
  front_left_door: 'front_right_door',
  front_right_door: 'front_left_door',
  rear_left_door: 'rear_right_door',
  rear_right_door: 'rear_left_door',
}

export function mirrorCode(code: PanelCode): PanelCode {
  return MIRROR[code]
}
