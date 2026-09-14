import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import side from './SidePanel.module.css'
import styles from './OfferSheet.module.css'

interface OfferFormProps {
  askingPrice: string
  busy: boolean
  failure: string | null
  onSend: (price: number) => void
}

export function OfferForm({ askingPrice, busy, failure, onSend }: OfferFormProps) {
  const [value, setValue] = useState('')
  const price = Number(value.replace(/\s/g, ''))
  return (
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
  )
}
