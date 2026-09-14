import { Button } from '../../../shared/ui/Button'
import type { ReadingState } from '../usePanelReading'
import styles from '../thickness.module.css'

const READING_TEXT: Record<Exclude<ReadingState, 'idle'>, string> = {
  busy: 'Читаем число со снимка…',
  read: 'Число прочитано со снимка — сверьте его с экраном прибора перед сохранением.',
  unread: 'Не разобрали число на снимке — впишите его сами.',
}

export function ReadingNote({ reading }: { reading: ReadingState }) {
  if (reading === 'idle') return null
  return (
    <p className={styles.note} data-testid="panel-reading">
      {READING_TEXT[reading]}
    </p>
  )
}

export function RefusedNote({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className={styles.refused} role="alert" data-testid="panel-refused">
      {message}
    </p>
  )
}

interface ActionsProps {
  busy: boolean
  measured: boolean
  onSave: () => void
  onRemove: () => void
}

export function PanelEditorActions({ busy, measured, onSave, onRemove }: ActionsProps) {
  return (
    <div className={styles.editorActions}>
      {/* Чтение снимка кнопку не запирает: оно идёт секундами, и запертая кнопка
          означает нажатие, на которое ничего не происходит, — продавец решает, что
          сломалось приложение. Своё число он уже вписал, подсказка ему не нужна;
          пришедшая позже, она в поле не встаёт. */}
      <Button onClick={onSave} disabled={busy} data-testid="panel-save">
        Сохранить замер
      </Button>
      {measured ? (
        <Button tone="ghost" onClick={onRemove} disabled={busy} data-testid="panel-remove">
          Убрать замер
        </Button>
      ) : null}
    </div>
  )
}
