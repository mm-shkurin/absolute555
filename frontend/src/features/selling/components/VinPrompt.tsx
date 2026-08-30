// Документ прочитан, а VIN — нет. Отдельный экран, а не поле в общей форме: остальные
// характеристики без VIN не подставятся, и просить надо ровно одно.
import { Button } from '../../../shared/ui/Button'
import { Alert } from './Alert'
import { Form, Field, TextInput } from '../../../shared/ui/Form'
import type { DocumentHandlers } from './StepDocument'
import { WizardCard, NavSpacer } from './WizardCard'
import styles from '../selling.module.css'

export function VinPrompt({
  vin,
  onVin,
  handlers,
}: {
  vin: string
  onVin: (value: string) => void
  handlers: DocumentHandlers
}) {
  return (
    <WizardCard
      testId="step-document-novin"
      title="Документ прочитали, но VIN не разобрали"
      nav={
        <>
          <Button tone="ghost" onClick={handlers.onManual}>
            Заполнить вручную
          </Button>
          <NavSpacer />
          <Button tone="ghost" onClick={handlers.onRetake}>
            Переснять СТС
          </Button>
          <Button onClick={handlers.onDone}>Проверить VIN</Button>
        </>
      }
    >
      <Alert tone="warn" title="Не хватает одного поля">
        Остальной текст распознался. Впишите 17 символов VIN из документа — по нему подтянутся
        марка, модель, год и характеристики.
      </Alert>
      <div className={styles.afterAlert}>
        <Form>
          <Field label="VIN — 17 символов" full>
            <TextInput
              value={vin}
              onChange={onVin}
              placeholder="JTJHY00W004012345"
              mono
              testId="vin-input"
            />
          </Field>
        </Form>
      </div>
    </WizardCard>
  )
}
