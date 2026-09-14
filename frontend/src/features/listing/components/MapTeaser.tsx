// Схема кузова в карточке объявления — та же, что на странице карты, только для взгляда:
// панели не выбираются, за подробностями ведёт кнопка «Открыть карту целиком».
import { BodySchematic } from '../../../shared/thicknessMap/ui/BodySchematic'
import { useThicknessMap } from '../../../shared/thicknessMap/useThicknessMap'
import styles from '../listing.module.css'

export function MapTeaser({ listingId }: { listingId: string }) {
  const map = useThicknessMap(listingId)
  if (!map.view) {
    return <div className={styles.mapTeaser} aria-busy={map.isLoading} />
  }
  return (
    <div className={styles.mapTeaserLive} data-testid="map-teaser">
      <BodySchematic rows={map.view.rows} selected={null} onSelect={() => undefined} />
    </div>
  )
}
