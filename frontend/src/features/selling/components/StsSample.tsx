// Два примера снимка СТС: как не надо и как надо. Рисунок, а не фото: настоящий документ
// с номером и VIN в подсказке — это чужие данные на каждом экране мастера.
import { SampleBadge, SampleDocument } from './StsSampleArt'
import styles from './StepDocument.module.css'

export interface StsSampleProps {
  good: boolean
}

export function StsSample({ good }: StsSampleProps) {
  return (
    <figure className={styles.sample} data-sample={good ? 'good' : 'bad'}>
      <svg
        viewBox="0 0 160 120"
        role="img"
        aria-label={good ? 'СТС ровно и целиком' : 'СТС с бликом и обрезанным краем'}
      >
        <rect width="160" height="120" fill="var(--surface-sunken, #eef1f5)" />
        <SampleDocument good={good} />
        <SampleBadge good={good} />
      </svg>
      <figcaption>{good ? 'Так надо: ровно и целиком' : 'Так не надо: блик и обрез'}</figcaption>
    </figure>
  )
}
