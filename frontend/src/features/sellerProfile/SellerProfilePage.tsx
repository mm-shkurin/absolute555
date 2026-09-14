// Публичная страница продавца. Покупатель приходит сюда с карточки, чтобы понять, с кем
// имеет дело: отзывы и другие его машины отвечают на этот вопрос лучше рейтинга.
import { Link, useParams } from 'react-router-dom'
import { QueryPage } from '../../shared/ui/QueryPage'
import { ROUTES } from '../../shared/navigation/routes'
import { SellerContent } from './components/SellerContent'
import { useSellerQueries } from './useSellerQueries'
import styles from './seller.module.css'

export function SellerProfilePage({ signedIn = false }: { signedIn?: boolean }) {
  const { userId = '' } = useParams()
  const { seller, reviews, listings } = useSellerQueries(userId)
  const crumbs = (
    <>
      <Link to={ROUTES.feed}>Лента</Link> › {seller.data?.name ?? 'Продавец'}
    </>
  )
  return (
    <QueryPage
      signedIn={signedIn}
      testId="seller-profile"
      crumbs={crumbs}
      crumbsClassName={styles.crumbs}
      query={seller}
    >
      {seller.data ? (
        <SellerContent seller={seller.data} reviews={reviews.data} listings={listings.data} />
      ) : null}
    </QueryPage>
  )
}
