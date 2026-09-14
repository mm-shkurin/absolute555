// Первый шаг: снимок СТС и всё, чем он может закончиться. Пять состояний одного шага —
// ожидание файла, фоновая обработка, два вида отказа и ручной ввод.
import { useState } from 'react'
import type { DocumentStage } from '../../../shared/domain/wizardSteps'
import { DocumentUnreadable } from './DocumentUnreadable'
import { DocumentUpload } from './DocumentUpload'
import { RecognitionProgress } from './RecognitionProgress'
import { VinPrompt } from './VinPrompt'

export interface DocumentHandlers {
  /** Файл, а не сигнал: снимок уходит на сервер, и выбирать его должен сам шаг. */
  onPick: (file: File) => void
  onManual: () => void
  onRetake: () => void
  onCancel: () => void
  onDone: () => void
  /** Запустить распознавание по VIN, вписанному руками. */
  onCheckVin: () => void
}

export interface StepDocumentProps {
  stage: DocumentStage
  vin: string
  onVin: (value: string) => void
  handlers: DocumentHandlers
}

export function StepDocument({ stage, vin, onVin, handlers }: StepDocumentProps) {
  // Снимок показывается на экране распознавания: человек видит, что читается его документ.
  const [shotUrl, setShotUrl] = useState<string | null>(null)
  const pick = (file: File) => {
    setShotUrl(URL.createObjectURL(file))
    handlers.onPick(file)
  }
  if (stage === 'recognizing') return <RecognitionProgress handlers={handlers} shotUrl={shotUrl} />
  if (stage === 'unreadable') return <DocumentUnreadable handlers={handlers} />
  if (stage === 'novin') return <VinPrompt vin={vin} onVin={onVin} handlers={handlers} />
  return <DocumentUpload onManual={handlers.onManual} onPick={pick} />
}
