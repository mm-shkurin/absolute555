// Переход между разделами модерации. Без него каждый из них достижим только по прямому
// адресу: модератор разбирает объявления, жалобы, профили и заявки подряд, а не по одному
// разу за сессию.
import { NavLink } from 'react-router-dom'
import { ROUTES } from '../../../shared/navigation/routes'
import styles from '../moderation.module.css'

const SECTIONS = [
  { to: ROUTES.moderationQueue, label: 'Объявления' },
  { to: ROUTES.moderationComplaints, label: 'Жалобы' },
  { to: ROUTES.moderationSuppliers, label: 'Поставщики' },
  { to: ROUTES.moderationRoles, label: 'Заявки на роль' },
]

export function ModerationNav() {
  return (
    <nav className={styles.sections} data-testid="moderation-nav">
      {SECTIONS.map((section) => (
        <NavLink
          key={section.to}
          to={section.to}
          className={({ isActive }) =>
            [styles.section, isActive ? styles.sectionCurrent : ''].join(' ')
          }
        >
          {section.label}
        </NavLink>
      ))}
    </nav>
  )
}
