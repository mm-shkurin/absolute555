// Шапка, общая для лендинга и ленты. Набор кнопок справа — единственное, что меняется от
// того, вошёл человек или нет: остальное публично, и гость видит те же разделы.
import { NavLink, Link } from 'react-router-dom'
import { ROUTES } from '../navigation/routes'
import { Button, ButtonLink } from './Button'
import { Container } from './Container'
import { ThemeToggle } from './ThemeToggle'
import styles from './SiteHeader.module.css'

const SECTIONS = [
  { to: ROUTES.feed, label: 'В наличии' },
  { to: ROUTES.importFeed, label: 'Под заказ' },
]

// `floating` — вариант для лендинга: не полоса во всю ширину, а стеклянная панель внутри
// контейнера. На рабочих экранах шапка остаётся полосой, иначе она перестанет отделять
// содержимое от края окна при прокрутке списка.
export function SiteHeader({
  signedIn,
  onSignIn,
  floating,
}: {
  signedIn: boolean
  onSignIn?: () => void
  floating?: boolean
}) {
  return (
    <header
      className={[styles.header, floating ? styles.floating : ''].filter(Boolean).join(' ')}
      data-testid="site-header"
    >
      <Container className={styles.inner}>
        <Link to={ROUTES.home} className={styles.logo} data-testid="header-logo">
          <img src="/brand/logo-mark.svg" alt="" aria-hidden="true" />
          <b>Абсолют</b>
          <span className={styles.numeral}>555</span>
        </Link>
        <nav className={styles.nav}>
          {SECTIONS.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              className={({ isActive }) => (isActive ? styles.current : undefined)}
            >
              {section.label}
            </NavLink>
          ))}
        </nav>
        <span className={styles.spacer} />
        <div className={styles.actions}>
          <ThemeToggle />
          {signedIn ? (
            <Link to={ROUTES.profile} className={styles.avatar} aria-label="Профиль" />
          ) : (
            <Button tone="ghost" onClick={onSignIn} data-testid="header-sign-in">
              Войти
            </Button>
          )}
          <ButtonLink to={ROUTES.selling} data-testid="header-sell">
            Разместить
          </ButtonLink>
        </div>
      </Container>
    </header>
  )
}
