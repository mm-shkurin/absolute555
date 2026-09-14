import { memo } from 'react'
import { Avatar } from '../../../shared/ui/Avatar'
import type { DialogView } from '../logic/conversation'
import styles from '../chats.module.css'

interface DialogRowProps {
  dialog: DialogView
  current: boolean
  onSelect: (id: string) => void
}

export const DialogRow = memo(function DialogRow({ dialog, current, onSelect }: DialogRowProps) {
  return (
    <button
      type="button"
      className={[styles.dialog, current ? styles.current : ''].join(' ')}
      onClick={() => onSelect(dialog.id)}
    >
      <Avatar size={44} url={dialog.avatarUrl} />
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
  )
})
