// Марка и модель из справочника. Свободный текст здесь не годится: контракт принимает
// идентификаторы, и «Тойота» руками сервер не найдёт.
import { useQuery } from '@tanstack/react-query'
import { fetchBrands, fetchModels } from '../../../shared/api/backend/referenceApi'
import { Field, Select } from '../../../shared/ui/Form'
import type { RequestDraft } from '../logic/requestDraft'

interface Props {
  draft: RequestDraft
  onPickBrand: (id: string, name: string) => void
  onPickModel: (id: string, name: string) => void
}

export function CatalogPickers({ draft, onPickBrand, onPickModel }: Props) {
  const brands = useQuery({ queryKey: ['catalog-brands'], queryFn: ({ signal }) => fetchBrands(signal) })
  const models = useQuery({
    queryKey: ['catalog-models', draft.brandId],
    queryFn: ({ signal }) => fetchModels(draft.brandId, signal),
    enabled: draft.brandId !== '',
  })

  const brandNames = (brands.data ?? []).map((brand) => brand.name_ru)
  const modelNames = (models.data ?? []).map((model) => model.name)

  return (
    <>
      <Field label="Марка">
        <Select
          value={draft.brandName}
          options={brandNames}
          onChange={(name) => {
            const found = (brands.data ?? []).find((brand) => brand.name_ru === name)
            onPickBrand(found?.brand_id ?? '', name)
          }}
        />
      </Field>
      <Field label="Модель">
        <Select
          value={draft.modelName}
          options={modelNames}
          // Модель без марки не значит ничего: пока марка не выбрана, список пуст.
          disabled={draft.brandId === ''}
          onChange={(name) => {
            const found = (models.data ?? []).find((model) => model.name === name)
            onPickModel(found?.model_id ?? '', name)
          }}
        />
      </Field>
    </>
  )
}
