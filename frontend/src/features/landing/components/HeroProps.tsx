// Предметы вокруг героя: номерной знак резкий и цветной, толщиномер приглушён, колесо
// уведено в расфокус третьим планом. На телефоне их нет — там они лезут на текст.
import styles from './HeroProps.module.css'

const PROPS = [
  { file: 'tire', className: 'tire' },
  { file: 'plate', className: 'plate' },
  { file: 'gauge', className: 'gauge' },
] as const

export function HeroProps() {
  return (
    <div className={styles.props} aria-hidden="true">
      {PROPS.map((item) => (
        <span key={item.file} className={`${styles.prop} ${styles[item.className]}`}>
          <img src={`/design/props/${item.file}.svg`} alt="" />
        </span>
      ))}
    </div>
  )
}
