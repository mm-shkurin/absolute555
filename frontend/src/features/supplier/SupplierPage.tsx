// Страница поставщика. Отвечает на три вопроса подряд: что он возит, на каких условиях и
// что о нём говорят те, кому он уже привозил.
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { Panel } from '../../shared/ui/Panel'
import { Avatar, Rating } from '../../shared/ui/Avatar'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ListingGrid } from '../../shared/domain/listing/ListingCard'
import { toListingView } from '../../shared/domain/listing/listingView'
import { stars } from '../../shared/format/rating'
import { ROUTES } from '../../shared/navigation/routes'
import { fetchSupplier, fetchSupplierReviews } from './api/supplierApi'
import { toSupplierView } from './logic/supplierView'
import { SupplierSide } from './components/SupplierSide'
import styles from './supplier.module.css'

export function SupplierPage({ signedIn = false }: { signedIn?: boolean }) {
  const { supplierId = '' } = useParams()
  const supplier = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: ({ signal }) => fetchSupplier(supplierId, signal),
  })
  const reviews = useQuery({
    queryKey: ['supplier-reviews', supplierId],
    queryFn: ({ signal }) => fetchSupplierReviews(supplierId, signal),
  })

  const view = supplier.data ? toSupplierView(supplier.data) : null

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
            {!supplier.isPending && supplier.error ? (
              <FailureNotice
                message={(supplier.error as Error).message}
                onRetry={() => void supplier.refetch()}
              />
            ) : null}
            {view && supplier.data ? (
              <div className={styles.layout}>
                <div>
                  <Panel first>
                    <div className={styles.head}>
                      <Avatar size={64} />
                      <div className={styles.headBody}>
                        <div className={styles.name}>{view.name}</div>
                        <Rating rating={view.rating}>{view.line}</Rating>
                      </div>
                      {/* Страница отдаётся только у опубликованного профиля: сервер
                          отвечает на неопубликованный тем же 404, что и на чужой. */}
                      <StatusBadge tone="ok">профиль проверен площадкой</StatusBadge>
                    </div>
                    <div className={styles.terms}>
                      {view.terms.map((term) => (
                        <div key={term.label}>
                          <span>{term.label}</span>
                          <b>{term.value}</b>
                        </div>
                      ))}
                    </div>
                    {view.about ? <p className={styles.about}>{view.about}</p> : null}
                  </Panel>

                  <Panel title={view.listingsTitle} testId="supplier-listings">
                    {supplier.data.listings.length === 0 ? (
                      <p>Сейчас у поставщика нет опубликованных позиций.</p>
                    ) : (
                      <div className={styles.cards}>
                        <ListingGrid listings={supplier.data.listings.map(toListingView)} />
                      </div>
                    )}
                  </Panel>

                  <Panel title={view.reviewsTitle} testId="supplier-reviews">
                    {(reviews.data?.items ?? []).length === 0 ? (
                      <p>Отзывов пока нет — поставщик ещё не закрыл ни одной поставки.</p>
                    ) : (
                      (reviews.data?.items ?? []).map((review) => (
                        <div key={review.review_id} className={styles.review}>
                          <Avatar size={40} />
                          <div>
                            <div className={styles.reviewName}>
                              {review.author?.name ?? 'Покупатель'}{' '}
                              <span className={styles.reviewStars}>{stars(review.rating)}</span>
                            </div>
                            <p className={styles.reviewBody}>{review.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </Panel>
                </div>
                <SupplierSide supplier={view} />
              </div>
            ) : null}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
