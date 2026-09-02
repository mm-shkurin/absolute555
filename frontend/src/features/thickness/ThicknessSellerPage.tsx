// Заполнение карты продавцом: та же схема кузова, но панель не разбирается, а
// записывается. Отдельный экран, а не режим покупательского: права разные, и общий
// экран пришлось бы спрашивать «а вы владелец?» у каждой кнопки.
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { ROUTES } from '../../shared/navigation/routes'
import { BodySchematic } from './components/BodySchematic'
import { PanelEditor } from './components/PanelEditor'
import { PanelList } from './components/PanelList'
import { ThicknessFailure, ThicknessSkeleton } from './components/ThicknessStates'
import type { PanelCode } from './logic/panels'
import { useThicknessEditor } from './useThicknessEditor'
import { useThicknessMap } from './useThicknessMap'
import styles from './thickness.module.css'

export function ThicknessSellerPage({ signedIn }: { signedIn: boolean }) {
  const { saleCarId = '' } = useParams()
  const map = useThicknessMap(saleCarId)
  const editor = useThicknessEditor(saleCarId)
  const [selected, setSelected] = useState<PanelCode | null>(null)
  const detail = selected ? map.detailOf(selected) : null

  return (
    <>
      <SiteHeader signedIn={signedIn} />
      <main data-testid="thickness-seller">
        <Container>
          <div className={styles.crumbs}>
            <Link to={ROUTES.sellingDraft(saleCarId)}>Объявление</Link> › Заполнение карты
          </div>
          {map.isLoading ? <ThicknessSkeleton /> : null}
          {!map.isLoading && map.error ? (
            <ThicknessFailure message={map.error.message} onRetry={map.retry} />
          ) : null}
          {map.view ? (
            <div className={styles.layout}>
              <BodySchematic rows={map.view.rows} selected={selected} onSelect={setSelected} />
              <aside className={styles.side}>
                <div className={`${styles.block} ${styles.blockFirst}`}>
                  <div className={styles.blockHead}>
                    <h3>Замерено</h3>
                    <span className={styles.coverage} data-testid="thickness-coverage">
                      {map.view.coverageText}
                    </span>
                  </div>
                  <PanelList rows={map.view.rows} selected={selected} onSelect={setSelected} />
                </div>
                {detail ? (
                  <PanelEditor
                    detail={detail}
                    busy={editor.busy}
                    error={editor.error}
                    onSave={(valueUm, photo) => void editor.save(detail.code, valueUm, photo)}
                    onRemove={() => void editor.remove(detail.code)}
                  />
                ) : (
                  <p className={styles.note} data-testid="thickness-hint">
                    Выберите панель на схеме или в списке — и впишите число с экрана прибора.
                  </p>
                )}
              </aside>
            </div>
          ) : null}
        </Container>
      </main>
    </>
  )
}
