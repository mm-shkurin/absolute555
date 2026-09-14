import { Button, ButtonLink } from '../../../shared/ui/Button'
import { ROUTES } from '../../../shared/navigation/routes'
import { SectionHead } from './SectionParts'
import styles from '../landing.module.css'

export interface MobileAppPitchProps {
  onDownload?: () => void
}

export function MobileAppPitch({ onDownload }: MobileAppPitchProps) {
  return (
    <div>
      <SectionHead
        eyebrow="Android"
        title="Приложение для тех, кто снимает машину во дворе"
        sub={
          'Черновик сохраняется на каждом шаге: сел телефон — вернётесь и допишете. ' +
          'Распознавание идёт в фоне, ждать с открытым экраном не нужно.'
        }
      />
      <div className={styles.ctaRow}>
        <Button tone="ghost" onClick={onDownload} data-testid="app-download">
          Скачать в RuStore
        </Button>
        <ButtonLink to={ROUTES.feed} tone="ghost">
          Открыть в браузере
        </ButtonLink>
      </div>
      <p className={styles.note}>
        Веб-версия умеет то же самое — приложение удобнее только камерой.
      </p>
    </div>
  )
}
