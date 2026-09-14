import type { PanelCode } from './bodyPanels'
import type { Projection } from './geometry/types'
import styles from './BodySchematic.module.css'

interface Props {
  projection: Projection
  selected: PanelCode | null
  onSelect: (code: PanelCode) => void
  colorOf: (code: PanelCode) => string
  labelOf: (code: PanelCode) => string
}

export function ProjectionShape({ projection, selected, onSelect, colorOf, labelOf }: Props) {
  return (
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
      <ProjectionLines projection={projection} />
    </g>
  )
}

function ProjectionLines({ projection }: { projection: Projection }) {
  return (
    <>
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
    </>
  )
}
