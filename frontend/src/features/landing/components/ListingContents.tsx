import { Container } from '../../../shared/ui/Container'
import { Shot } from './Shot'
import { ListingContentsText } from './ListingContentsText'
import styles from '../landing.module.css'
import own from './ListingContents.module.css'

export function ListingContents() {
  return (
    <section className={`${styles.section} ${styles.tight}`} data-testid="landing-contents">
      <Container>
        <div className={styles.split}>
          <ListingContentsText />
          <Shot
            className={own.cardShot}
            src="/design/landing/listing-card.jpg"
            alt="Карточка объявления с полной картой замеров"
          />
        </div>
      </Container>
    </section>
  )
}
