import { Sheet } from '../../../shared/ui/Sheet'
import type { FeedQuery } from '../logic/feedQuery'
import { BrandSheet } from './BrandSheet'
import { FilterPanel } from './FilterPanel'

interface FeedOverlaysProps {
  query: FeedQuery
  total: number
  brandOpen: boolean
  sheetOpen: boolean
  onChange: (query: FeedQuery) => void
  onReset: () => void
  setBrandOpen: (open: boolean) => void
  setSheetOpen: (open: boolean) => void
}

export function FeedOverlays(props: FeedOverlaysProps) {
  const { query, onChange, setBrandOpen, setSheetOpen } = props
  return (
    <>
      {props.brandOpen ? (
        <BrandSheet
          current={query}
          onClose={() => setBrandOpen(false)}
          onPick={(choice) => {
            onChange({ ...query, ...choice })
            setBrandOpen(false)
          }}
        />
      ) : null}
      {props.sheetOpen ? (
        <Sheet title="Фильтры" onClose={() => setSheetOpen(false)} testId="filter-sheet">
          <FilterPanel
            query={query}
            total={props.total}
            onChange={onChange}
            onReset={props.onReset}
            onPickBrand={() => setBrandOpen(true)}
            inSheet
            onApply={() => setSheetOpen(false)}
          />
        </Sheet>
      ) : null}
    </>
  )
}
