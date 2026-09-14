import { Button } from '../../../shared/ui/Button'
import { Alert } from './Alert'
import type { DocumentHandlers } from './StepDocument'
import { StsSample } from './StsSample'
import { WizardCard } from './WizardCard'
import { WizardNav } from './WizardNav'
import styles from './StepDocument.module.css'

export interface DocumentUnreadableProps {
  handlers: DocumentHandlers
}

export function DocumentUnreadable({ handlers }: DocumentUnreadableProps) {
  return (
    <WizardCard
      testId="step-document-unreadable"
      title="Не удалось прочитать фотографию"
      nav={
        <WizardNav backLabel="Заполнить вручную" onBack={handlers.onManual}>
          <Button onClick={handlers.onRetake}>Переснять</Button>
        </WizardNav>
      }
    >
      <Alert tone="bad" title="Текст на снимке не разобрать">
        Чаще всего мешают блики от вспышки и обрезанные края документа. Положите СТС на ровную
        поверхность, снимайте при дневном свете, следите, чтобы все четыре угла попали в кадр.
      </Alert>
      <div className={styles.samples}>
        <StsSample good={false} />
        <StsSample good />
      </div>
    </WizardCard>
  )
}
