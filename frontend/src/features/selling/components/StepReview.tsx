// Шестой шаг: сводка и отправка. Перед модерацией человек видит ровно то, что уйдёт.
import { Button } from '../../../shared/ui/Button'
import { missingForSubmit, type Draft } from '../logic/draft'
import { ReviewAlerts } from './ReviewAlerts'
import { ReviewSummary } from './ReviewSummary'
import { WizardCard } from './WizardCard'
import { WizardNav } from './WizardNav'

export interface StepReviewProps {
  draft: Draft
  /** Первое фото галереи — обложка, какой её увидят в ленте. */
  coverUrl?: string | null
  /** Отказ сервера при отправке. Ошибку показывает сводка, а не отдельный экран: правки
   *  делаются здесь же. */
  error?: string | null
  onBack: () => void
  onSaveDraft: () => void
  onSubmit: () => void
  onFillThickness: () => void
}

export function StepReview({ draft, coverUrl = null, ...props }: StepReviewProps) {
  const gaps = missingForSubmit(draft)
  return (
    <WizardCard
      testId="step-review"
      title="Проверьте и отправьте"
      sub="После отправки объявление попадёт к модератору. Обычно проверка занимает несколько часов."
      nav={
        <WizardNav onBack={props.onBack}>
          <Button tone="ghost" onClick={props.onSaveDraft}>
            Сохранить черновик
          </Button>
          <Button onClick={props.onSubmit} disabled={gaps.length > 0} data-testid="submit-listing">
            Отправить на модерацию
          </Button>
        </WizardNav>
      }
    >
      <ReviewSummary draft={draft} coverUrl={coverUrl} />
      <ReviewAlerts
        error={props.error}
        gaps={gaps}
        unmeasured={draft.totalPanels - draft.measuredPanels}
        onFillThickness={props.onFillThickness}
      />
    </WizardCard>
  )
}
