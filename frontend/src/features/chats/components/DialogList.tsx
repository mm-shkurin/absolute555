// Список диалогов. На узком экране скрыт: там переписка занимает экран целиком, а список
// живёт отдельным адресом.
import type { DialogView } from '../logic/conversation'
import { DialogRow } from './DialogRow'
import styles from '../chats.module.css'

interface DialogListProps {
  dialogs: DialogView[]
  current: string | null
  onSelect: (id: string) => void
}

export function DialogList({ dialogs, current, onSelect }: DialogListProps) {
  return (
    <div className={styles.dialogs} data-pane="list" data-testid="dialog-list">
      {dialogs.map((dialog) => (
        <DialogRow
          key={dialog.id}
          dialog={dialog}
          current={dialog.id === current}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
