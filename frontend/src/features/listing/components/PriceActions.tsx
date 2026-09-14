// Кнопки под ценой. Гостю их показывают включёнными: нажатие ведёт на вход и возвращает
// обратно — спрятать действие значит спрятать и причину заводить аккаунт.
import type { ListingDetailView, ViewerMode } from '../logic/listingDetail'
import { DealButtons } from './DealButtons'
import { DealHint } from './DealHint'
import type { SideHandlers } from './SidePanel'
import styles from './SidePanel.module.css'

interface PriceActionsProps {
  view: ListingDetailView
  mode: ViewerMode
  handlers: SideHandlers
}

export function PriceActions({ view, mode, handlers }: PriceActionsProps) {
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
      <DealButtons guest={guest} phoneAvailable={view.phoneAvailable} handlers={handlers} />
      <DealHint guest={guest} phoneAvailable={view.phoneAvailable} onSignIn={handlers.onSignIn} />
    </>
  )
}
