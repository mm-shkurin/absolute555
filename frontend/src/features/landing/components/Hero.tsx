// Первый экран: обещание слева, доказательство справа.
import { ButtonLink } from '../../../shared/ui/Button'
import { Container } from '../../../shared/ui/Container'
import { ROUTES } from '../../../shared/navigation/routes'
import { BodyBlueprint } from './BodyBlueprint'
import styles from './Hero.module.css'

const SCALE = [
  { color: 'var(--measure-ok)', label: 'заводская' },
  { color: 'var(--measure-warn)', label: 'перекрас' },
  { color: 'var(--measure-bad)', label: 'шпаклёвка' },
  { color: 'var(--measure-none)', label: 'не мерили' },
]

export function Hero() {
  return (
    <div className={styles.hero} data-testid="landing-hero">
      <Container className={styles.inner}>
        <div>
          <h1 className={styles.title}>
            Авторынок Омска, где <em>видно, что перекрашено</em>
          </h1>
          <p className={styles.lead}>
            Каждое объявление проходит модерацию, у продавца есть рейтинг по закрытым сделкам, а
            толщину краски на кузове показывает не фраза «не бит не крашен», а картинка с замерами.
          </p>
          <div className={styles.actions}>
            <ButtonLink to={ROUTES.feed} size="big" data-testid="hero-browse">
              Смотреть машины
            </ButtonLink>
            <ButtonLink to={ROUTES.selling} size="big" tone="ghost" data-testid="hero-sell">
              Продать свою
            </ButtonLink>
          </div>
          <p className={styles.note}>
            Объявление создаётся с фотографии СТС — марку, модель и год приложение заполнит само.
          </p>
        </div>

        <div className={styles.blueprint}>
          <BodyBlueprint />
          <div className={styles.scale}>
            {SCALE.map((item) => (
              <span key={item.label}>
                <i style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </div>
  )
}
