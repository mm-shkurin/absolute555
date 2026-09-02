// Карта замеров толщиномера на проводе — зеркало `api-specs/sale_car_thickness.yaml`.
//
// Змеиный регистр и имена полей сохранены: переименование спрятало бы расхождение
// с сервером до первого запроса в проде.

/** Панель кузова. Набор фиксирован спекой и не меняется от машины к машине. */
export type BodyPanel =
  | 'hood'
  | 'roof'
  | 'trunk_lid'
  | 'front_left_door'
  | 'front_right_door'
  | 'rear_left_door'
  | 'rear_right_door'
  | 'front_left_fender'
  | 'front_right_fender'
  | 'rear_left_fender'
  | 'rear_right_fender'
  | 'front_bumper'
  | 'rear_bumper'

/** Как читается число. Считает сервер по единым порогам: копия порога в вебе и в
 *  мобилке разошлась бы, и покупатель увидел бы два разных цвета на одном замере. */
export type PanelStatus = 'factory' | 'repaint' | 'filler'

/** Кто записал число: распознавание с фотографии или сам продавец. */
export type ValueSource = 'ocr' | 'seller'

export interface ThicknessMeasurementWire {
  panel: BodyPanel
  value_um: number
  status: PanelStatus
  /** Чем записано текущее число (история 15). */
  source: ValueSource
  /** Что прочиталось с фотографии, даже когда продавец вписал своё. Бейдж «уточнено
   *  продавцом» — это source === 'seller' при непустом ocr_value_um. */
  ocr_value_um?: number | null
  /** Фотография экрана прибора. Доказательство замера, а не украшение. */
  photo_url: string
  updated_at?: string
}

export interface ThicknessMapWire {
  sale_car_id: string
  measurements: ThicknessMeasurementWire[]
  measured_panels: number
  /** Сколько панелей в наборе — 13. Число приходит с сервера, а не берётся из длины
   *  локального списка: набор один, но владеет им контракт. */
  total_panels: number
  is_complete: boolean
}

/** Сводка в карточке и детальной выдаче объявления. Отдельного вызова ради двух чисел
 *  не заводится. */
export interface ThicknessSummaryWire {
  measured_panels: number
  total_panels: number
  is_complete: boolean
}

/** Границы значения из спеки: за ними сервер отвечает 422. Форма проверяет их до
 *  отправки, чтобы опечатка не уходила запросом. */
export const VALUE_UM_MIN = 1
export const VALUE_UM_MAX = 3000
