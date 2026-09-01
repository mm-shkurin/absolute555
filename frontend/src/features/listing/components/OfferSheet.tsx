// Предложение цены. Одно поле и одна кнопка: торг здесь короткий, а всё остальное про эту
// машину человек уже прочитал выше.
import { useState } from 'react'
import { Sheet } from '../../../shared/ui/Sheet'
import { Button } from '../../../shared/ui/Button'
import side from './SidePanel.module.css'
import styles from './OfferSheet.module.css'

export function OfferSheet({
  askingPrice,
  busy,
  failure,
  sent,
  onClose,
  onSend,
}: {
  askingPrice: string
  busy: boolean
  failure: string | null
  sent: boolean
  onClose: () => void
  onSend: (price: number) => void
}) {
  const [value, setValue] = useState('')
  const price = Number(value.replace(/\s/g, ''))

  return (
    <Sheet title="Предложить цену" onClose={onClose} testId="offer-sheet">
      {sent ? (
        <p className={side.hint} data-testid="offer-sent">
          Предложение отправлено. Оно живёт трое суток — не ответят, истечёт само. Переписка
          с продавцом открылась в разделе «Чаты».
        </p>
      ) : (
        <>
          <p className={side.hint}>Продавец просит {askingPrice}.</p>
          <input
            className={styles.priceInput}
            inputMode="numeric"
            value={value}
            disabled={busy}
            onChange={(event) => setValue(event.target.value.replace(/[^\d\s]/g, ''))}
            placeholder="Ваша цена, ₽"
            data-testid="offer-input"
          />
          {failure ? <p className={styles.failure}>{failure}</p> : null}
          <Button
            block
            disabled={busy || !Number.isFinite(price) || price <= 0}
            onClick={() => onSend(price)}
            data-testid="offer-send"
          >
            Отправить предложение
          </Button>
        </>
      )}
    </Sheet>
  )
}
