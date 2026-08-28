// Кнопки под ценой. Гостю их показывают включёнными: нажатие ведёт на вход и возвращает
// обратно — спрятать действие значит спрятать и причину заводить аккаунт.
import { Button } from '../../../shared/ui/Button'
import type { ListingDetailView, ViewerMode } from '../logic/listingDetail'
import type { SideHandlers } from './SidePanel'
import styles from './SidePanel.module.css'

export function PriceActions({
  view,
  mode,
  handlers,
}: {
  view: ListingDetailView
  mode: ViewerMode
  handlers: SideHandlers
}) {
  if (mode === 'sold') {
    return (
      <>
        <div className={styles.sold} data-testid="sold-mark">
          ● Продано{view.soldOn ? ` ${view.soldOn}` : ''}
        </div>
        <p className={styles.hint}>
          Объявление осталось в архиве — характеристики и карту замеров видно, действия выключены.
        </p>
      </>
    )
  }

  const guest = mode === 'guest'
  return (
    <>
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
            disabled={!view.phoneAvailable}
            onClick={guest ? handlers.onSignIn : handlers.onShowPhone}
          >
            Показать телефон
          </Button>
        </div>
      </div>
      {guest ? (
        <div className={styles.locked}>
          Чтобы предложить цену или написать — войдите через <b>Яндекс&nbsp;ID</b> или{' '}
          <b>VK&nbsp;ID</b>. Вернётесь на эту же карточку.
          <Button size="small" block onClick={handlers.onSignIn} data-testid="side-sign-in">
            Войти
          </Button>
        </div>
      ) : (
        <p className={styles.hint}>
          {view.phoneAvailable
            ? 'Телефон откроется только если продавец разрешил его показ.'
            : 'Продавец скрыл телефон — связь только через чат.'}
        </p>
      )}
    </>
  )
}
