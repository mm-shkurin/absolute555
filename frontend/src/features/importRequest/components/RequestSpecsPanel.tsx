import { Button } from '../../../shared/ui/Button'
import { Panel } from '../../../shared/ui/Panel'
import type { RequestView } from '../logic/requestView'
import styles from '../request.module.css'

interface RequestSpecsPanelProps {
  view: RequestView
  mine: boolean
  closing: boolean
  onClose: () => void
}

export function RequestSpecsPanel({ view, mine, closing, onClose }: RequestSpecsPanelProps) {
  return (
    <Panel first testId="request-specs">
      <div className={styles.specs}>
        {view.specs.map((row) => (
          <div key={row.label}>
            <span>{row.label}</span>
            <b>{row.value}</b>
          </div>
        ))}
      </div>
      {view.comment ? <p className={styles.comment}>{view.comment}</p> : null}
      <div className={styles.ownerActions}>
        {mine ? (
          <Button
            tone="ghost"
            disabled={!view.active || closing}
            onClick={onClose}
            data-testid="close-request"
          >
            Закрыть заявку
          </Button>
        ) : null}
      </div>
    </Panel>
  )
}
