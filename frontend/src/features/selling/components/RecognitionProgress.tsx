// Фоновое распознавание СТС. Экран честно говорит, что его можно закрыть: задача живёт на
// сервере, и держать телефон открытым сорок секунд никто не станет.
import { Button } from '../../../shared/ui/Button'
import { Placeholder } from '../../../shared/ui/Placeholder'
import type { DocumentHandlers } from './StepDocument'
import { WizardCard, NavSpacer } from './WizardCard'
import styles from './StepDocument.module.css'

export function RecognitionProgress({ handlers }: { handlers: DocumentHandlers }) {
  return (
    <WizardCard
      testId="step-document-recognizing"
      title="Распознаём документ"
      sub="Обработка идёт в фоне. Можно свернуть приложение — черновик сохранён, результат придёт уведомлением."
      nav={
        <>
          <Button tone="ghost" onClick={handlers.onCancel}>
            Отмена
          </Button>
          <NavSpacer />
          <Button onClick={handlers.onDone}>Готово</Button>
        </>
      }
    >
      <div className={styles.recognizing}>
        <Placeholder className={styles.shot}>снимок СТС</Placeholder>
        <div>
          <div className={styles.working}>
            <span className={styles.spinner} /> Читаем текст и разбираем VIN
          </div>
          <div className={styles.progress}>
            <i style={{ width: '48%' }} />
          </div>
          <p className={styles.dropHint}>Обычно занимает 10–40 секунд.</p>
        </div>
      </div>
    </WizardCard>
  )
}
