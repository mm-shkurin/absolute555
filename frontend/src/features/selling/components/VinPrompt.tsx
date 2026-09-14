// Документ прочитан, а VIN — нет. Отдельный экран, а не поле в общей форме: остальные
// характеристики без VIN не подставятся, и просить надо ровно одно.
import { Button } from '../../../shared/ui/Button'
import { Alert } from './Alert'
import type { DocumentHandlers } from './StepDocument'
import { VinField } from './VinField'
import { WizardCard } from './WizardCard'
import { WizardNav } from './WizardNav'

export interface VinPromptProps {
  vin: string
  onVin: (value: string) => void
  handlers: DocumentHandlers
}

export function VinPrompt({ vin, onVin, handlers }: VinPromptProps) {
  return (
    <WizardCard
      testId="step-document-novin"
      title="Документ прочитали, но VIN не разобрали"
      nav={
        <WizardNav backLabel="Заполнить вручную" onBack={handlers.onManual}>
          <Button tone="ghost" onClick={handlers.onRetake}>
            Переснять СТС
          </Button>
          <Button
            onClick={handlers.onCheckVin}
            disabled={vin.trim().length !== 17}
            data-testid="check-vin"
          >
            Проверить VIN
          </Button>
        </WizardNav>
      }
    >
      <Alert tone="warn" title="Не хватает одного поля">
        Остальной текст распознался. Впишите 17 символов VIN из документа — по нему подтянутся
        марка, модель, год и характеристики.
      </Alert>
      <VinField vin={vin} onVin={onVin} />
    </WizardCard>
  )
}
