// Карта замеров глазами покупателя: схема кузова, список панелей, разбор выбранной.
// Заполнение продавцом и распознавание с экрана прибора — часть мастера продажи, не этого
// экрана: там другое состояние и другие права.
import { Link, useParams } from 'react-router-dom'
import { ROUTES } from '../../shared/navigation/routes'
import { useThicknessMap } from '../../shared/thicknessMap/useThicknessMap'
import { PanelDetail } from './components/PanelDetail'
import { ThicknessFrame } from './components/ThicknessFrame'

export function ThicknessPage({
  signedIn,
  onSignIn,
}: {
  signedIn: boolean
  onSignIn?: () => void
}) {
  const { listingId = '' } = useParams()
  const map = useThicknessMap(listingId)
  const crumbs = (
    <>
      <Link to={ROUTES.feed}>Лента</Link> › <Link to={ROUTES.listing(listingId)}>Объявление</Link> ›
      Карта замеров
    </>
  )
  return (
    <ThicknessFrame
      signedIn={signedIn}
      onSignIn={onSignIn}
      testId="thickness"
      crumbs={crumbs}
      title="Замеры"
      map={map}
    >
      {(detail) => (detail ? <PanelDetail detail={detail} /> : null)}
    </ThicknessFrame>
  )
}
