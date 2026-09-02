import { Container } from '../../../shared/ui/Container'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { LISTING_CONTENTS } from '../content/faq'
import { SectionHead } from './SectionParts'
import styles from '../landing.module.css'
import own from './ListingContents.module.css'

export function ListingContents() {
  return (
    <section className={`${styles.section} ${styles.tight}`} data-testid="landing-contents">
      <Container>
        <div className={styles.split}>
          <div>
            <SectionHead
              eyebrow="Что внутри объявления"
              title="Всё, что обычно приходится выпытывать в переписке"
              sub={
                'Продавец заполняет один раз, покупатель не задаёт одни и те же пять вопросов ' +
                'каждому.'
              }
            />
            <ul className={own.list}>
              {LISTING_CONTENTS.map((item) => (
                <li key={item.lead}>
                  <b>{item.lead}</b> {item.text}
                </li>
              ))}
            </ul>
          </div>
          <Placeholder className={own.cardShot}>макет карточки объявления</Placeholder>
        </div>
      </Container>
    </section>
  )
}
