import { useQuery } from '@tanstack/react-query'
import { fetchSellerReviews } from '../../shared/api/backend/reviewApi'
import { fetchSupplier } from './api/supplierApi'

export function useSupplierQueries(supplierId: string) {
  const supplier = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: ({ signal }) => fetchSupplier(supplierId, signal),
  })
  const reviews = useQuery({
    queryKey: ['supplier-reviews', supplierId],
    queryFn: ({ signal }) => fetchSellerReviews(supplierId, {}, signal),
  })
  return { supplier, reviews }
}
