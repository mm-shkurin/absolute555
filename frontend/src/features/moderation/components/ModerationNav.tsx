// Переход между разделами модерации. Без него каждый из них достижим только по прямому
// адресу: модератор разбирает объявления, жалобы, профили и заявки подряд, а не по одному
// разу за сессию.
import { NavLink } from 'react-router-dom'
import { ROUTES } from '../../../shared/navigation/routes'
import styles from '../moderation.module.css'

// «Сводка» первой: с неё видно, где затор, и оттуда переходят в раздел. «Люди» —
// последними: туда идут от конкретного разбора, а не наоборот.
const SECTIONS = [
  { to: ROUTES.adminSummary, label: 'Сводка', end: true },
  { to: ROUTES.moderationQueue, label: 'Объявления' },
  { to: ROUTES.moderationComplaints, label: 'Жалобы' },
  { to: ROUTES.moderationSuppliers, label: 'Витрины поставщиков' },
  { to: ROUTES.moderationRoles, label: 'Заявки в поставщики' },
  { to: ROUTES.adminPeople, label: 'Люди' },
]

export function ModerationNav() {
  return (
    <nav className={styles.sections} data-testid="moderation-nav">
      {SECTIONS.map((section) => (
        <NavLink
          key={section.to}
          to={section.to}
          // `end` только у сводки: её адрес — начало всех остальных, и без этого она
          // подсвечивалась бы текущей на каждом разделе.
          end={section.end}
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
