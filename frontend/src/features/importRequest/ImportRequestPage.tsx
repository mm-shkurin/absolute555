// Заявка на привоз глазами её автора и глазами поставщика. Разница — в блоке действий:
// автор закрывает заявку, поставщик откликается.
import { Link, useParams } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { ROUTES } from '../../shared/navigation/routes'
import { ImportRequestContent } from './components/ImportRequestContent'
import styles from './request.module.css'

export function ImportRequestPage({ signedIn = false }: { signedIn?: boolean }) {
  const { requestId = '' } = useParams()
  return (
    <>
      <SiteHeader signedIn={signedIn} />
      <main data-testid="import-request">
        <Container>
          <div className={styles.crumbs}>
            <Link to={ROUTES.importFeed}>Под заказ</Link> › Заявка
          </div>
          <PageSection>
            <ImportRequestContent requestId={requestId} />
          </PageSection>
        </Container>
      </main>
    </>
  )
}
