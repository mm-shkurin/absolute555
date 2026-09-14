import { Panel, PanelNote } from '../../../shared/ui/Panel'
import styles from '../seller.module.css'

export function SellerAside() {
  return (
    <aside className={styles.side}>
      {/* Отзыв пишется со своей сделки, а не с чужого профиля: право на него
          живёт на оффере, и кнопка здесь обещала бы то, чего сервер не примет. */}
      <Panel first>
        <PanelNote>
          Отзыв оставляют в разделе «Предложения» — по той сделке, которая состоялась. Здесь его
          написать нельзя, и поэтому написанному можно верить.
        </PanelNote>
      </Panel>
    </aside>
  )
}
