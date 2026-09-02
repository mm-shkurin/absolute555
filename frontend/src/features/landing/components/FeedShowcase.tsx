// Витрина ленты: восемь карточек той же сеткой 4×2, что и бенто героя. Повтор сетки и
// шкалы намеренный — лента читается как продолжение разобранного объявления.
import { ButtonLink } from '../../../shared/ui/Button'
import { Container } from '../../../shared/ui/Container'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { ROUTES } from '../../../shared/navigation/routes'
import { SHOWCASE_CARS, TAG_LABEL, type ShowcaseCar } from '../content/showcaseCars'
import { SectionHead } from './SectionParts'
import section from '../landing.module.css'
import styles from './FeedShowcase.module.css'

function Card({ car }: { car: ShowcaseCar }) {
  return (
    <article className={styles.card}>
      <div className={styles.shotWrap}>
        {car.tag ? (
          <span className={`${styles.tag} ${car.tag === 'import' ? styles.import : ''}`}>
            {TAG_LABEL[car.tag]}
          </span>
        ) : null}
        <Placeholder className={styles.shot}>фото</Placeholder>
      </div>
      <div className={styles.body}>
        <span className={styles.name}>{car.name}</span>
        <span className={styles.price}>{car.price}</span>
        <span className={styles.meta}>{car.meta}</span>
        <span className={styles.bar}>
          {car.panels.map((panel, index) => (
            <i key={index} className={styles[panel]} />
          ))}
        </span>
      </div>
    </article>
  )
}

export function FeedShowcase() {
  return (
    <section className={section.section} data-testid="landing-showcase">
      <Container>
        <div className={styles.head}>
          <div>
            <SectionHead
              eyebrow="Сейчас в продаже"
              title="Кузов видно ещё до звонка"
              sub={
                'Полоска под ценой — карта замеров: сколько панелей заводские, сколько ' +
                'перекрашены, где шпаклёвка. Серая — замеров нет.'
              }
            />
          </div>
          <ButtonLink to={ROUTES.feed} size="big" data-testid="showcase-feed">
            Перейти к ленте
          </ButtonLink>
        </div>
        <div className={styles.feed}>
          {SHOWCASE_CARS.map((car) => (
            <Card key={car.name} car={car} />
          ))}
        </div>
      </Container>
    </section>
  )
}
