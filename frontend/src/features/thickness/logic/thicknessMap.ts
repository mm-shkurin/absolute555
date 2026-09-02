// Сборка экрана карты: строка на панель, покрытие и разбор выбранной панели.
import type {
  ThicknessMapWire,
  ThicknessMeasurementWire,
} from '../../../shared/api/backend/thicknessContract'
import { GRADE_COLOR, GRADE_WORD, PANELS, type Grade, type PanelCode } from './panels'

export interface PanelRow {
  code: PanelCode
  label: string
  grade: Grade
  color: string
  value: string
  measured: boolean
}

export interface PanelDetail extends PanelRow {
  valueUm: number | null
  photoUrl: string | null
  /** Что прочиталось со снимка, когда продавец вписал своё. `null` — правки не было,
   *  и показывать нечего. */
  ocrValueUm: number | null
  corrected: boolean
  note: string
}

export interface ThicknessView {
  saleCarId: string
  rows: PanelRow[]
  measuredCount: number
  totalCount: number
  coverageText: string
  complete: boolean
}

function measurementOf(
  wire: ThicknessMapWire,
  code: PanelCode,
): ThicknessMeasurementWire | undefined {
  return wire.measurements.find((measurement) => measurement.panel === code)
}

export function toThicknessView(wire: ThicknessMapWire): ThicknessView {
  // Список строится от полного набора панелей, а не от пришедших замеров: незамеренная
  // панель обязана остаться в списке — её отсутствие и есть то, что покупатель ищет.
  const rows = PANELS.map((panel) =>
    toRow(panel.code, panel.label, measurementOf(wire, panel.code)),
  )
  return {
    saleCarId: wire.sale_car_id,
    rows,
    // Счётчики берутся с провода, а не пересчитываются по строкам: полноту карты
    // определяет сервер, и второй ответ на тот же вопрос завёл бы второе правило.
    measuredCount: wire.measured_panels,
    totalCount: wire.total_panels,
    coverageText: `${wire.measured_panels} из ${wire.total_panels}`,
    complete: wire.is_complete,
  }
}

function toRow(code: PanelCode, label: string, wire?: ThicknessMeasurementWire): PanelRow {
  const grade: Grade = wire?.status ?? 'none'
  return {
    code,
    label,
    grade,
    color: GRADE_COLOR[grade],
    value: wire ? `${wire.value_um} мкм` : '—',
    measured: Boolean(wire),
  }
}

export function toPanelDetail(wire: ThicknessMapWire, code: PanelCode): PanelDetail {
  const panel = PANELS.find((item) => item.code === code)
  const measurement = measurementOf(wire, code)
  const row = toRow(code, panel?.label ?? code, measurement)
  // Правка видна ровно тогда, когда есть с чем сравнивать: продавец вписал своё
  // (`source === 'seller'`), а распознанное число сохранено рядом.
  const ocrValueUm = measurement?.ocr_value_um ?? null
  const corrected = measurement?.source === 'seller' && ocrValueUm !== null
  return {
    ...row,
    valueUm: measurement?.value_um ?? null,
    photoUrl: measurement?.photo_url ?? null,
    ocrValueUm,
    corrected,
    note: noteFor(row.grade, corrected, ocrValueUm),
  }
}

function noteFor(grade: Grade, corrected: boolean, ocrValueUm: number | null): string {
  if (grade === 'none') return 'Продавец не измерял эту панель.'
  // Число, введённое человеком, стоит меньше считанного с прибора: покупатель обязан
  // видеть и то, что прочиталось, а не только исправленное.
  if (corrected) return `Продавец исправил распознанное число ${ocrValueUm} мкм на своё.`
  return `Значение снято с экрана прибора: ${GRADE_WORD[grade]}.`
}

export function gradeCaption(detail: PanelDetail): string {
  return `мкм · ${GRADE_WORD[detail.grade]}`
}
