// Марка и модель из справочника. Свободный текст здесь не годится: контракт принимает
// идентификаторы, и «Тойота» руками сервер не найдёт.
import { Field, Select } from '../../../shared/ui/Form'
import type { RequestDraft } from '../logic/requestDraft'
import { useCatalogOptions } from '../useCatalogOptions'

interface CatalogPickersProps {
  draft: RequestDraft
  onPickBrand: (id: string, name: string) => void
  onPickModel: (id: string, name: string) => void
}

export function CatalogPickers({ draft, onPickBrand, onPickModel }: CatalogPickersProps) {
  const options = useCatalogOptions(draft.brandId, { onPickBrand, onPickModel })
  return (
    <>
      <Field label="Марка">
        <Select value={draft.brandName} options={options.brandNames} onChange={options.pickBrand} />
      </Field>
      <Field label="Модель">
        <Select
          value={draft.modelName}
          options={options.modelNames}
          // Модель без марки не значит ничего: пока марка не выбрана, список пуст.
          disabled={draft.brandId === ''}
          onChange={options.pickModel}
        />
      </Field>
    </>
  )
}
