// Разбор выбранной панели: снимок экрана прибора, число, вывод.
import { Placeholder } from '../../../shared/ui/Placeholder'
import { gradeCaption, type PanelDetail as Detail } from '../logic/thicknessMap'
import styles from '../thickness.module.css'

export function PanelDetail({ detail }: { detail: Detail }) {
  return (
    <div className={styles.block} data-testid="panel-detail">
      <h3 className={styles.panelTitle}>{detail.label}</h3>
      {detail.photoUrl ? (
        <img className={styles.panelShot} src={detail.photoUrl} alt={`Замер: ${detail.label}`} />
      ) : (
        <Placeholder className={styles.panelShot}>
          {detail.measured ? 'фото прибора не сохранилось' : 'панель не замерена'}
        </Placeholder>
      )}
      <div className={styles.reading}>
        <span className={styles.value} style={{ color: detail.color }}>
          {detail.micrometers ?? '—'}
        </span>
        <span className={styles.unit}>{gradeCaption(detail)}</span>
      </div>
      {detail.manuallyCorrected ? (
        <span className={styles.corrected}>уточнено продавцом</span>
      ) : null}
      <p className={styles.note}>{detail.note}</p>
    </div>
  )
}
