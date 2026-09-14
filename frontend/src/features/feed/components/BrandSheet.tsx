// Выбор марки и модели — шаг за шагом. Марки заменяются моделями, сверху строка
// возврата.
//
// До этого оба списка стояли подряд одним стилем: после выбора марки модели просто
// дописывались снизу, и на экране это была одна простыня — за «Volkswagen» сразу шли
// «Amarok», «Arteon», «Beetle». Два столбца отвергнуты: на телефоне они схлопываются в
// ту же простыню, а мастер продажи уже устроен шагами — приём человеку знаком.
import { useState } from 'react'
import { Sheet } from '../../../shared/ui/Sheet'
import { FailureNotice, ListSkeleton } from '../../../shared/ui/ListStates'
import type { BrandChoice, PickedBrand } from '../logic/brandChoice'
import { useBrandCatalog } from '../useBrandCatalog'
import { BrandActions, BrandList, ModelList } from './BrandPicker'

export type { BrandChoice } from '../logic/brandChoice'

interface BrandSheetProps {
  current: BrandChoice
  onClose: () => void
  onPick: (choice: BrandChoice) => void
}

function initialBrand(current: BrandChoice): PickedBrand | null {
  return current.brand && current.brandName ? { id: current.brand, name: current.brandName } : null
}

export function BrandSheet({ current, onClose, onPick }: BrandSheetProps) {
  const [brand, setBrand] = useState<PickedBrand | null>(initialBrand(current))
  const { brands, models } = useBrandCatalog(brand)
  return (
    <Sheet title="Марка и модель" onClose={onClose} testId="brand-sheet">
      {brands.isPending ? <ListSkeleton rows={4} /> : null}
      {brands.error ? (
        <FailureNotice message={brands.error.message} onRetry={() => void brands.refetch()} />
      ) : null}
      {brand === null ? (
        <BrandList options={brands.data ?? []} onSelect={setBrand} />
      ) : (
        <ModelList
          brand={brand}
          options={models.data ?? []}
          isPending={models.isPending}
          onBack={() => setBrand(null)}
          onPick={onPick}
        />
      )}
      <BrandActions brand={brand} onPick={onPick} />
    </Sheet>
  )
}
