// Четвёртый шаг: фотографии. Пятнадцать — потолок, первая становится обложкой.
import { Button } from '../../../shared/ui/Button'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { MAX_PHOTOS } from '../logic/draft'
import { WizardCard, NavSpacer } from './WizardCard'
import styles from './StepPhotos.module.css'
import selling from '../selling.module.css'

export function StepPhotos({
  count,
  onAdd,
  onBack,
  onNext,
}: {
  count: number
  onAdd: () => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <WizardCard
      testId="step-photos"
      title="Фотографии автомобиля"
      sub={`До ${MAX_PHOTOS} снимков. Перетаскиванием меняется порядок, первый становится обложкой.`}
      nav={
        <>
          <Button tone="ghost" onClick={onBack}>
            Назад
          </Button>
          <NavSpacer />
          <Button onClick={onNext} data-testid="photos-next">
            Дальше
          </Button>
        </>
      }
    >
      <div className={styles.grid}>
        {Array.from({ length: count }, (_, index) => (
          <Placeholder
            key={index}
            className={[styles.slot, index === 0 ? styles.cover : ''].join(' ')}
          >
            {index + 1}
          </Placeholder>
        ))}
        {count < MAX_PHOTOS ? (
          <button type="button" className={styles.add} onClick={onAdd} aria-label="Добавить фото">
            +
          </button>
        ) : null}
      </div>
      <p className={selling.hint}>
        Снято {count} из {MAX_PHOTOS}. Покупатели чаще открывают объявления, где есть салон,
        багажник и моторный отсек, а не только три ракурса снаружи.
      </p>
    </WizardCard>
  )
}
