import { Container } from '../../../shared/ui/Container'
import { ButtonLink } from '../../../shared/ui/Button'
import { SiteFooter } from '../../../shared/ui/SiteFooter'
import { ROUTES } from '../../../shared/navigation/routes'
import styles from '../landing.module.css'
import own from './FinalCta.module.css'

export function FinalCta() {
  return (
    <section className={`${styles.section} ${styles.tight}`} data-testid="landing-cta">
      <Container>
        <div className={own.cta}>
          <div className={own.row}>
            <div className={own.text}>
              <h2 className={own.title}>Разместить объявление — две минуты</h2>
              <p className={own.sub}>
                Вход через Яндекс ID или VK ID. Ни пароля, ни почты, ни подтверждения по СМС.
              </p>
            </div>
            <ButtonLink to={ROUTES.selling} size="big" data-testid="cta-start">
              Начать
            </ButtonLink>
          </div>
        </div>
        <SiteFooter />
      </Container>
    </section>
  )
}
