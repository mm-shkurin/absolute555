import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../shared/navigation/routes'
import type { toPersonRow } from '../logic/peopleView'
import styles from '../people.module.css'

type PersonRowView = ReturnType<typeof toPersonRow>

interface PeopleListProps {
  rows: PersonRowView[]
}

export function PeopleList({ rows }: PeopleListProps) {
  return (
    <ul className={styles.list} data-testid="people-list">
      {rows.map((row) => (
        <PersonRow key={row.id} row={row} />
      ))}
    </ul>
  )
}

const PersonRow = memo(function PersonRow({ row }: { row: PersonRowView }) {
  return (
    <li className={styles.row}>
      <Link to={ROUTES.adminPerson(row.id)} className={styles.name}>
        {row.name}
      </Link>
      <span className={styles.role}>{row.role}</span>
      {row.platform ? <span className={styles.meta}>{row.platform}</span> : null}
      <span className={styles.meta}>с {row.since}</span>
      {row.blocked ? (
        <span className={styles.blocked} data-testid="people-blocked">
          доступ закрыт
        </span>
      ) : null}
      {row.departed ? (
        <span className={styles.departed} data-testid="people-departed">
          удалил запись
        </span>
      ) : null}
    </li>
  )
})
