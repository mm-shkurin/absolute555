import { Placeholder } from '../../../shared/ui/Placeholder'
import { summaryRows, type Draft } from '../logic/draft'
import styles from './StepReview.module.css'

export interface ReviewSummaryProps {
  draft: Draft
  coverUrl: string | null
}

export function ReviewSummary({ draft, coverUrl }: ReviewSummaryProps) {
  return (
    <div className={styles.review}>
      {coverUrl ? (
        <img className={styles.cover} src={coverUrl} alt="Обложка объявления" />
      ) : (
        <Placeholder className={styles.cover}>обложка</Placeholder>
      )}
      <div className={styles.summary}>
        {summaryRows(draft).map((row) => (
          <div key={row.label}>
            <span>{row.label}</span>
            <b className={row.warn ? styles.warn : undefined}>{row.value}</b>
          </div>
        ))}
      </div>
    </div>
  )
}
