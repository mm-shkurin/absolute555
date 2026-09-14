import type { Dispatch, SetStateAction } from 'react'
import { Button } from '../../../shared/ui/Button'
import styles from '../people.module.css'

interface PeoplePagerProps {
  page: number
  pages: number
  onPage: Dispatch<SetStateAction<number>>
}

export function PeoplePager({ page, pages, onPage }: PeoplePagerProps) {
  return (
    <div className={styles.pager} data-testid="people-pager">
      <Button tone="ghost" disabled={page <= 1} onClick={() => onPage((current) => current - 1)}>
        Назад
      </Button>
      <span>
        {page} из {pages}
      </span>
      <Button
        tone="ghost"
        disabled={page >= pages}
        onClick={() => onPage((current) => current + 1)}
        data-testid="people-next"
      >
        Дальше
      </Button>
    </div>
  )
}
