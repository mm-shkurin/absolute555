// Правая колонка своего объявления. Вместо кнопок торга — счётчики и управление: владельцу
// нужно понять, смотрят ли карточку, и что сделать, если нет.
import { Link } from 'react-router-dom'
import { Button, buttonClass } from '../../../shared/ui/Button'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { Switch } from '../../../shared/ui/Form'
import { ROUTES } from '../../../shared/navigation/routes'
import type { ListingDetailView } from '../logic/listingDetail'
import styles from './OwnerPanel.module.css'
import listing from '../listing.module.css'

export function OwnerPanel({
  view,
  sold,
  busy,
  onEdit,
  onUnpublish,
  onMarkSold,
  onSetting,
}: {
  view: ListingDetailView
  sold: boolean
  busy?: boolean
  onEdit: () => void
  onUnpublish: () => void
  onMarkSold: () => void
  onSetting: (key: 'phone' | 'chat', value: boolean) => void
}) {
  const complete = view.measuredPanels === view.totalPanels

  return (
    <aside className={listing.side} data-testid="owner-panel">
      <div className={`${listing.block} ${listing.blockFirst}`}>
        {sold ? (
          <StatusBadge tone="past">{`продано${view.soldOn ? ` ${view.soldOn}` : ''}`}</StatusBadge>
        ) : (
          <StatusBadge tone="ok">
            {`опубликовано${view.publishedOn ? ` ${view.publishedOn}` : ''}`}
          </StatusBadge>
        )}
        <div className={styles.title}>{view.title}</div>
        <div className={styles.price}>{view.price}</div>
        <div className={styles.summary}>{view.summary}</div>

        {view.decidedOn ? (
          <div className={styles.decided} data-testid="listing-decided">
            Проверено модератором {view.decidedOn}
            {view.decidedBy ? ` · ${view.decidedBy}` : ''}
          </div>
        ) : null}

        <div className={styles.stats}>
          {view.stats.map((stat) => (
            <div key={stat.label}>
              <b>{stat.value}</b>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        {sold ? null : (
          <>
            <div className={styles.actions}>
              <Button block disabled={busy} onClick={onEdit}>
                Редактировать
              </Button>
              <div className={styles.pair}>
                <Button tone="ghost" disabled={busy} onClick={onUnpublish}>
                  Снять с публикации
                </Button>
                <Button tone="ghost" disabled={busy} onClick={onMarkSold}>
                  Отметить проданным
                </Button>
              </div>
            </div>
            <p className={styles.hint}>
              Отметите проданным — активные предложения по объявлению отклонятся автоматически.
            </p>
          </>
        )}
      </div>

      <div className={listing.block}>
        <h3>Карта замеров</h3>
        <div className={styles.progressRow}>
          <span>Заполнено</span>
          <b>
            {view.measuredPanels} из {view.totalPanels}
          </b>
        </div>
        <div className={styles.progress}>
          <i style={{ width: `${view.thicknessPercent}%` }} />
        </div>
        <p className={styles.note}>
          {complete
            ? 'Карта полная — объявление получает бейдж и поднимается в выдаче.'
            : `Не замерено панелей: ${view.totalPanels - view.measuredPanels} — бейджа «полная карта» нет, объявление не поднимается в выдаче.`}
        </p>
        <Link
          to={ROUTES.thicknessMap(view.id)}
          className={buttonClass({ tone: 'ghost', block: true, className: styles.mapLink })}
        >
          {complete ? 'Посмотреть карту' : 'Домерить'}
        </Link>
      </div>

      <div className={listing.block}>
        <h3>Настройки объявления</h3>
        <Switch checked={view.phoneAvailable} onChange={(value) => onSetting('phone', value)}>
          Показывать телефон
        </Switch>
        <Switch checked={view.chatAllowed} onChange={(value) => onSetting('chat', value)}>
          Разрешить чат
        </Switch>
      </div>
    </aside>
  )
}
