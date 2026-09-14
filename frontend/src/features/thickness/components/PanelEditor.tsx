// Форма замера одной панели: снимок экрана прибора и число с него.
//
// Фотография обязательна и здесь, и в контракте: замер без неё — те же слова
// «не бит не крашен», только цифрами.
import type { PanelDetail } from '../../../shared/thicknessMap/logic/thicknessMap'
import { usePanelForm } from '../usePanelForm'
import { PanelEditorActions, ReadingNote, RefusedNote } from './PanelEditorParts'
import styles from '../thickness.module.css'

interface Props {
  detail: PanelDetail
  busy: boolean
  error: string | null
  onSave: (valueUm: number | null, photo: File) => void
  onRemove: () => void
  /** Прочитать снимок — число встаёт в поле для сверки, а не сохраняется молча. */
  onRead?: (photo: File) => Promise<number | null>
}

export function PanelEditor({ detail, busy, error, onSave, onRemove, onRead }: Props) {
  const form = usePanelForm(detail, onSave, onRead)
  return (
    <div className={styles.block} data-testid="panel-editor">
      <h3 className={styles.panelTitle}>{detail.label}</h3>
      <p className={styles.note}>
        {detail.measured ? `Замерено: ${detail.value}` : 'Панель ещё не замерена.'}
      </p>
      <input
        ref={form.file}
        type="file"
        accept="image/*"
        className={styles.file}
        data-testid="panel-photo"
        onChange={(event) => form.choosePhoto(event.target.files?.[0] ?? null)}
      />
      <input
        type="text"
        inputMode="numeric"
        className={styles.field}
        placeholder="число с экрана прибора"
        data-testid="panel-value"
        value={form.value}
        onChange={(event) => form.setValue(event.target.value)}
      />
      <ReadingNote reading={form.reading} />
      <RefusedNote message={form.refused ?? error} />
      <PanelEditorActions
        busy={busy}
        measured={detail.measured}
        onSave={form.submit}
        onRemove={onRemove}
      />
    </div>
  )
}
