// Легенда шкалы. Пороги подписаны числами: цвет без числа — это мнение, а с числом — замер.
import { GRADE_COLOR, OK_MAX, WARN_MAX } from '../logic/panels'
import styles from './BodySchematic.module.css'

const ITEMS = [
  { color: GRADE_COLOR.ok, label: 'заводская', hint: `до ${OK_MAX} мкм` },
  { color: GRADE_COLOR.warn, label: 'перекрашено', hint: `${OK_MAX}–${WARN_MAX}` },
  { color: GRADE_COLOR.bad, label: 'шпаклёвка', hint: `больше ${WARN_MAX}` },
  { color: GRADE_COLOR.none, label: 'не замерено', hint: null },
]

export function Legend() {
  return (
    <div className={styles.legend}>
      {ITEMS.map((item) => (
        <span key={item.label}>
          <i style={{ background: item.color }} />
          {item.label} {item.hint ? <s>{item.hint}</s> : null}
        </span>
      ))}
    </div>
  )
}
