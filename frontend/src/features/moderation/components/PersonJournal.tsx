// Журнал действий над учётной записью. Показывается только администратору: модератору
// сервер на эту ручку отвечает отказом, и раздел, который всё равно не наполнится,
// экран не рисует.
import { useQuery } from '@tanstack/react-query'
import { fetchUserAudit } from '../../../shared/api/backend/adminApi'
import { EmptyNotice, ListSkeleton } from '../../../shared/ui/ListStates'
import { toJournalRow } from '../logic/peopleView'
import styles from '../people.module.css'

export function PersonJournal({ userId }: { userId: string }) {
  const journal = useQuery({
    queryKey: ['person-journal', userId],
    queryFn: ({ signal }) => fetchUserAudit(userId, signal),
  })

  if (journal.isPending) return <ListSkeleton rows={2} />
  // Отказ здесь молчит намеренно: журнала нет только у того, кому он не положен, и
  // сообщение об ошибке рассказало бы модератору о разделе, которого он не увидит.
  if (journal.isError) return null

  const rows = journal.data.map(toJournalRow)
  if (rows.length === 0) return <EmptyNotice title="С этой записью ничего не делали" />

  return (
    <ul className={styles.journal} data-testid="person-journal">
      {rows.map((row) => (
        <li key={row.id} className={styles.journalRow}>
          <b>{row.action}</b>
          {row.details ? <span className={styles.meta}>{row.details}</span> : null}
          <span className={styles.reason}>{row.reason}</span>
          <span className={styles.meta}>
            {row.actor}, {row.at}
          </span>
        </li>
      ))}
    </ul>
  )
}
