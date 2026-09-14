import type { Draft } from '../logic/draft'
import { Field, Select, TextArea, TextInput } from '../../../shared/ui/Form'

const CITIES = ['Омск', 'Калачинск', 'Тара']

export interface ContactFieldsProps {
  draft: Draft
  onField: (key: keyof Draft, value: string) => void
}

export function ContactFields({ draft, onField }: ContactFieldsProps) {
  return (
    <>
      <Field label="Город">
        <Select value={draft.city} onChange={(value) => onField('city', value)} options={CITIES} />
      </Field>
      <Field label="Телефон">
        <TextInput
          value={draft.phone}
          onChange={(value) => onField('phone', value)}
          placeholder="+7 913 000-00-00"
          mono
        />
      </Field>
      <Field label="Описание" full>
        <TextArea
          value={draft.description}
          onChange={(value) => onField('description', value)}
          placeholder="Что важно знать покупателю: история обслуживания, что менялось, что требует внимания."
        />
      </Field>
    </>
  )
}
