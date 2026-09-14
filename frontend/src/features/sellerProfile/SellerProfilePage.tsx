// Публичная страница продавца. Покупатель приходит сюда с карточки, чтобы понять, с кем
// имеет дело: отзывы и другие его машины отвечают на этот вопрос лучше рейтинга.
import { Link, useParams } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ROUTES } from '../../shared/navigation/routes'
import { SellerContent } from './components/SellerContent'
import { useSellerQueries } from './useSellerQueries'
import styles from './seller.module.css'

interface SellerProfilePageProps {
  signedIn?: boolean
}

export function SellerProfilePage({ signedIn = false }: SellerProfilePageProps) {
  const { userId = '' } = useParams()
  const { seller, reviews, listings } = useSellerQueries(userId)
  const failure = !seller.isPending && seller.error ? (seller.error as Error) : null
  return (
    <>
      <SiteHeader signedIn={signedIn} />
      <main data-testid="seller-profile">
        <Container>
          <div className={styles.crumbs}>
            <Link to={ROUTES.feed}>Лента</Link> › {seller.data?.name ?? 'Продавец'}
          </div>
          <PageSection>
            {seller.isPending ? <ListSkeleton rows={3} /> : null}
            {failure ? (
              <FailureNotice message={failure.message} onRetry={() => void seller.refetch()} />
            ) : null}
            {seller.data ? (
              <SellerContent seller={seller.data} reviews={reviews.data} listings={listings.data} />
            ) : null}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
