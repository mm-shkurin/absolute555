import { Button } from '../../../shared/ui/Button'
import { toggleTransmission, type FeedQuery } from '../logic/feedQuery'
import { currentYear, OLDEST_YEAR_HINT } from '../../../shared/format/yearHints'
import { RangePair } from './RangePair'
import { FilterChip } from './FilterChip'
import styles from './FilterPanel.module.css'

const TRANSMISSIONS = ['АКПП', 'МКПП', 'Вариатор', 'Робот']

export interface FilterGroupProps {
  query: FeedQuery
  onChange: (query: FeedQuery) => void
}

interface BrandGroupProps {
  query: FeedQuery
  onPickBrand: () => void
}

export function BrandGroup({ query, onPickBrand }: BrandGroupProps) {
  return (
    <div className={styles.group}>
      <h4>Марка и модель</h4>
      <Button tone="ghost" block onClick={onPickBrand} data-testid="filter-brand">
        {brandLabel(query)}
      </Button>
    </div>
  )
}

export function RangeGroups({ query, onChange }: FilterGroupProps) {
  return (
    <>
      <RangePair
        label="Год"
        from={{ value: query.yearFrom, placeholder: `от ${OLDEST_YEAR_HINT}` }}
        to={{ value: query.yearTo, placeholder: `до ${currentYear()}` }}
        onFrom={(yearFrom) => onChange({ ...query, yearFrom })}
        onTo={(yearTo) => onChange({ ...query, yearTo })}
      />
      <RangePair
        label="Цена, ₽"
        from={{ value: query.priceFrom, placeholder: 'от', testId: 'filter-price-from' }}
        to={{ value: query.priceTo, placeholder: 'до 5 млн', testId: 'filter-price-to' }}
        onFrom={(priceFrom) => onChange({ ...query, priceFrom })}
        onTo={(priceTo) => onChange({ ...query, priceTo })}
      />
      <RangePair
        label="Пробег, км"
        from={{ value: query.mileageFrom, placeholder: 'от' }}
        to={{ value: query.mileageTo, placeholder: 'до 200 000' }}
        onFrom={(mileageFrom) => onChange({ ...query, mileageFrom })}
        onTo={(mileageTo) => onChange({ ...query, mileageTo })}
      />
    </>
  )
}

export function TransmissionGroup({ query, onChange }: FilterGroupProps) {
  return (
    <div className={styles.group}>
      <h4>Коробка</h4>
      <div className={styles.chips}>
        {TRANSMISSIONS.map((item) => (
          <FilterChip
            key={item}
            pressed={query.transmissions.includes(item)}
            onClick={() => onChange(toggleTransmission(query, item))}
          >
            {item}
          </FilterChip>
        ))}
      </div>
    </div>
  )
}

export function ThicknessGroup({ query, onChange }: FilterGroupProps) {
  return (
    <div className={styles.group}>
      <label className={styles.switch} data-testid="filter-thickness-toggle">
        <input
          type="checkbox"
          checked={query.withThicknessMap}
          onChange={(event) => onChange({ ...query, withThicknessMap: event.target.checked })}
          data-testid="filter-thickness"
        />
        <span className={styles.track} />С картой замеров
      </label>
    </div>
  )
}

// Кнопка показывает выбранное имя, а не идентификатор: `b-12` человеку не говорит ничего.
function brandLabel(query: FeedQuery): string {
  if (!query.brandName) return 'Выберите марку'
  return query.modelName ? `${query.brandName} ${query.modelName}` : query.brandName
}
