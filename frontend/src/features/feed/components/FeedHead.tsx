// Шапка выдачи: канал, счётчик и сортировка. Счётчик — рядом с вкладками намеренно: он
// относится к выбранному каналу, а не ко всей площадке.
import { ChannelTabs } from '../../../shared/ui/ChannelTabs'
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
  return (
    <div className={styles.head} data-testid="feed-head">
      <ChannelTabs current="available" />
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
