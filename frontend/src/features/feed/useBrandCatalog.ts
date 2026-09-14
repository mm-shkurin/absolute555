// Модели грузятся только после выбора марки: их список зависит от неё, и запрашивать все
// сразу — семьдесят один запрос ради одного нажатия.
import { useQuery } from '@tanstack/react-query'
import { fetchBrands, fetchModels } from '../../shared/api/backend/referenceApi'
import type { PickedBrand } from './logic/brandChoice'

export function useBrandCatalog(brand: PickedBrand | null) {
  const brands = useQuery({
    queryKey: ['catalog-brands'],
    queryFn: ({ signal }) => fetchBrands(signal),
  })
  const models = useQuery({
    queryKey: ['catalog-models', brand?.id],
    queryFn: ({ signal }) => fetchModels(brand?.id ?? '', signal),
    enabled: brand !== null,
  })
  return { brands, models }
}
