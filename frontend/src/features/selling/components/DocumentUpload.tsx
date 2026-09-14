import { useRef } from 'react'
import { Button } from '../../../shared/ui/Button'
import { DocumentDropZone } from './DocumentDropZone'
import { WizardCard } from './WizardCard'
import { WizardNav } from './WizardNav'

export interface DocumentUploadProps {
  onManual: () => void
  onPick: (file: File) => void
}

export function DocumentUpload({ onManual, onPick }: DocumentUploadProps) {
  const picker = useRef<HTMLInputElement>(null)
  const choose = () => picker.current?.click()
  return (
    <WizardCard
      testId="step-document"
      title="Снимите свидетельство о регистрации"
      sub="Из СТС прочитается VIN, а по нему подставятся марка, модель, год, коробка и мощность. Документ в объявление не попадёт."
      nav={
        <WizardNav backLabel="Заполнить вручную" onBack={onManual}>
          <Button onClick={choose} data-testid="document-continue">
            Продолжить
          </Button>
        </WizardNav>
      }
    >
      <DocumentDropZone inputRef={picker} onChoose={choose} onPick={onPick} />
    </WizardCard>
  )
}
