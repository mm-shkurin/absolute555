// Схема кузова: пять проекций в одном SVG, панель залита цветом своего замера.
// Одна панель встречается в нескольких проекциях — выбор подсвечивает все её вхождения.
import type { PanelCode } from '../logic/panels'
import type { PanelRow } from '../logic/thicknessMap'
import { PROJECTIONS, VIEW_BOX } from './geometry'
import { Legend } from './Legend'
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
            <g transform={projection.transform}>
              {projection.zones.map((zone, index) => (
                <path
                  key={`${zone.code}-${index}`}
                  className={[styles.zone, zone.code === selected ? styles.selected : ''].join(' ')}
                  d={zone.d}
                  fill={colorOf(zone.code)}
                  fillRule="evenodd"
                  onClick={() => onSelect(zone.code)}
                  data-panel={zone.code}
                  data-selected={zone.code === selected}
                >
                  <title>{labelOf(zone.code)}</title>
                </path>
              ))}
              {projection.cutouts.map((d) => (
                <path key={d} className={styles.cutout} d={d} />
              ))}
              {projection.outline.map((d) => (
                <path key={d} className={styles.line} d={d} />
              ))}
              {projection.wheels.map((wheel) => (
                <circle
                  key={`${wheel.cx}-${wheel.r}`}
                  className={styles.line}
                  cx={wheel.cx}
                  cy={wheel.cy}
                  r={wheel.r}
                />
              ))}
            </g>
          </g>
        ))}
      </svg>
      <Legend />
    </div>
  )
}
