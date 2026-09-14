// Страница поставщика. Отвечает на три вопроса подряд: что он возит, на каких условиях и
// что о нём говорят те, кому он уже привозил.
import { Link, useParams } from 'react-router-dom'
import { QueryPage } from '../../shared/ui/QueryPage'
import { ROUTES } from '../../shared/navigation/routes'
import { toSupplierView } from './logic/supplierView'
import { SupplierContent } from './components/SupplierContent'
import { useSupplierQueries } from './useSupplierQueries'
import styles from './supplier.module.css'

export function SupplierPage({ signedIn = false }: { signedIn?: boolean }) {
  const { supplierId = '' } = useParams()
  const { supplier, reviews } = useSupplierQueries(supplierId)
  const view = supplier.data ? toSupplierView(supplier.data) : null
  const name = view?.name ?? 'Поставщик'
  return (
    <QueryPage
      query={supplier}
      testId="supplier"
      signedIn={signedIn}
      crumbsClassName={styles.crumbs}
      crumbs={
        <>
          <Link to={ROUTES.importFeed}>Под заказ</Link> › {name}
        </>
      }
    >
      {view && supplier.data ? (
        <SupplierContent view={view} data={supplier.data} reviews={reviews.data} />
      ) : null}
    </QueryPage>
  )
}
