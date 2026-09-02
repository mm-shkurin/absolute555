// Список диалогов. На узком экране скрыт: там переписка занимает экран целиком, а список
// живёт отдельным адресом.
import type { DialogView } from '../logic/conversation'
import styles from '../chats.module.css'

export function DialogList({
  dialogs,
  current,
  onSelect,
}: {
  dialogs: DialogView[]
  current: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className={styles.dialogs} data-pane="list" data-testid="dialog-list">
      {dialogs.map((dialog) => (
        <button
          key={dialog.id}
          type="button"
          className={[styles.dialog, dialog.id === current ? styles.current : ''].join(' ')}
          onClick={() => onSelect(dialog.id)}
        >
          <span className={styles.avatar} />
          <span className={styles.dialogBody}>
            <span className={styles.dialogName}>
              {dialog.name}
              <span>{dialog.when}</span>
            </span>
            <span className={styles.dialogListing}>{dialog.listingTitle}</span>
            <span className={styles.preview}>
              {dialog.preview}
              {dialog.unread > 0 ? <span className={styles.unread}>{dialog.unread}</span> : null}
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}
