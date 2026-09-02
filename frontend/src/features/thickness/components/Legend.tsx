// Легенда шкалы. Пороги подписаны числами: цвет без числа — это мнение, а с числом — замер.
// Границы принадлежат серверу — здесь они подпись, а не правило (`logic/panels.ts`).
import { GRADE_COLOR, GRADE_RANGE, GRADE_WORD, type Grade } from '../logic/panels'
import styles from './BodySchematic.module.css'

const ITEMS: Grade[] = ['factory', 'repaint', 'filler', 'none']

export function Legend() {
  return (
    <div className={styles.legend}>
      {ITEMS.map((grade) => (
        <span key={grade}>
          <i style={{ background: GRADE_COLOR[grade] }} />
          {GRADE_WORD[grade]} {GRADE_RANGE[grade] ? <s>{GRADE_RANGE[grade]}</s> : null}
        </span>
      ))}
    </div>
  )
}
