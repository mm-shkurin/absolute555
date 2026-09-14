import { Button } from '../../../shared/ui/Button'
import styles from '../identity.module.css'

interface IdentityButtonsProps {
  hasPhoto: boolean
  busy: boolean | undefined
  onEdit: () => void
  onPick: () => void
  onDrop: () => void
}

export function IdentityButtons({ hasPhoto, busy, onEdit, onPick, onDrop }: IdentityButtonsProps) {
  return (
    <div className={styles.identityActions}>
      <Button tone="ghost" onClick={onEdit} data-testid="profile-name-edit">
        Изменить имя
      </Button>
      <Button tone="ghost" onClick={onPick} disabled={busy} data-testid="profile-photo-pick">
        {hasPhoto ? 'Заменить фото' : 'Добавить фото'}
      </Button>
      {hasPhoto ? (
        <Button tone="ghost" onClick={onDrop} data-testid="profile-photo-drop">
          Убрать фото
        </Button>
      ) : null}
    </div>
  )
}
