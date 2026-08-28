// Панель фильтров. Тонкая обёртка: состояние принадлежит странице, чистые переходы —
// `logic/feedQuery.ts`, здесь только разметка и вызовы.
import { Button } from '../../../shared/ui/Button'
import { toggleTransmission, type FeedQuery } from '../logic/feedQuery'
import { countLabel } from '../logic/listingView'
import { RangePair } from './RangePair'
import styles from './FilterPanel.module.css'

const TRANSMISSIONS = ['АКПП', 'МКПП', 'Вариатор', 'Робот']

interface Props {
  query: FeedQuery
  total: number
  onChange: (query: FeedQuery) => void
  onReset: () => void
  onPickBrand: () => void
}

export function FilterPanel({ query, total, onChange, onReset, onPickBrand }: Props) {
  return (
    <aside className={styles.panel} data-testid="filter-panel">
      <div className={styles.scroll}>
        <div className={styles.group}>
          <h4>Марка и модель</h4>
          <Button tone="ghost" block onClick={onPickBrand} data-testid="filter-brand">
            {query.brand ?? 'Выберите марку'}
          </Button>
        </div>
        <RangePair
          label="Год"
          from={{ value: query.yearFrom, placeholder: 'от 2005' }}
          to={{ value: query.yearTo, placeholder: 'до 2026' }}
          onFrom={(yearFrom) => onChange({ ...query, yearFrom })}
          onTo={(yearTo) => onChange({ ...query, yearTo })}
        />
        <RangePair
          label="Цена, ₽"
          from={{ value: query.priceFrom, placeholder: 'от' }}
          to={{ value: query.priceTo, placeholder: 'до 5 млн' }}
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
        <div className={styles.group}>
          <h4>Коробка</h4>
          <div className={styles.chips}>
            {TRANSMISSIONS.map((item) => (
              <button
                key={item}
                type="button"
                className={styles.chip}
                aria-pressed={query.transmissions.includes(item)}
                onClick={() => onChange(toggleTransmission(query, item))}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.group}>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={query.withThicknessMap}
              onChange={(event) => onChange({ ...query, withThicknessMap: event.target.checked })}
              data-testid="filter-thickness"
            />
            <span className={styles.track} />С картой замеров
          </label>
        </div>
      </div>
      <div className={styles.foot}>
        <Button data-testid="filter-apply">Показать {countLabel(total)}</Button>
        <button type="button" className={styles.reset} onClick={onReset}>
          Сброс
        </button>
      </div>
    </aside>
  )
}
