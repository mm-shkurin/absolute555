// Список панелей рядом со схемой: то же содержимое, другой способ читать. По схеме ищут
// глазами «где красное», по списку — конкретную панель.
import type { PanelCode } from '../logic/panels'
import type { PanelRow } from '../logic/thicknessMap'
import styles from './PanelList.module.css'

export function PanelList({
  rows,
  selected,
  onSelect,
}: {
  rows: PanelRow[]
  selected: PanelCode | null
  onSelect: (code: PanelCode) => void
}) {
  return (
    <div data-testid="panel-list">
      {rows.map((row) => (
        <button
          key={row.code}
          type="button"
          className={[styles.row, row.code === selected ? styles.selected : ''].join(' ')}
          onClick={() => onSelect(row.code)}
          data-panel={row.code}
        >
          <span className={styles.swatch} style={{ background: row.color }} />
          <b>{row.label}</b>
          <span className={[styles.value, row.measured ? '' : styles.unmeasured].join(' ')}>
            {row.value}
          </span>
        </button>
      ))}
    </div>
  )
}
