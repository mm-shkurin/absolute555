// Панель фильтров. Тонкая обёртка: состояние принадлежит странице, чистые переходы —
// `logic/feedQuery.ts`, здесь только разметка и вызовы.
import { Button } from '../../../shared/ui/Button'
import type { FeedQuery } from '../logic/feedQuery'
import { countLabel } from '../../../shared/ui/listingCard/listingView'
import { BrandGroup, RangeGroups, ThicknessGroup, TransmissionGroup } from './FilterGroups'
import styles from './FilterPanel.module.css'

interface Props {
  query: FeedQuery
  total: number
  onChange: (query: FeedQuery) => void
  onReset: () => void
  onPickBrand: () => void
  // Внутри шторки та же панель, но без липкости и без «спрятана на узком экране»: её туда
  // как раз и открыли. Отдельный компонент означал бы два списка фильтров, расходящихся
  // с первым же новым полем.
  inSheet?: boolean
  onApply?: () => void
}

export function FilterPanel({
  query,
  total,
  onChange,
  onReset,
  onPickBrand,
  inSheet,
  onApply,
}: Props) {
  return (
    <aside
      className={[styles.panel, inSheet ? styles.inSheet : ''].join(' ')}
      data-testid="filter-panel"
    >
      <div className={styles.scroll}>
        <BrandGroup query={query} onPickBrand={onPickBrand} />
        <RangeGroups query={query} onChange={onChange} />
        <TransmissionGroup query={query} onChange={onChange} />
        <ThicknessGroup query={query} onChange={onChange} />
      </div>
      <div className={styles.foot}>
        <Button data-testid="filter-apply" onClick={onApply}>
          Показать {countLabel(total)}
        </Button>
        <button type="button" className={styles.reset} onClick={onReset}>
          Сброс
        </button>
      </div>
    </aside>
  )
}
