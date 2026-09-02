// Схема кузова: пять проекций в одном SVG, панель залита цветом своего замера.
// Одна панель встречается в нескольких проекциях — выбор подсвечивает все её вхождения.
import type { PanelCode } from '../logic/panels'
import type { PanelRow } from '../logic/thicknessMap'
import { PROJECTIONS } from './geometry'
import { Legend } from './Legend'
import styles from './BodySchematic.module.css'

interface Props {
  rows: PanelRow[]
  selected: PanelCode | null
  onSelect: (code: PanelCode) => void
}

export function BodySchematic({ rows, selected, onSelect }: Props) {
  const colorOf = (code: PanelCode) =>
    rows.find((row) => row.code === code)?.color ?? 'var(--measure-none)'
  const labelOf = (code: PanelCode) => rows.find((row) => row.code === code)?.label ?? code

  return (
    <div className={styles.sheet} data-testid="body-schematic">
      <svg viewBox="0 0 880 640" role="img" aria-label="Схема кузова, пять проекций">
        {PROJECTIONS.map((projection) => (
          <g key={projection.label}>
            <text className={styles.projectionLabel} x={projection.labelX} y={projection.labelY}>
              {projection.label}
            </text>
            {projection.zones.map((zone, index) => (
              <path
                key={`${zone.code}-${index}`}
                className={[styles.zone, zone.code === selected ? styles.selected : ''].join(' ')}
                d={zone.d}
                fill={colorOf(zone.code)}
                onClick={() => onSelect(zone.code)}
                data-panel={zone.code}
                data-selected={zone.code === selected}
              >
                <title>{labelOf(zone.code)}</title>
              </path>
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
        ))}
      </svg>
      <Legend />
    </div>
  )
}
