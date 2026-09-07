// Витрина ленты: восемь первых объявлений той же сеткой 4×2, что и бенто героя. Машины
// настоящие — те же, что увидит человек, нажав «Перейти к ленте»; статичный список
// обещал бы витрину, которой в ленте нет.
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ButtonLink } from '../../../shared/ui/Button'
import { Container } from '../../../shared/ui/Container'
import { Cover } from '../../../shared/ui/Cover'
import { ROUTES } from '../../../shared/navigation/routes'
import { fetchFeed } from '../../../shared/api/backend/saleCarApi'
import { SHOWCASE_SIZE, TAG_LABEL, toShowcaseCar, type ShowcaseCar } from '../logic/showcaseView'
import { SectionHead } from './SectionParts'
import section from '../landing.module.css'
import styles from './FeedShowcase.module.css'

function Card({ car }: { car: ShowcaseCar }) {
  return (
    <Link to={ROUTES.listing(car.id)} className={styles.card} data-testid="showcase-card">
      <div className={styles.shotWrap}>
        {car.tag ? (
          <span className={`${styles.tag} ${car.tag === 'import' ? styles.import : ''}`}>
            {TAG_LABEL[car.tag]}
          </span>
        ) : null}
        <Cover url={car.photoUrl} caption="фото" className={styles.shot} />
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
    </Link>
  )
}

export function FeedShowcase() {
  const feed = useQuery({
    queryKey: ['landing-showcase'],
    queryFn: ({ signal }) => fetchFeed({ size: SHOWCASE_SIZE }, signal),
  })
  const cars = (feed.data?.items ?? []).map(toShowcaseCar)

  // Пустая лента — не повод показывать пустую витрину: секция обещает машины «сейчас в
  // продаже», и рамка без карточек читается как поломка.
  if (cars.length === 0) return null

  return (
    <section className={section.section} data-testid="landing-showcase">
      <Container>
        <div className={styles.head}>
          <div>
            <SectionHead
              eyebrow="Сейчас в продаже"
              title="Кузов видно ещё до звонка"
              sub={
                'Полоска под ценой — карта замеров: сколько панелей кузова уже промерено ' +
                'толщиномером. Серая — замеров нет.'
              }
            />
          </div>
          <ButtonLink to={ROUTES.feed} size="big" data-testid="showcase-feed">
            Перейти к ленте
          </ButtonLink>
        </div>
        <div className={styles.feed}>
          {cars.map((car) => (
            <Card key={car.id} car={car} />
          ))}
        </div>
      </Container>
    </section>
  )
}
