// Нижняя навигация телефона: пять входов, которыми человек пользуется каждый день.
// Гостю она тоже видна — разделы публичны, а личные ведут на вход; спрятать их значило бы
// сделать вид, что у площадки нет ни офферов, ни чатов.
import { NavLink } from 'react-router-dom'
import { ROUTES } from '../navigation/routes'
import styles from './TabBar.module.css'

export interface TabCounts {
  offers?: number
  chats?: number
}

export function TabBar({ counts = {} }: { counts?: TabCounts }) {
  return (
    <nav className={styles.bar} data-testid="tab-bar">
      <Tab to={ROUTES.feed} label="Лента">
        <path d="M3 13l2-5a3 3 0 0 1 3-2h8a3 3 0 0 1 3 2l2 5v5h-3M3 18v-5m0 5h3m12 0H6" />
        <circle cx="7.5" cy="15.5" r="1.5" />
        <circle cx="16.5" cy="15.5" r="1.5" />
      </Tab>
      <Tab to={ROUTES.offers} label="Офферы" badge={counts.offers}>
        <path d="M12 3v18M8 7h6a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h6" />
      </Tab>
      <Tab to={ROUTES.selling} label="Продать" sell>
        <path d="M12 5v14M5 12h14" />
      </Tab>
      <Tab to={ROUTES.chats} label="Чаты" badge={counts.chats}>
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
      </Tab>
      <Tab to={ROUTES.profile} label="Профиль">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </Tab>
    </nav>
  )
}

function Tab({
  to,
  label,
  badge,
  sell,
  children,
}: {
  to: string
  label: string
  badge?: number
  sell?: boolean
  children: React.ReactNode
}) {
  return (
    <NavLink to={to} className={[styles.tab, sell ? styles.sell : ''].join(' ')}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {children}
      </svg>
      {label}
      {badge ? <span className={styles.dot}>{badge > 9 ? '9+' : badge}</span> : null}
    </NavLink>
  )
}
