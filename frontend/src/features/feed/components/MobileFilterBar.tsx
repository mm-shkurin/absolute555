// Полоса фильтров для узкого экрана. Показывает только то, что уже выбрано, плюс вход в
// полную панель: на 390 точках ширины список всех фильтров не помещается ни в какой форме.
import { toggleTransmission, type FeedQuery } from '../logic/feedQuery'
import panel from './FilterPanel.module.css'
import styles from '../feed.module.css'

export function MobileFilterBar({
  query,
  onChange,
  onOpenSheet,
}: {
  query: FeedQuery
  onChange: (query: FeedQuery) => void
  onOpenSheet?: () => void
}) {
  return (
    <div className={styles.mobileFilters} data-testid="mobile-filters">
      <button type="button" className={panel.chip} onClick={onOpenSheet}>
        Фильтры
      </button>
      {query.brand ? (
        <button
          type="button"
          className={panel.chip}
          aria-pressed="true"
          onClick={() => onChange({ ...query, brand: undefined })}
        >
          {query.brand} ✕
        </button>
      ) : null}
      {query.transmissions.map((item) => (
        <button
          key={item}
          type="button"
          className={panel.chip}
          aria-pressed="true"
          onClick={() => onChange(toggleTransmission(query, item))}
        >
          {item} ✕
        </button>
      ))}
      <button
        type="button"
        className={panel.chip}
        aria-pressed={query.withThicknessMap}
        onClick={() => onChange({ ...query, withThicknessMap: !query.withThicknessMap })}
      >
        с картой замеров
      </button>
    </div>
  )
}
