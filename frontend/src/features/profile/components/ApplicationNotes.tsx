import { PanelNote } from '../../../shared/ui/Panel'
import styles from '../profile.module.css'

interface ApplicationNotesProps {
  failure: string | null | undefined
  gaps: string[]
}

export function ApplicationNotes({ failure, gaps }: ApplicationNotesProps) {
  return (
    <>
      <div className={styles.note}>
        <PanelNote>
          Площадка не проверяет ваши документы и не даёт гарантий покупателям от вашего имени.
          Одобрение означает только то, что модератор посчитал заявку правдоподобной.
        </PanelNote>
      </div>
      {failure ? (
        <p className={styles.gaps} data-testid="request-failure">
          {failure}
        </p>
      ) : null}
      {gaps.length > 0 ? (
        <p className={styles.gaps}>Чтобы отправить, не хватает: {gaps.join(', ')}.</p>
      ) : null}
    </>
  )
}
