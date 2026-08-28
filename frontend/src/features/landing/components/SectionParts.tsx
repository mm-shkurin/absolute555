// Мелкие повторяющиеся части секций лендинга. Отдельным файлом, потому что каждую из них
// использует три-четыре секции, а не одна.
import type { ReactNode } from 'react'
import { Placeholder } from '../../../shared/ui/Placeholder'
import styles from '../landing.module.css'

export function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string
  title: string
  sub?: ReactNode
}) {
  return (
    <>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h2 className={styles.heading}>{title}</h2>
      {sub ? <p className={styles.sub}>{sub}</p> : null}
    </>
  )
}

export interface Step {
  title: string
  text: string
  shot?: string
}

export function StepList({ steps, numbered }: { steps: Step[]; numbered?: boolean }) {
  return (
    <div className={styles.cols3}>
      {steps.map((step, index) => (
        <div key={step.title} className={styles.step}>
          {numbered ? <div className={styles.number}>{`0${index + 1} —`}</div> : null}
          <h3>{step.title}</h3>
          <p>{step.text}</p>
          {step.shot ? <Placeholder className={styles.shot}>{step.shot}</Placeholder> : null}
        </div>
      ))}
    </div>
  )
}

export interface Tile {
  key?: string
  title: string
  text: string
}

export function TileList({ tiles, wide }: { tiles: Tile[]; wide?: boolean }) {
  return (
    <div className={wide ? styles.cols4 : styles.cols3}>
      {tiles.map((tile) => (
        <div key={tile.title} className={styles.tile}>
          {tile.key ? <span className={styles.tileKey}>{tile.key}</span> : null}
          <h3>{tile.title}</h3>
          <p>{tile.text}</p>
        </div>
      ))}
    </div>
  )
}
