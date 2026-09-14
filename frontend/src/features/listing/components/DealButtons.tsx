import { Button } from '../../../shared/ui/Button'
import type { SideHandlers } from './SidePanel'
import styles from './SidePanel.module.css'

interface DealButtonsProps {
  guest: boolean
  phoneAvailable: boolean
  handlers: SideHandlers
}

export function DealButtons({ guest, phoneAvailable, handlers }: DealButtonsProps) {
  return (
    <div className={styles.actions}>
      <Button
        block
        onClick={guest ? handlers.onSignIn : handlers.onOffer}
        data-testid="offer-price"
      >
        Предложить цену
      </Button>
      <div className={styles.actionPair}>
        <Button tone="ghost" onClick={guest ? handlers.onSignIn : handlers.onMessage}>
          Написать
        </Button>
        <Button
          tone="ghost"
          disabled={!phoneAvailable}
          onClick={guest ? handlers.onSignIn : handlers.onShowPhone}
        >
          Показать телефон
        </Button>
      </div>
    </div>
  )
}
