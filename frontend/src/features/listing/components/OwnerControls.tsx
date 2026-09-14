import { Button } from '../../../shared/ui/Button'
import styles from './OwnerPanel.module.css'

interface OwnerControlsProps {
  busy?: boolean
  onEdit: () => void
  onUnpublish: () => void
  onMarkSold: () => void
}

export function OwnerControls({ busy, onEdit, onUnpublish, onMarkSold }: OwnerControlsProps) {
  return (
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
  )
}
