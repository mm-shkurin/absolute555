// Шестой шаг: сводка и отправка. Перед модерацией человек видит ровно то, что уйдёт.
import { Button } from '../../../shared/ui/Button'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { missingForSubmit, summaryRows, type Draft } from '../logic/draft'
import { Alert } from './Alert'
import { WizardCard, NavSpacer } from './WizardCard'
import styles from './StepReview.module.css'

interface Props {
  draft: Draft
  onBack: () => void
  onSaveDraft: () => void
  onSubmit: () => void
  onFillThickness: () => void
}

export function StepReview({ draft, onBack, onSaveDraft, onSubmit, onFillThickness }: Props) {
  const gaps = missingForSubmit(draft)
  const unmeasured = draft.totalPanels - draft.measuredPanels

  return (
    <WizardCard
      testId="step-review"
      title="Проверьте и отправьте"
      sub="После отправки объявление попадёт к модератору. Обычно проверка занимает несколько часов."
      nav={
        <>
          <Button tone="ghost" onClick={onBack}>
            Назад
          </Button>
          <NavSpacer />
          <Button tone="ghost" onClick={onSaveDraft}>
            Сохранить черновик
          </Button>
          <Button onClick={onSubmit} disabled={gaps.length > 0} data-testid="submit-listing">
            Отправить на модерацию
          </Button>
        </>
      }
    >
      <div className={styles.review}>
        <Placeholder className={styles.cover}>обложка</Placeholder>
        <div className={styles.summary}>
          {summaryRows(draft).map((row) => (
            <div key={row.label}>
              <span>{row.label}</span>
              <b className={row.warn ? styles.warn : undefined}>{row.value}</b>
            </div>
          ))}
        </div>
      </div>
      {gaps.length > 0 ? (
        <Alert tone="bad" title="Без этого объявление не отправить" spaced>
          Не заполнено: {gaps.join(', ')}.
        </Alert>
      ) : null}
      {unmeasured > 0 ? (
        <Alert tone="warn" spaced>
          Не замерено панелей: {unmeasured} — бейджа «полная карта» не будет.{' '}
          <button type="button" onClick={onFillThickness} className={styles.link}>
            Домерить
          </button>{' '}
          можно и после публикации.
        </Alert>
      ) : null}
    </WizardCard>
  )
}
