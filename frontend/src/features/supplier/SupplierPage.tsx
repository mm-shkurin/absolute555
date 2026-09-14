// Страница поставщика. Отвечает на три вопроса подряд: что он возит, на каких условиях и
// что о нём говорят те, кому он уже привозил.
import { Link, useParams } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ROUTES } from '../../shared/navigation/routes'
import { toSupplierView } from './logic/supplierView'
import { SupplierContent } from './components/SupplierContent'
import { useSupplierQueries } from './useSupplierQueries'
import styles from './supplier.module.css'

interface SupplierPageProps {
  signedIn?: boolean
}

export function SupplierPage({ signedIn = false }: SupplierPageProps) {
  const { supplierId = '' } = useParams()
  const { supplier, reviews } = useSupplierQueries(supplierId)
  const view = supplier.data ? toSupplierView(supplier.data) : null
  const failure = !supplier.isPending && supplier.error ? (supplier.error as Error) : null
  return (
    <>
      <SiteHeader signedIn={signedIn} />
      <main data-testid="supplier">
        <Container>
          <div className={styles.crumbs}>
            <Link to={ROUTES.importFeed}>Под заказ</Link> › {view?.name ?? 'Поставщик'}
          </div>
          <PageSection>
            {supplier.isPending ? <ListSkeleton rows={3} /> : null}
            {failure ? (
              <FailureNotice message={failure.message} onRetry={() => void supplier.refetch()} />
            ) : null}
            {view && supplier.data ? (
              <SupplierContent view={view} data={supplier.data} reviews={reviews.data} />
            ) : null}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
