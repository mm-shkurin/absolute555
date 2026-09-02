// Поля привоза: откуда везут, за сколько дней и почём под ключ.
//
// Отдельным блоком, а не тремя строками внутри шага цены: у машины в наличии их нет
// вовсе, и показывать пустые поля тому, кто продаёт свою машину, значит спрашивать
// про доставку из Японии.
import { Field, TextInput } from '../../../shared/ui/Form'
import type { Draft } from '../logic/draft'

interface Props {
  draft: Draft
  onField: (key: keyof Draft, value: string) => void
}

export function ImportFields({ draft, onField }: Props) {
  if (draft.kind !== 'import') return null
  return (
    <>
      <Field label="Откуда везут">
        <TextInput
          value={draft.importCountry}
          onChange={(value) => onField('importCountry', value)}
          placeholder="Япония"
        />
      </Field>
      <Field label="Срок доставки, дней">
        <TextInput
          value={draft.deliveryDays}
          onChange={(value) => onField('deliveryDays', value)}
          placeholder="60"
        />
      </Field>
      <Field label="Цена под ключ, ₽" full>
        <TextInput
          value={draft.turnkeyPrice}
          onChange={(value) => onField('turnkeyPrice', value)}
          placeholder="6 690 000"
        />
      </Field>
    </>
  )
}
