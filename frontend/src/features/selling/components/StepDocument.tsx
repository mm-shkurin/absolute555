// Первый шаг: снимок СТС и всё, чем он может закончиться. Пять состояний одного шага —
// ожидание файла, фоновая обработка, два вида отказа и ручной ввод.
import { useRef } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Placeholder } from '../../../shared/ui/Placeholder'
import type { DocumentStage } from '../logic/wizardSteps'
import { Alert } from './Alert'
import { WizardCard, NavSpacer } from './WizardCard'
import { RecognitionProgress } from './RecognitionProgress'
import { VinPrompt } from './VinPrompt'
import styles from './StepDocument.module.css'

export interface DocumentHandlers {
  /** Файл, а не сигнал: снимок уходит на сервер, и выбирать его должен сам шаг. */
  onPick: (file: File) => void
  onManual: () => void
  onRetake: () => void
  onCancel: () => void
  onDone: () => void
}

export function StepDocument({
  stage,
  vin,
  onVin,
  handlers,
}: {
  stage: DocumentStage
  vin: string
  onVin: (value: string) => void
  handlers: DocumentHandlers
}) {
  const picker = useRef<HTMLInputElement>(null)
  // `capture` не ставим: на телефоне это заперло бы выбор на камере, а снимок документа
  // часто уже лежит в галерее.
  const choose = () => picker.current?.click()
  const take = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Значение сбрасывается, чтобы повторный выбор того же файла снова дал событие.
    event.target.value = ''
    if (file) handlers.onPick(file)
  }
  if (stage === 'recognizing') return <RecognitionProgress handlers={handlers} />

  if (stage === 'unreadable') {
    return (
      <WizardCard
        testId="step-document-unreadable"
        title="Не удалось прочитать фотографию"
        nav={
          <>
            <Button tone="ghost" onClick={handlers.onManual}>
              Заполнить вручную
            </Button>
            <NavSpacer />
            <Button onClick={handlers.onRetake}>Переснять</Button>
          </>
        }
      >
        <Alert tone="bad" title="Текст на снимке не разобрать">
          Чаще всего мешают блики от вспышки и обрезанные края документа. Положите СТС на ровную
          поверхность, снимайте при дневном свете, следите, чтобы все четыре угла попали в кадр.
        </Alert>
        <div className={styles.samples}>
          <Placeholder className={styles.sample}>так не надо: блик и обрез</Placeholder>
          <Placeholder className={styles.sample}>так надо: ровно и целиком</Placeholder>
        </div>
      </WizardCard>
    )
  }

  if (stage === 'novin') return <VinPrompt vin={vin} onVin={onVin} handlers={handlers} />

  return (
    <WizardCard
      testId="step-document"
      title="Снимите свидетельство о регистрации"
      sub="Из СТС прочитается VIN, а по нему подставятся марка, модель, год, коробка и мощность. Документ в объявление не попадёт."
      nav={
        <>
          <Button tone="ghost" onClick={handlers.onManual}>
            Заполнить вручную
          </Button>
          <NavSpacer />
          <Button onClick={choose} data-testid="document-continue">
            Продолжить
          </Button>
        </>
      }
    >
      <input
        ref={picker}
        type="file"
        accept="image/jpeg,image/png"
        className={styles.picker}
        onChange={take}
        data-testid="document-file"
      />
      <button type="button" className={styles.drop} onClick={choose}>
        <span className={styles.dropIcon}>СТС</span>
        Сфотографировать или перетащить файл
        <span className={styles.dropHint}>
          JPG или PNG, до 10 МБ. Снимайте без бликов, чтобы номер VIN попал в кадр целиком.
        </span>
      </button>
    </WizardCard>
  )
}
