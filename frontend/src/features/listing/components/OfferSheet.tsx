// Предложение цены. Одно поле и одна кнопка: торг здесь короткий, а всё остальное про эту
// машину человек уже прочитал выше.
import { Sheet } from '../../../shared/ui/Sheet'
import { OfferForm } from './OfferForm'
import side from './SidePanel.module.css'

interface OfferSheetProps {
  askingPrice: string
  busy: boolean
  failure: string | null
  sent: boolean
  onClose: () => void
  onSend: (price: number) => void
}

export function OfferSheet({ sent, onClose, ...form }: OfferSheetProps) {
  return (
    <Sheet title="Предложить цену" onClose={onClose} testId="offer-sheet">
      {sent ? (
        <p className={side.hint} data-testid="offer-sent">
          Предложение отправлено. Оно живёт трое суток — не ответят, истечёт само. Переписка с
          продавцом открылась в разделе «Чаты».
        </p>
      ) : (
        <OfferForm {...form} />
      )}
    </Sheet>
  )
}
