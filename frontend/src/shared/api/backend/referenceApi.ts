// Справочник марок и моделей. Выбор марки сужает список моделей.
//
// Читается `sendPublic`, а не `send`: справочник открыт на сервере без авторизации, а
// `send` на отсутствие сессии отвечает «войдите заново» — и у гостя список марок в
// фильтре ленты не грузился вовсе, вместо него стояло «Повторить».
import { sendPublic } from '../sendPublic'
import { BACKEND } from './paths'
import type { BrandWire, CarModelWire } from './referenceContract'

export function fetchBrands(signal?: AbortSignal) {
  return sendPublic<BrandWire[]>(BACKEND.catalog.brands, { signal })
}

export function fetchModels(brandId: string, signal?: AbortSignal) {
  return sendPublic<CarModelWire[]>(BACKEND.catalog.models(brandId), { signal })
}
