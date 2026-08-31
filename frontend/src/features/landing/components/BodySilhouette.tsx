// Кузов сбоку одной строкой — версия чертежа для плитки героя. Полный чертёж с видом
// сверху живёт в секции про карту замеров: в плитке 142px высотой он нечитаем.
import styles from './BodyBlueprint.module.css'

const ZONES = [
  { d: 'M64 40 L96 22 L160 22 L188 40 Z', fill: 'var(--measure-ok)' },
  { d: 'M18 40 L64 40 L64 62 L18 62 Z', fill: 'var(--measure-warn)' },
  { d: 'M64 40 L126 40 L126 62 L64 62 Z', fill: 'var(--measure-ok)' },
  { d: 'M126 40 L188 40 L188 62 L126 62 Z', fill: 'var(--measure-bad)' },
  { d: 'M188 40 L232 40 L232 62 L188 62 Z', fill: 'var(--measure-none)' },
]

export function BodySilhouette() {
  return (
    <svg
      className={styles.chart}
      viewBox="0 0 300 96"
      role="img"
      aria-label="Кузов с замерами толщины краски"
    >
      {ZONES.map((zone) => (
        <path key={zone.d} className={styles.zone} d={zone.d} fill={zone.fill} />
      ))}
      <path
        className={styles.line}
        d="M12 62 L12 46 Q12 38 22 37 L64 37 L98 18 Q103 15 110 15 L158 15
           Q165 15 169 18 L192 37 L264 40 Q276 42 278 51 L278 62 Z"
      />
      <circle className={styles.line} cx="70" cy="62" r="16" />
      <circle className={styles.line} cx="70" cy="62" r="7" />
      <circle className={styles.line} cx="222" cy="62" r="16" />
      <circle className={styles.line} cx="222" cy="62" r="7" />
      <path className={styles.line} d="M12 62 L54 62 M86 62 L206 62 M238 62 L278 62" />
    </svg>
  )
}
