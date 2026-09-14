// Схема кузова: пять проекций в одном SVG, панель залита цветом своего замера.
// Одна панель встречается в нескольких проекциях — выбор подсвечивает все её вхождения.
import type { PanelCode } from './bodyPanels'
import type { PanelRow } from './thicknessMap'
import { PROJECTIONS, VIEW_BOX } from './geometry'
import { Legend } from './Legend'
import { ProjectionShape } from './ProjectionShape'
import styles from './BodySchematic.module.css'

interface Props {
  rows: PanelRow[]
  selected: PanelCode | null
  onSelect: (code: PanelCode) => void
}

export function BodySchematic({ rows, selected, onSelect }: Props) {
  // Зон на схеме вчетверо больше, чем панелей: одна панель встречается в нескольких
  // проекциях. Поиск строкой по каждой зоне — сорок проходов по списку на отрисовку.
  const byCode = new Map(rows.map((row) => [row.code, row]))
  const colorOf = (code: PanelCode) => byCode.get(code)?.color ?? 'var(--measure-none)'
  const labelOf = (code: PanelCode) => byCode.get(code)?.label ?? code

  return (
    <div className={styles.sheet} data-testid="body-schematic">
      <svg viewBox={VIEW_BOX} role="img" aria-label="Схема кузова, пять проекций">
        {PROJECTIONS.map((projection) => (
          <g key={projection.label}>
            <text className={styles.projectionLabel} x={projection.labelX} y={projection.labelY}>
              {projection.label}
            </text>
            {/* Подпись остаётся вне преобразования: отражённый борт перевернул бы и её. */}
            <ProjectionShape
              projection={projection}
              selected={selected}
              onSelect={onSelect}
              colorOf={colorOf}
              labelOf={labelOf}
            />
          </g>
        ))}
      </svg>
      <Legend />
    </div>
  )
}
