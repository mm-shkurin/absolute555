// Карта замеров глазами покупателя: схема кузова, список панелей, разбор выбранной.
// Заполнение продавцом и распознавание с экрана прибора — часть мастера продажи, не этого
// экрана: там другое состояние и другие права.
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { ROUTES } from '../../shared/navigation/routes'
import { BodySchematic } from './components/BodySchematic'
import { PanelList } from './components/PanelList'
import { PanelDetail } from './components/PanelDetail'
import { ThicknessFailure, ThicknessSkeleton } from './components/ThicknessStates'
import type { PanelCode } from './logic/panels'
import { useThicknessMap } from './useThicknessMap'
import styles from './thickness.module.css'

export function ThicknessPage({
  signedIn,
  onSignIn,
}: {
  signedIn: boolean
  onSignIn?: () => void
}) {
  const { listingId = '' } = useParams()
  const map = useThicknessMap(listingId)
  const [selected, setSelected] = useState<PanelCode | null>(null)
  const detail = selected ? map.detailOf(selected) : null

  return (
    <>
      <SiteHeader signedIn={signedIn} onSignIn={onSignIn} />
      <main data-testid="thickness">
        <Container>
          <div className={styles.crumbs}>
            <Link to={ROUTES.feed}>Лента</Link> ›{' '}
            <Link to={ROUTES.listing(listingId)}>{map.view?.title ?? 'Объявление'}</Link> › Карта
            замеров
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
                    <h3>Замеры</h3>
                    <span className={styles.coverage}>{map.view.coverageText}</span>
                  </div>
                  <PanelList rows={map.view.rows} selected={selected} onSelect={setSelected} />
                </div>
                {detail ? <PanelDetail detail={detail} /> : null}
              </aside>
            </div>
          ) : null}
        </Container>
      </main>
    </>
  )
}
