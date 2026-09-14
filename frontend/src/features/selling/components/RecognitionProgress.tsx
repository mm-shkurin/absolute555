// Фоновое распознавание СТС. Экран честно говорит, что его можно закрыть: задача живёт на
// сервере, и держать телефон открытым сорок секунд никто не станет.
import { Button } from '../../../shared/ui/Button'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { RecognitionStatus } from './RecognitionStatus'
import type { DocumentHandlers } from './StepDocument'
import { WizardCard } from './WizardCard'
import { WizardNav } from './WizardNav'
import styles from './StepDocument.module.css'

export interface RecognitionProgressProps {
  handlers: DocumentHandlers
  /** Сам выбранный снимок: человек видит, что распознаётся именно его документ. */
  shotUrl?: string | null
}

export function RecognitionProgress({ handlers, shotUrl = null }: RecognitionProgressProps) {
  return (
    <WizardCard
      testId="step-document-recognizing"
      title="Распознаём документ"
      sub="Обработка идёт в фоне. Можно свернуть приложение — черновик сохранён, результат придёт уведомлением."
      nav={
        <WizardNav backLabel="Отмена" onBack={handlers.onCancel}>
          <Button onClick={handlers.onDone}>Готово</Button>
        </WizardNav>
      }
    >
      <div className={styles.recognizing}>
        {shotUrl ? (
          <img className={styles.shot} src={shotUrl} alt="Снимок СТС" />
        ) : (
          <Placeholder className={styles.shot}>снимок СТС</Placeholder>
        )}
        <RecognitionStatus />
      </div>
    </WizardCard>
  )
}
