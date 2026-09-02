// Запись и снятие замера. Отдельно от чтения (`useThicknessMap`): читает карту любой,
// кому видно объявление, а пишет только владелец, и права у этих двух разные.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteMeasurement, putMeasurement } from './api/thicknessApi'
import type { PanelCode } from './logic/panels'

export interface ThicknessEditor {
  save: (panel: PanelCode, valueUm: number | null, photo: File) => Promise<void>
  remove: (panel: PanelCode) => Promise<void>
  busy: boolean
  error: string | null
}

export function useThicknessEditor(saleCarId: string): ThicknessEditor {
  const client = useQueryClient()
  // Обе мутации отвечают всей картой, но она кладётся не в кэш напрямую, а через
  // перезапрос: счётчики и статус панели считает сервер, и ответ на запись — то же
  // самое чтение, только полученное другим путём.
  const refresh = () => client.invalidateQueries({ queryKey: ['thickness', saleCarId] })

  const write = useMutation({
    mutationFn: ({
      panel,
      valueUm,
      photo,
    }: {
      panel: PanelCode
      valueUm: number | null
      photo: File
    }) =>
      putMeasurement(saleCarId, panel, valueUm, photo),
    onSuccess: refresh,
  })

  const erase = useMutation({
    mutationFn: (panel: PanelCode) => deleteMeasurement(saleCarId, panel),
    onSuccess: refresh,
  })

  const failure = (write.error ?? erase.error) as Error | null
  return {
    save: async (panel, valueUm, photo) => {
      await write.mutateAsync({ panel, valueUm, photo })
    },
    remove: async (panel) => {
      await erase.mutateAsync(panel)
    },
    busy: write.isPending || erase.isPending,
    error: failure?.message ?? null,
  }
}
