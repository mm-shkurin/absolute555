import { Panel, PanelNote } from '../../../shared/ui/Panel'
import { PersonHead } from '../../../shared/ui/Avatar'
import type { useSellerQueries } from '../useSellerQueries'
import { reviewsTitle, sellerLine, toReviewView } from '../logic/sellerView'
import { ReviewList } from './ReviewList'
import { SellerAside } from './SellerAside'
import { SellerListings } from './SellerListings'
import styles from '../seller.module.css'

type Queries = ReturnType<typeof useSellerQueries>

interface SellerContentProps {
  seller: NonNullable<Queries['seller']['data']>
  reviews: Queries['reviews']['data']
  listings: Queries['listings']['data']
}

export function SellerContent({ seller, reviews, listings }: SellerContentProps) {
  return (
    <div className={styles.layout}>
      <div>
        <Panel first>
          <PersonHead
            name={seller.name ?? 'Продавец'}
            rating={seller.rating}
            line={sellerLine(seller)}
            avatarUrl={seller.avatar_url}
            action={null}
          />
        </Panel>
        <Panel title={reviewsTitle(seller.reviews_count)} testId="seller-reviews">
          <ReviewList reviews={(reviews?.items ?? []).map(toReviewView)} />
          <PanelNote>
            Отзыв оставляет только тот, кто переписывался с продавцом или купил у него. Поэтому их
            мало — и поэтому им можно верить.
          </PanelNote>
        </Panel>
        <SellerListings listings={listings} />
      </div>
      <SellerAside />
    </div>
  )
}
