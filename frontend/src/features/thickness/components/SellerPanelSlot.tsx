import type { PanelDetail } from '../../../shared/thicknessMap/thicknessMap'
import type { ThicknessEditor } from '../useThicknessEditor'
import { PanelEditor } from './PanelEditor'
import styles from '../thickness.module.css'

export function SellerPanelSlot({
  detail,
  editor,
}: {
  detail: PanelDetail | null
  editor: ThicknessEditor
}) {
  if (!detail) {
    return (
      <p className={styles.note} data-testid="thickness-hint">
        Выберите панель на схеме или в списке — и впишите число с экрана прибора.
      </p>
    )
  }
  return (
    <PanelEditor
      detail={detail}
      busy={editor.busy}
      error={editor.error}
      onSave={(valueUm, photo) => void editor.save(detail.code, valueUm, photo)}
      onRead={editor.read}
      onRemove={() => void editor.remove(detail.code)}
    />
  )
}
