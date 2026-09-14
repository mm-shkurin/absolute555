import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchThicknessMap } from '../api/backend/thicknessApi'
import type { PanelCode } from './logic/bodyPanels'
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
  const detailOf = useCallback(
    (code: PanelCode) => (wire ? toPanelDetail(wire, code) : null),
    [wire],
  )
  return {
    view: wire ? toThicknessView(wire) : null,
    detailOf,
    isLoading: result.isPending,
    error: result.error,
    retry: () => void result.refetch(),
  }
}
