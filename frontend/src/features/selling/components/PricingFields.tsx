import type { Draft } from '../logic/draft'
import { Form, Field, TextInput } from '../../../shared/ui/Form'
import { ContactFields } from './ContactFields'
import { ImportFields } from './ImportFields'

export interface PricingFieldsProps {
  draft: Draft
  onField: (key: keyof Draft, value: string) => void
}

export function PricingFields({ draft, onField }: PricingFieldsProps) {
  return (
    <Form>
      <Field label="Цена, ₽">
        <TextInput
          value={draft.price}
          onChange={(value) => onField('price', value)}
          placeholder="4 020 000"
        />
      </Field>
      {/* У привоза пробега не бывает: машина ещё не приехала. */}
      {draft.kind === 'import' ? null : (
        <Field label="Пробег, км">
          <TextInput
            value={draft.mileage}
            onChange={(value) => onField('mileage', value)}
            placeholder="180 000"
          />
        </Field>
      )}
      <ImportFields draft={draft} onField={onField} />
      <ContactFields draft={draft} onField={onField} />
    </Form>
  )
}
