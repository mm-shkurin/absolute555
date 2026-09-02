import { useQuery } from '@tanstack/react-query'
import { fetchThicknessMap } from './api/thicknessApi'
import type { PanelCode } from './logic/panels'
import {
  toPanelDetail,
  toThicknessView,
  type PanelDetail,
  type ThicknessView,
} from './logic/thicknessMap'

export interface ThicknessResult {
  view: ThicknessView | null
  detailOf: (code: PanelCode) => PanelDetail | null
  isLoading: boolean
  error: Error | null
  retry: () => void
}

export function useThicknessMap(saleCarId: string): ThicknessResult {
  const result = useQuery({
    queryKey: ['thickness', saleCarId],
    queryFn: ({ signal }) => fetchThicknessMap(saleCarId, signal),
  })

  const wire = result.data ?? null
  return {
    view: wire ? toThicknessView(wire) : null,
    detailOf: (code) => (wire ? toPanelDetail(wire, code) : null),
    isLoading: result.isPending,
    error: (result.error as Error | null) ?? null,
    retry: () => void result.refetch(),
  }
}
