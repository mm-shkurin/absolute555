// Сборка экрана карты: строка на панель, покрытие и разбор выбранной панели.
import type { PanelWire, ThicknessMapWire } from '../api/thicknessApi'
import { GRADE_COLOR, GRADE_WORD, PANELS, gradeOf, type Grade, type PanelCode } from './panels'

export interface PanelRow {
  code: PanelCode
  label: string
  grade: Grade
  color: string
  value: string
  measured: boolean
}

export interface PanelDetail extends PanelRow {
  micrometers: number | null
  photoUrl: string | null
  manuallyCorrected: boolean
  note: string
}

export interface ThicknessView {
  listingId: string
  title: string
  rows: PanelRow[]
  measuredCount: number
  totalCount: number
  coverageText: string
  complete: boolean
}

function measurementOf(wire: ThicknessMapWire, code: PanelCode): PanelWire | undefined {
  return wire.panels.find((panel) => panel.panel === code)
}

export function toThicknessView(wire: ThicknessMapWire): ThicknessView {
  // Список строится от полного набора панелей, а не от пришедших замеров: незамеренная
  // панель обязана остаться в списке — её отсутствие и есть то, что покупатель ищет.
  const rows = PANELS.map((panel) =>
    toRow(panel.code, panel.label, measurementOf(wire, panel.code)),
  )
  const measuredCount = rows.filter((row) => row.measured).length
  return {
    listingId: wire.listing_id,
    title: wire.listing_title,
    rows,
    measuredCount,
    totalCount: rows.length,
    coverageText: `${measuredCount} из ${rows.length}`,
    complete: measuredCount === rows.length,
  }
}

function toRow(code: PanelCode, label: string, wire?: PanelWire): PanelRow {
  const micrometers = wire?.micrometers ?? null
  const grade = gradeOf(micrometers)
  return {
    code,
    label,
    grade,
    color: GRADE_COLOR[grade],
    value: micrometers === null ? '—' : `${micrometers} мкм`,
    measured: micrometers !== null,
  }
}

export function toPanelDetail(wire: ThicknessMapWire, code: PanelCode): PanelDetail {
  const panel = PANELS.find((item) => item.code === code)
  const measurement = measurementOf(wire, code)
  const row = toRow(code, panel?.label ?? code, measurement)
  return {
    ...row,
    micrometers: measurement?.micrometers ?? null,
    photoUrl: measurement?.photo_url ?? null,
    manuallyCorrected: measurement?.manually_corrected ?? false,
    note: noteFor(row.grade, wire.factory_micrometers, measurement?.manually_corrected ?? false),
  }
}

function noteFor(grade: Grade, factory: number | null, corrected: boolean): string {
  if (grade === 'none') return 'Продавец не измерял эту панель.'
  const source = corrected
    ? 'Число уточнено продавцом вручную после распознавания.'
    : 'Значение считано с экрана прибора.'
  if (factory === null) return source
  return `${source} Заводская толщина у этой модели — около ${factory} мкм.`
}

export function gradeCaption(detail: PanelDetail): string {
  return `мкм · ${GRADE_WORD[detail.grade]}`
}
