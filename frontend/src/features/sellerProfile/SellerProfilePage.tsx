// Публичная страница продавца. Покупатель приходит сюда с карточки, чтобы понять, с кем
// имеет дело: отзывы и другие его машины отвечают на этот вопрос лучше рейтинга.
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { Panel, PanelNote } from '../../shared/ui/Panel'
import { PersonHead } from '../../shared/ui/Avatar'
import { Button } from '../../shared/ui/Button'
import { FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ListingGrid } from '../../shared/domain/listing/ListingCard'
import { toListingView } from '../../shared/domain/listing/listingView'
import { ROUTES } from '../../shared/navigation/routes'
import { fetchSeller, fetchSellerListings, fetchSellerReviews } from './api/sellerApi'
import { reviewsTitle, sellerLine, toInvitation, toReviewView } from './logic/sellerView'
import { ReviewList } from './components/ReviewList'
import { ReviewForm } from './components/ReviewForm'
import styles from './seller.module.css'

export function SellerProfilePage({ signedIn = false }: { signedIn?: boolean }) {
  const { userId = '' } = useParams()
  const seller = useQuery({
    queryKey: ['seller', userId],
    queryFn: ({ signal }) => fetchSeller(userId, signal),
  })
  const reviews = useQuery({
    queryKey: ['seller-reviews', userId],
    queryFn: ({ signal }) => fetchSellerReviews(userId, signal),
  })
  const listings = useQuery({
    queryKey: ['seller-listings', userId],
    queryFn: ({ signal }) => fetchSellerListings(userId, signal),
  })

  const items = listings.data?.items ?? []

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
            {!seller.isPending && seller.error ? (
              <FailureNotice
                message={(seller.error as Error).message}
                onRetry={() => void seller.refetch()}
              />
            ) : null}
            {seller.data ? (
              <div className={styles.layout}>
                <div>
                  <Panel first>
                    <PersonHead
                      name={seller.data.name}
                      rating={seller.data.rating}
                      line={sellerLine(seller.data)}
                      action={<Button tone="ghost">Написать</Button>}
                    />
                  </Panel>

                  <Panel title={reviewsTitle(seller.data.reviews_count)} testId="seller-reviews">
                    <ReviewList reviews={(reviews.data?.items ?? []).map(toReviewView)} />
                    <PanelNote>
                      Отзыв можно оставить только по принятому предложению. Поэтому их мало — и
                      поэтому им можно верить.
                    </PanelNote>
                  </Panel>

                  <Panel title={`Активные объявления · ${items.length}`}>
                    {items.length === 0 ? (
                      <p>Сейчас у продавца нет опубликованных объявлений.</p>
                    ) : (
                      <div className={styles.cards}>
                        <ListingGrid listings={items.map(toListingView)} />
                      </div>
                    )}
                  </Panel>
                </div>

                <aside className={styles.side}>
                  {reviews.data ? (
                    <ReviewForm
                      invitation={toInvitation(reviews.data.right)}
                      onSubmit={() => undefined}
                    />
                  ) : null}
                </aside>
              </div>
            ) : null}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
