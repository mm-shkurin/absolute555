// Поля профиля поставщика. Ровно то, по чему покупатель сравнивает поставщиков между
// собой: откуда возит, что возит, за сколько и на каких условиях.
import { Field, Form, TextInput } from '../../../shared/ui/Form'
import type { ProfileForm } from '../logic/profileForm'
import { ProfileAboutFields, type ProfileAboutFieldsProps } from './ProfileAboutFields'

export function ProfileFields({ form, disabled, onField }: ProfileAboutFieldsProps) {
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
      <ProfileAboutFields form={form} disabled={disabled} onField={onField} />
    </Form>
  )
}
