// Выбор марки и модели. Модели грузятся только после выбора марки: их список зависит от
// неё, и запрашивать все сразу — семьдесят один запрос ради одного нажатия.
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sheet } from '../../../shared/ui/Sheet'
import { Button } from '../../../shared/ui/Button'
import { FailureNotice, ListSkeleton } from '../../../shared/ui/ListStates'
import { fetchBrands, fetchModels } from '../../../shared/api/backend/referenceApi'
import styles from '../feed.module.css'

export interface BrandChoice {
  brand?: string
  brandName?: string
  model?: string
  modelName?: string
}

export function BrandSheet({
  current,
  onClose,
  onPick,
}: {
  current: BrandChoice
  onClose: () => void
  onPick: (choice: BrandChoice) => void
}) {
  const [brand, setBrand] = useState<{ id: string; name: string } | null>(
    current.brand && current.brandName ? { id: current.brand, name: current.brandName } : null,
  )

  const brands = useQuery({
    queryKey: ['catalog-brands'],
    queryFn: ({ signal }) => fetchBrands(signal),
  })
  const models = useQuery({
    queryKey: ['catalog-models', brand?.id],
    queryFn: ({ signal }) => fetchModels(brand?.id ?? '', signal),
    enabled: brand !== null,
  })

  return (
    <Sheet title="Марка и модель" onClose={onClose} testId="brand-sheet">
      {brands.isPending ? <ListSkeleton rows={4} /> : null}
      {brands.error ? (
        <FailureNotice
          message={(brands.error as Error).message}
          onRetry={() => void brands.refetch()}
        />
      ) : null}

      <div className={styles.brandList}>
        {(brands.data ?? []).map((option) => (
          <button
            key={option.brand_id}
            type="button"
            className={styles.brandOption}
            aria-pressed={brand?.id === option.brand_id}
            onClick={() => setBrand({ id: option.brand_id, name: option.name_ru })}
          >
            {option.name_ru}
          </button>
        ))}
      </div>

      {brand ? (
        <div className={styles.brandList} data-testid="model-list">
          {models.isPending ? <ListSkeleton rows={2} /> : null}
          {(models.data ?? []).map((option) => (
            <button
              key={option.model_id}
              type="button"
              className={styles.brandOption}
              onClick={() =>
                onPick({
                  brand: brand.id,
                  brandName: brand.name,
                  model: option.model_id,
                  modelName: option.name,
                })
              }
            >
              {option.name}
            </button>
          ))}
        </div>
      ) : null}

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
    </Sheet>
  )
}
