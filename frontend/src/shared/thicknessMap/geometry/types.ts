// Формы, из которых собрана схема кузова. Проекция — не картинка, а данные: одна панель
// встречается в нескольких проекциях, и подсветка обязана зажечься во всех сразу.
import type { PanelCode } from '../panels'

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
export function mirrorCode(code: PanelCode): PanelCode {
  if (code.includes('_left_')) return code.replace('_left_', '_right_') as PanelCode
  if (code.includes('_right_')) return code.replace('_right_', '_left_') as PanelCode
  return code
}
