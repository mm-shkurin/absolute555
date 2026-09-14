// Форма заявки «хочу такую». Обратный аукцион начинается здесь: покупатель описывает
// машину, которой в ленте нет, и поставщики отвечают ценой под ключ.
import { Link } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { NarrowPage } from '../../shared/ui/FormCard'
import { ROUTES } from '../../shared/navigation/routes'
import { NewRequestCard } from './components/NewRequestCard'
import styles from './request.module.css'

export function NewRequestPage({ signedIn = true }: { signedIn?: boolean }) {
  return (
    <>
      <SiteHeader signedIn={signedIn} />
      <main data-testid="new-import-request">
        <Container>
          <NarrowPage>
            <div className={styles.crumbs}>
              <Link to={ROUTES.importFeed}>Под заказ</Link> › Новая заявка
            </div>
            <PageSection>
              <NewRequestCard />
            </PageSection>
          </NarrowPage>
        </Container>
      </main>
    </>
  )
}
