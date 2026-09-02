// Поля профиля поставщика. Ровно то, по чему покупатель сравнивает поставщиков между
// собой: откуда возит, что возит, за сколько и на каких условиях.
import { Field, Form, TextArea, TextInput } from '../../../shared/ui/Form'
import type { ProfileForm } from '../logic/profileForm'

interface Props {
  form: ProfileForm
  disabled: boolean
  onField: (key: keyof ProfileForm, value: string) => void
}

export function ProfileFields({ form, disabled, onField }: Props) {
  const text = (key: keyof ProfileForm, placeholder: string) => (
    <TextInput
      value={form[key]}
      onChange={(value) => onField(key, value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  )

  return (
    <Form>
      <Field label="Название" full>
        {text('companyName', 'Восток-Авто')}
      </Field>
      <Field label="Страны, через запятую">{text('countries', 'Япония, Корея')}</Field>
      <Field label="Марки, через запятую">{text('brands', 'Toyota, Honda')}</Field>
      <Field label="Срок доставки от, дней">{text('daysMin', '45')}</Field>
      <Field label="Срок доставки до, дней">{text('daysMax', '70')}</Field>
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
    </Form>
  )
}
