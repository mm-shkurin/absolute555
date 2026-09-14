// Заполнение карты продавцом: та же схема кузова, но панель не разбирается, а
// записывается. Отдельный экран, а не режим покупательского: права разные, и общий
// экран пришлось бы спрашивать «а вы владелец?» у каждой кнопки.
import { Link, useParams } from 'react-router-dom'
import { ROUTES } from '../../shared/navigation/routes'
import { useThicknessMap } from '../../shared/thicknessMap/useThicknessMap'
import { SellerPanelSlot } from './components/SellerPanelSlot'
import { ThicknessFrame } from './components/ThicknessFrame'
import { useThicknessEditor } from './useThicknessEditor'

export function ThicknessSellerPage({ signedIn }: { signedIn: boolean }) {
  const { saleCarId = '' } = useParams()
  const map = useThicknessMap(saleCarId)
  const editor = useThicknessEditor(saleCarId)
  const crumbs = (
    <>
      <Link to={ROUTES.sellingDraft(saleCarId)}>Мастер</Link> ·{' '}
      <Link to={ROUTES.listing(saleCarId)}>Объявление</Link> › Заполнение карты
    </>
  )
  return (
    <ThicknessFrame
      signedIn={signedIn}
      testId="thickness-seller"
      crumbs={crumbs}
      title="Замерено"
      coverageTestId="thickness-coverage"
      map={map}
    >
      {(detail) => <SellerPanelSlot detail={detail} editor={editor} />}
    </ThicknessFrame>
  )
}
