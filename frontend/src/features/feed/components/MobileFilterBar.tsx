// Полоса фильтров для узкого экрана. Показывает только то, что уже выбрано, плюс вход в
// полную панель: на 390 точках ширины список всех фильтров не помещается ни в какой форме.
import { memo, useCallback } from 'react'
import { toggleTransmission, type FeedQuery } from '../logic/feedQuery'
import { FilterChip } from './FilterChip'
import styles from '../feed.module.css'

interface MobileFilterBarProps {
  query: FeedQuery
  onChange: (query: FeedQuery) => void
  onOpenSheet?: () => void
}

export function MobileFilterBar({ query, onChange, onOpenSheet }: MobileFilterBarProps) {
  const removeTransmission = useCallback(
    (item: string) => onChange(toggleTransmission(query, item)),
    [query, onChange],
  )
  return (
    <div className={styles.mobileFilters} data-testid="mobile-filters">
      <FilterChip onClick={onOpenSheet}>Фильтры</FilterChip>
      {query.brand ? (
        <FilterChip pressed onClick={() => onChange({ ...query, brand: undefined })}>
          {query.brand} ✕
        </FilterChip>
      ) : null}
      {query.transmissions.map((item) => (
        <TransmissionChip key={item} item={item} onRemove={removeTransmission} />
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

interface TransmissionChipProps {
  item: string
  onRemove: (item: string) => void
}

const TransmissionChip = memo(function TransmissionChip({ item, onRemove }: TransmissionChipProps) {
  const remove = useCallback(() => onRemove(item), [onRemove, item])
  return (
    <FilterChip pressed onClick={remove}>
      {item} ✕
    </FilterChip>
  )
})
