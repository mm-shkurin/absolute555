import type { SpecRow } from '../logic/listingDetail'
import styles from '../listing.module.css'

interface SpecsBlockProps {
  specs: SpecRow[]
}

export function SpecsBlock({ specs }: SpecsBlockProps) {
  return (
    <div className={styles.block}>
      <h3>Характеристики</h3>
      <div className={styles.specs}>
        {specs.map((row) => (
          <div key={row.label}>
            <span>{row.label}</span>
            <b className={row.mono ? styles.vin : undefined}>{row.value}</b>
          </div>
        ))}
      </div>
    </div>
  )
}
