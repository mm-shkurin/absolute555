import { useQuery } from '@tanstack/react-query'
import { fetchSeller, fetchSellerListings, fetchSellerReviews } from './api/sellerApi'

export function useSellerQueries(userId: string) {
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
  return { seller, reviews, listings }
}
