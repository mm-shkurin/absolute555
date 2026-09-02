// Чертёж кузова в герое: вид сбоку и вид сверху, панели залиты цветами шкалы замеров.
// Иллюстрация, а не данные — интерактивная карта живёт на своём экране; здесь она объясняет
// за один взгляд, что именно продукт показывает вместо «не бит не крашен».
import styles from './BodyBlueprint.module.css'

const SIDE_ZONES = [
  { d: 'M96 128 L150 96 L246 96 L286 128 Z', fill: 'var(--measure-ok)' },
  { d: 'M28 128 L96 128 L96 160 L28 160 Z', fill: 'var(--measure-warn)' },
  { d: 'M96 128 L190 128 L190 160 L96 160 Z', fill: 'var(--measure-ok)' },
  { d: 'M190 128 L286 128 L286 160 L190 160 Z', fill: 'var(--measure-bad)' },
  { d: 'M286 128 L352 128 L352 160 L286 160 Z', fill: 'var(--measure-none)' },
]

const TOP_ZONES = [
  { d: 'M64 22 L132 22 L132 88 L64 88 Z', fill: 'var(--measure-ok)' },
  { d: 'M132 22 L268 22 L268 88 L132 88 Z', fill: 'var(--measure-ok)' },
  { d: 'M268 22 L352 22 L352 88 L268 88 Z', fill: 'var(--measure-warn)' },
]

export function BodyBlueprint() {
  return (
    <svg viewBox="0 0 460 330" role="img" aria-label="Схема кузова с замерами толщины краски">
      <g>
        {SIDE_ZONES.map((zone) => (
          <path key={zone.d} className={styles.zone} d={zone.d} fill={zone.fill} />
        ))}
        <path
          className={styles.line}
          d="M18 160 L18 138 Q18 128 32 126 L96 126 L152 92 Q158 88 168 88 L242 88
             Q252 88 258 92 L292 126 L400 130 Q416 133 420 144 L420 160 Z"
        />
        <path
          className={styles.line}
          d="M104 124 L156 98 L206 98 L206 124 Z M214 124 L214 98 L246 98 L280 124 Z"
        />
        <circle className={styles.line} cx="106" cy="160" r="25" />
        <circle className={styles.line} cx="106" cy="160" r="12" />
        <circle className={styles.line} cx="336" cy="160" r="25" />
        <circle className={styles.line} cx="336" cy="160" r="12" />
        <path className={styles.line} d="M18 160 L81 160 M131 160 L311 160 M361 160 L420 160" />
      </g>
      <g transform="translate(0,196)">
        {TOP_ZONES.map((zone) => (
          <path key={zone.d} className={styles.zone} d={zone.d} fill={zone.fill} />
        ))}
        <path
          className={styles.line}
          d="M28 55 Q28 30 78 22 L330 22 Q404 26 424 55 Q404 84 330 88 L78 88 Q28 80 28 55 Z"
        />
        <path
          className={styles.line}
          d="M132 24 L132 86 M268 24 L268 86 M150 34 L250 34 M150 76 L250 76"
        />
        <path className={styles.line} d="M84 26 L84 84 M352 26 L352 84" />
      </g>
      <text className={styles.caption} x="18" y="186">
        БОК
      </text>
      <text className={styles.caption} x="18" y="326">
        СВЕРХУ
      </text>
    </svg>
  )
}
