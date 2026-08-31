// Первый экран: короткое обещание слева, под ним объявление, разобранное на плитки.
import { ButtonLink } from '../../../shared/ui/Button'
import { Container } from '../../../shared/ui/Container'
import { ROUTES } from '../../../shared/navigation/routes'
import { HeroBento } from './HeroBento'
import { HeroProps } from './HeroProps'
import styles from './Hero.module.css'

export function Hero() {
  return (
    <div className={styles.hero} data-testid="landing-hero">
      <span className={styles.grid} aria-hidden="true" />
      <HeroProps />
      <Container>
        <div className={styles.intro}>
          <h1 className={styles.title}>
            Авторынок Омска, где <em>видно, что перекрашено</em>
          </h1>
          <p className={styles.lead}>
            Объявление здесь разобрано на факты: замер краски по каждой панели, характеристики из
            VIN, продавец с историей сделок.
          </p>
          <div className={styles.actions}>
            <ButtonLink to={ROUTES.feed} size="big" data-testid="hero-browse">
              Смотреть машины
            </ButtonLink>
            <ButtonLink to={ROUTES.selling} size="big" tone="ghost" data-testid="hero-sell">
              Продать свою
            </ButtonLink>
            <span className={styles.note}>248 машин · публикация бесплатно</span>
          </div>
        </div>
        <HeroBento />
      </Container>
    </div>
  )
}
