// Справочник марок и моделей. Выбор марки сужает список моделей.
import { send } from '../send'
import { BACKEND } from './paths'
import type { BrandWire, CarModelWire } from './referenceContract'

export function fetchBrands(signal?: AbortSignal) {
  return send<BrandWire[]>(BACKEND.catalog.brands, { signal })
}

export function fetchModels(brandId: string, signal?: AbortSignal) {
  return send<CarModelWire[]>(BACKEND.catalog.models(brandId), { signal })
}
