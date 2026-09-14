// Заявка на роль поставщика. Приглашение и состояние заявки в одном блоке: пока заявки
// нет, человеку нужно объяснение, а как только она подана — только её судьба.
import { Panel } from '../../../shared/ui/Panel'
import type { SupplierStateView } from '../logic/profileView'
import { SupplierApplicationActions } from './SupplierApplicationActions'

interface SupplierApplicationProps {
  state: SupplierStateView
  onApply: () => void
}

export function SupplierApplication({ state, onApply }: SupplierApplicationProps) {
  return (
    <Panel title="Заявка на роль поставщика" testId="supplier-application">
      <p>
        Если вы возите машины из-за рубежа — подайте заявку. Одобренный поставщик получает публичную
        страницу и публикует позиции под привоз сам.
      </p>
      <SupplierApplicationActions state={state} onApply={onApply} />
    </Panel>
  )
}
