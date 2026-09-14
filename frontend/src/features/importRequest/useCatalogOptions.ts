import { useQuery } from '@tanstack/react-query'
import { fetchBrands, fetchModels } from '../../shared/api/backend/referenceApi'

interface CatalogPick {
  onPickBrand: (id: string, name: string) => void
  onPickModel: (id: string, name: string) => void
}

export function useCatalogOptions(brandId: string, { onPickBrand, onPickModel }: CatalogPick) {
  const brands = useQuery({
    queryKey: ['catalog-brands'],
    queryFn: ({ signal }) => fetchBrands(signal),
  })
  const models = useQuery({
    queryKey: ['catalog-models', brandId],
    queryFn: ({ signal }) => fetchModels(brandId, signal),
    enabled: brandId !== '',
  })
  const brandList = brands.data ?? []
  const modelList = models.data ?? []

  return {
    brandNames: brandList.map((brand) => brand.name_ru),
    modelNames: modelList.map((model) => model.name),
    pickBrand: (name: string) =>
      onPickBrand(brandList.find((brand) => brand.name_ru === name)?.brand_id ?? '', name),
    pickModel: (name: string) =>
      onPickModel(modelList.find((model) => model.name === name)?.model_id ?? '', name),
  }
}
