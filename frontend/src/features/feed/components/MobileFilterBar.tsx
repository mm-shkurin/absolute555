// Полоса фильтров для узкого экрана. Показывает только то, что уже выбрано, плюс вход в
// полную панель: на 390 точках ширины список всех фильтров не помещается ни в какой форме.
import { toggleTransmission, type FeedQuery } from '../logic/feedQuery'
import { FilterChip } from './FilterChip'
import styles from '../feed.module.css'

interface MobileFilterBarProps {
  query: FeedQuery
  onChange: (query: FeedQuery) => void
  onOpenSheet?: () => void
}

export function MobileFilterBar({ query, onChange, onOpenSheet }: MobileFilterBarProps) {
  return (
    <div className={styles.mobileFilters} data-testid="mobile-filters">
      <FilterChip onClick={onOpenSheet}>Фильтры</FilterChip>
      {query.brand ? (
        <FilterChip pressed onClick={() => onChange({ ...query, brand: undefined })}>
          {query.brand} ✕
        </FilterChip>
      ) : null}
      {query.transmissions.map((item) => (
        <FilterChip key={item} pressed onClick={() => onChange(toggleTransmission(query, item))}>
          {item} ✕
        </FilterChip>
      ))}
      <FilterChip
        pressed={query.withThicknessMap}
        onClick={() => onChange({ ...query, withThicknessMap: !query.withThicknessMap })}
      >
        с картой замеров
      </FilterChip>
    </div>
  )
}
