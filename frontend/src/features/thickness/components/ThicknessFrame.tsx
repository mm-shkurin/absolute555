import { useState, type ReactNode } from 'react'
import { PageShell } from '../../../shared/ui/PageShell'
import type { PanelCode } from '../../../shared/thicknessMap/logic/bodyPanels'
import type { PanelDetail } from '../../../shared/thicknessMap/logic/thicknessMap'
import type { ThicknessResult } from '../../../shared/thicknessMap/useThicknessMap'
import { ThicknessBoard } from './ThicknessBoard'
import { ThicknessFailure, ThicknessSkeleton } from './ThicknessStates'
import styles from '../thickness.module.css'

interface Props {
  signedIn: boolean
  onSignIn?: () => void
  testId: string
  crumbs: ReactNode
  title: string
  coverageTestId?: string
  map: ThicknessResult
  children: (detail: PanelDetail | null) => ReactNode
}

export function ThicknessFrame({ map, children, title, coverageTestId, ...shell }: Props) {
  const [selected, setSelected] = useState<PanelCode | null>(null)
  const detail = selected ? map.detailOf(selected) : null
  return (
    <PageShell {...shell} crumbsClassName={styles.crumbs}>
      {map.isLoading ? <ThicknessSkeleton /> : null}
      {!map.isLoading && map.error ? (
        <ThicknessFailure message={map.error.message} onRetry={map.retry} />
      ) : null}
      {map.view ? (
        <ThicknessBoard
          title={title}
          coverageTestId={coverageTestId}
          view={map.view}
          selected={selected}
          onSelect={setSelected}
        >
          {children(detail)}
        </ThicknessBoard>
      ) : null}
    </PageShell>
  )
}
