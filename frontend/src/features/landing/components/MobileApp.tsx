import { Container } from '../../../shared/ui/Container'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { ROUTES } from '../../../shared/navigation/routes'
import { SectionHead } from './SectionParts'
import styles from '../landing.module.css'
import own from './ListingContents.module.css'

export function MobileApp({ onDownload }: { onDownload?: () => void }) {
  return (
    <section className={`${styles.section} ${styles.tight}`} data-testid="landing-app">
      <Container>
        <div className={styles.split}>
          <Placeholder className={own.appShot}>снимок приложения на телефоне</Placeholder>
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
        </div>
      </Container>
    </section>
  )
}
