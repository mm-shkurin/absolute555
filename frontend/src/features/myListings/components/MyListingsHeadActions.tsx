import { ButtonLink } from '../../../shared/ui/Button'
import { ROUTES } from '../../../shared/navigation/routes'
import { currentRole } from '../../../shared/session/authSession'
import styles from '../myListings.module.css'

export function MyListingsHeadActions() {
  return (
    <div className={styles.headActions}>
      <ButtonLink to={ROUTES.selling}>Разместить автомобиль</ButtonLink>
      {/* Привоз заводит только поставщик: чужой роли сервер отвечает 403 NOT_AN_IMPORTER,
          и предлагать ей эту кнопку значит обещать отказ. */}
      {currentRole() === 'importer' ? (
        <ButtonLink tone="ghost" to={ROUTES.sellingImport} data-testid="sell-import">
          Разместить под привоз
        </ButtonLink>
      ) : null}
    </div>
  )
}
