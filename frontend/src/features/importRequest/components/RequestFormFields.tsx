import { Field, Form, TextArea, TextInput } from '../../../shared/ui/Form'
import { recentYearHint } from '../../../shared/format/yearHints'
import type { NewRequestState } from '../useNewRequest'
import { CatalogPickers } from './CatalogPickers'

interface RequestFormFieldsProps {
  form: NewRequestState
}

export function RequestFormFields({ form }: RequestFormFieldsProps) {
  const { draft, set } = form
  return (
    <Form>
      <CatalogPickers draft={draft} onPickBrand={form.pickBrand} onPickModel={form.pickModel} />
      <Field label="Год — от">
        <TextInput
          value={draft.yearFrom}
          onChange={(value) => set('yearFrom', value)}
          placeholder={recentYearHint()}
        />
      </Field>
      <Field label="Бюджет под ключ, ₽">
        <TextInput
          value={draft.budget}
          onChange={(value) => set('budget', value)}
          placeholder="12 000 000"
          testId="request-budget"
        />
      </Field>
      <Field label="Что важно" full>
        <TextArea
          value={draft.comment}
          onChange={(value) => set('comment', value)}
          placeholder="Комплектация, цвет, что не подходит совсем."
        />
      </Field>
    </Form>
  )
}
