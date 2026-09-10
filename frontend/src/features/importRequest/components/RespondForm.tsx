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

// Цену пишут так, как её читают, — с пробелами между разрядами, как в подсказке поля.
// `Number` на «6 690 000» даёт NaN, и кнопка молча не нажималась.
function amount(raw: string): number {
  return Number(raw.replace(/[\s\u00a0]/g, '').replace(',', '.'))
}

export function RespondForm({ existing, busy, error, onSend }: Props) {
  const [price, setPrice] = useState(existing ? String(existing.price) : '')
  const [days, setDays] = useState(existing ? String(existing.delivery_days) : '')
  const [comment, setComment] = useState(existing?.comment ?? '')
  const numbers = amount(price) > 0 && amount(days) > 0

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
        onClick={() => onSend(amount(price), Math.round(amount(days)), comment.trim())}
        data-testid="bid-send"
      >
        {existing ? 'Изменить отклик' : 'Откликнуться'}
      </Button>
    </div>
  )
}
