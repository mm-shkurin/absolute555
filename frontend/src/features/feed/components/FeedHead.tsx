// Шапка выдачи: канал, счётчик и сортировка. Счётчик — рядом с вкладками намеренно: он
// относится к выбранному каналу, а не ко всей площадке.
import { ROUTES } from '../../../shared/navigation/routes'
import { useNavigate } from 'react-router-dom'
import type { FeedQuery, FeedSort } from '../logic/feedQuery'
import styles from '../feed.module.css'

const SORTS: { value: FeedSort; label: string }[] = [
  { value: 'newest', label: 'сначала новые' },
  { value: 'price-asc', label: 'цена по возрастанию' },
  { value: 'price-desc', label: 'цена по убыванию' },
]

export function FeedHead({
  query,
  countText,
  onChange,
}: {
  query: FeedQuery
  countText: string
  onChange: (query: FeedQuery) => void
}) {
  const navigate = useNavigate()

  return (
    <div className={styles.head} data-testid="feed-head">
      <div className={styles.tabs}>
        <button
          type="button"
          aria-pressed={query.tab === 'available'}
          onClick={() => onChange({ ...query, tab: 'available' })}
        >
          В наличии
        </button>
        <button
          type="button"
          aria-pressed={query.tab === 'import'}
          onClick={() => navigate(ROUTES.importFeed)}
        >
          Под заказ
        </button>
      </div>
      <span className={styles.count} data-testid="feed-count">
        {countText}
      </span>
      <span className={styles.spacer} />
      <label className={styles.sort}>
        Сортировка
        <select
          value={query.sort}
          onChange={(event) => onChange({ ...query, sort: event.target.value as FeedSort })}
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
