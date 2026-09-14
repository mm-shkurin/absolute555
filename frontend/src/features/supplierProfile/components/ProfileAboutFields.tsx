import { Field, TextArea } from '../../../shared/ui/Form'
import type { ProfileForm } from '../logic/profileForm'

export interface ProfileAboutFieldsProps {
  form: ProfileForm
  disabled: boolean
  onField: (key: keyof ProfileForm, value: string) => void
}

export function ProfileAboutFields({ form, disabled, onField }: ProfileAboutFieldsProps) {
  return (
    <>
      <Field label="Условия" full>
        <TextArea
          value={form.terms}
          onChange={(value) => onField('terms', value)}
          placeholder="Предоплата 30% при заказе, остальное после прибытия."
          disabled={disabled}
        />
      </Field>
      <Field label="О себе" full>
        <TextArea
          value={form.description}
          onChange={(value) => onField('description', value)}
          placeholder="Сколько лет возите, чем отличаетесь, что показываете покупателю."
          disabled={disabled}
        />
      </Field>
    </>
  )
}
