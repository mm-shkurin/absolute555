import { Button } from '../../../shared/ui/Button'
import { ListSkeleton } from '../../../shared/ui/ListStates'
import type { BrandChoice, PickedBrand } from './brandChoice'
import styles from '../feed.module.css'

interface BrandOption {
  brand_id: string
  name_ru: string
}

interface ModelOption {
  model_id: string
  name: string
}

interface BrandListProps {
  options: BrandOption[]
  onSelect: (brand: PickedBrand) => void
}

export function BrandList({ options, onSelect }: BrandListProps) {
  return (
    <div className={styles.brandList}>
      {options.map((option) => (
        <button
          key={option.brand_id}
          type="button"
          className={styles.brandOption}
          onClick={() => onSelect({ id: option.brand_id, name: option.name_ru })}
        >
          {option.name_ru}
        </button>
      ))}
    </div>
  )
}

interface ModelListProps {
  brand: PickedBrand
  options: ModelOption[]
  isPending: boolean
  onBack: () => void
  onPick: (choice: BrandChoice) => void
}

export function ModelList({ brand, options, isPending, onBack, onPick }: ModelListProps) {
  const pick = (option: ModelOption) =>
    onPick({
      brand: brand.id,
      brandName: brand.name,
      model: option.model_id,
      modelName: option.name,
    })
  return (
    <>
      <button type="button" className={styles.brandBack} onClick={onBack} data-testid="brand-back">
        ‹ {brand.name}
      </button>
      <div className={styles.brandList} data-testid="model-list">
        {isPending ? <ListSkeleton rows={2} /> : null}
        {options.map((option) => (
          <button
            key={option.model_id}
            type="button"
            className={styles.brandOption}
            onClick={() => pick(option)}
          >
            {option.name}
          </button>
        ))}
      </div>
    </>
  )
}

interface BrandActionsProps {
  brand: PickedBrand | null
  onPick: (choice: BrandChoice) => void
}

export function BrandActions({ brand, onPick }: BrandActionsProps) {
  return (
    <div className={styles.brandActions}>
      <Button
        block
        disabled={brand === null}
        onClick={() => brand && onPick({ brand: brand.id, brandName: brand.name })}
      >
        {brand ? `Все модели ${brand.name}` : 'Выберите марку'}
      </Button>
      <Button tone="ghost" block onClick={() => onPick({})}>
        Сбросить марку
      </Button>
    </div>
  )
}
