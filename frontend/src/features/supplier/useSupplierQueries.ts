import { useQuery } from '@tanstack/react-query'
import { fetchSupplier, fetchSupplierReviews } from './api/supplierApi'

export function useSupplierQueries(supplierId: string) {
  const supplier = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: ({ signal }) => fetchSupplier(supplierId, signal),
  })
  const reviews = useQuery({
    queryKey: ['supplier-reviews', supplierId],
    queryFn: ({ signal }) => fetchSupplierReviews(supplierId, signal),
  })
  return { supplier, reviews }
}
