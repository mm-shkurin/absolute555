// Четвёртый шаг: фотографии. Потолок стережёт сервер, первая становится обложкой.
import { Button } from '../../../shared/ui/Button'
import { Alert } from './Alert'
import { PhotoGrid, type PhotoGridProps } from './PhotoGrid'
import { WizardCard } from './WizardCard'
import { WizardNav } from './WizardNav'
import selling from '../selling.module.css'

export interface StepPhotosProps extends PhotoGridProps {
  error: string | null
  onBack: () => void
  onNext: () => void
}

export function StepPhotos({ error, onBack, onNext, ...gallery }: StepPhotosProps) {
  const { photos, limit } = gallery
  return (
    <WizardCard
      testId="step-photos"
      title="Фотографии автомобиля"
      sub={`До ${limit} снимков. Первый — обложка: её видят в ленте. Порядок меняется стрелками.`}
      nav={
        <WizardNav onBack={onBack}>
          <Button onClick={onNext} data-testid="photos-next">
            Дальше
          </Button>
        </WizardNav>
      }
    >
      {error ? (
        <Alert tone="bad" title="Снимок не добавлен">
          {error}
        </Alert>
      ) : null}
      <PhotoGrid {...gallery} />
      <p className={selling.hint}>
        Снято {photos.length} из {limit}. Покупатели чаще открывают объявления, где есть салон,
        багажник и моторный отсек, а не только три ракурса снаружи.
      </p>
    </WizardCard>
  )
}
