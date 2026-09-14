import { Field, Form, TextArea, TextInput } from '../../../shared/ui/Form'
import type { RespondDraft } from '../useRespondDraft'

interface RespondFieldsProps {
  draft: RespondDraft
}

export function RespondFields({ draft }: RespondFieldsProps) {
  return (
    <Form>
      <Field label="Цена под ключ, ₽">
        <TextInput
          value={draft.price}
          onChange={draft.setPrice}
          placeholder="6 690 000"
          testId="bid-price"
        />
      </Field>
      <Field label="Срок доставки, дней">
        <TextInput value={draft.days} onChange={draft.setDays} placeholder="60" testId="bid-days" />
      </Field>
      <Field label="Комментарий" full>
        <TextArea
          value={draft.comment}
          onChange={draft.setComment}
          placeholder="Что входит в цену и что покупателю стоит знать до заказа."
          testId="bid-comment"
        />
      </Field>
    </Form>
  )
}
