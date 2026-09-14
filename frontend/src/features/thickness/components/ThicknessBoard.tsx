import type { ReactNode } from 'react'
import { BodySchematic } from '../../../shared/thicknessMap/ui/BodySchematic'
import type { PanelCode } from '../../../shared/thicknessMap/logic/bodyPanels'
import type { ThicknessView } from '../../../shared/thicknessMap/logic/thicknessMap'
import { PanelList } from './PanelList'
import styles from '../thickness.module.css'

interface Props {
  view: ThicknessView
  title: string
  coverageTestId?: string
  selected: PanelCode | null
  onSelect: (code: PanelCode) => void
  children: ReactNode
}

export function ThicknessBoard({
  view,
  title,
  coverageTestId,
  selected,
  onSelect,
  children,
}: Props) {
  return (
    <div className={styles.layout}>
      <BodySchematic rows={view.rows} selected={selected} onSelect={onSelect} />
      <aside className={styles.side}>
        <div className={`${styles.block} ${styles.blockFirst}`}>
          <div className={styles.blockHead}>
            <h3>{title}</h3>
            <span className={styles.coverage} data-testid={coverageTestId}>
              {view.coverageText}
            </span>
          </div>
          <PanelList rows={view.rows} selected={selected} onSelect={onSelect} />
        </div>
        {children}
      </aside>
    </div>
  )
}
