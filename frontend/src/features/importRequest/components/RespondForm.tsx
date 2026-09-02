// Отклик поставщика: цена под ключ, срок и слово от себя.
//
// Повторный отклик правит свой, а не заводит второй — поэтому кнопка называется
// «Изменить отклик», когда он уже есть.
import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Field, Form, TextArea, TextInput } from '../../../shared/ui/Form'
import type { SupplierResponseWire } from '../api/requestApi'
import styles from '../request.module.css'

interface Props {
  existing: SupplierResponseWire | null
  busy: boolean
  error: string | null
  onSend: (price: number, days: number, comment: string) => void
}

export function RespondForm({ existing, busy, error, onSend }: Props) {
  const [price, setPrice] = useState(existing ? String(existing.price) : '')
  const [days, setDays] = useState(existing ? String(existing.delivery_days) : '')
  const [comment, setComment] = useState(existing?.comment ?? '')
  const numbers = Number(price.trim()) > 0 && Number(days.trim()) > 0

  return (
    <div data-testid="respond-form">
      <Form>
        <Field label="Цена под ключ, ₽">
          <TextInput value={price} onChange={setPrice} placeholder="6 690 000" testId="bid-price" />
        </Field>
        <Field label="Срок доставки, дней">
          <TextInput value={days} onChange={setDays} placeholder="60" testId="bid-days" />
        </Field>
        <Field label="Комментарий" full>
          <TextArea
            value={comment}
            onChange={setComment}
            placeholder="Что входит в цену и что покупателю стоит знать до заказа."
            testId="bid-comment"
          />
        </Field>
      </Form>
      {error ? (
        <p className={styles.refused} role="alert" data-testid="bid-error">
          {error}
        </p>
      ) : null}
      <Button
        disabled={busy || !numbers}
        onClick={() => onSend(Number(price.trim()), Number(days.trim()), comment.trim())}
        data-testid="bid-send"
      >
        {existing ? 'Изменить отклик' : 'Откликнуться'}
      </Button>
    </div>
  )
}
