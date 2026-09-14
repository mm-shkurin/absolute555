import { Container } from '../../../shared/ui/Container'
import { Shot } from './Shot'
import { MobileAppPitch, type MobileAppPitchProps } from './MobileAppPitch'
import styles from '../landing.module.css'
import own from './ListingContents.module.css'

export function MobileApp({ onDownload }: MobileAppPitchProps) {
  return (
    <section className={`${styles.section} ${styles.tight}`} data-testid="landing-app">
      <Container>
        <div className={styles.split}>
          <Shot
            className={own.appShot}
            fit="contain"
            src="/design/landing/app-shot.png"
            alt="Лента объявлений на телефоне"
          />
          <MobileAppPitch onDownload={onDownload} />
        </div>
      </Container>
    </section>
  )
}
