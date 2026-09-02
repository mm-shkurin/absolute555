// Пятый шаг: карта замеров. Единственный необязательный шаг мастера, и он честно назван
// необязательным — иначе продавец без прибора бросает объявление на середине.
import { Button } from '../../../shared/ui/Button'
import { WizardCard, NavSpacer } from './WizardCard'
import styles from '../selling.module.css'
import landing from './StepThickness.module.css'

export function StepThickness({
  onBack,
  onSkip,
  onFill,
}: {
  onBack: () => void
  onSkip: () => void
  onFill: () => void
}) {
  return (
    <WizardCard
      testId="step-thickness"
      title="Карта замеров — необязательно"
      sub="Шаг можно пропустить, объявление всё равно опубликуется. Но с полной картой оно получает бейдж и поднимается выше в ленте — это единственный способ попасть наверх."
      nav={
        <>
          <Button tone="ghost" onClick={onBack}>
            Назад
          </Button>
          <NavSpacer />
          <Button tone="ghost" onClick={onSkip} data-testid="thickness-skip">
            Пропустить
          </Button>
          <Button onClick={onFill}>Заполнить карту</Button>
        </>
      }
    >
      <div className={styles.pair}>
        <div className={landing.tile}>
          <h3>Что нужно</h3>
          <p>
            Толщиномер — любой, даже самый дешёвый. Прикладываете к панели, фотографируете экран
            прибора, число считывается автоматически.
          </p>
        </div>
        <div className={landing.tile}>
          <h3>Сколько это займёт</h3>
          <p>
            13 панелей, примерно по 20 секунд каждая. Можно заполнить не всё и вернуться позже —
            частичная карта тоже показывается покупателю.
          </p>
        </div>
      </div>
    </WizardCard>
  )
}
