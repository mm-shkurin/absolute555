import { Button } from '../../../shared/ui/Button'
import styles from './SidePanel.module.css'

interface DealHintProps {
  guest: boolean
  phoneAvailable: boolean
  onSignIn: () => void
}

export function DealHint({ guest, phoneAvailable, onSignIn }: DealHintProps) {
  if (guest) {
    return (
      <div className={styles.locked}>
        Чтобы предложить цену или написать — войдите через <b>Яндекс&nbsp;ID</b>. Вернётесь на эту
        же карточку.
        <Button size="small" block onClick={onSignIn} data-testid="side-sign-in">
          Войти
        </Button>
      </div>
    )
  }
  return (
    <p className={styles.hint}>
      {phoneAvailable
        ? 'Телефон откроется только если продавец разрешил его показ.'
        : 'Продавец скрыл телефон — связь только через чат.'}
    </p>
  )
}
