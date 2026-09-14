// Запись и снятие замера. Отдельно от чтения (`useThicknessMap`): читает карту любой,
// кому видно объявление, а пишет только владелец, и права у этих двух разные.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteMeasurement, putMeasurement, readGauge } from '../../shared/api/backend/thicknessApi'
import type { PanelCode } from '../../shared/thicknessMap/logic/bodyPanels'

export interface ThicknessEditor {
  save: (panel: PanelCode, valueUm: number | null, photo: File) => Promise<void>
  remove: (panel: PanelCode) => Promise<void>
  /** Число со снимка — подсказка, пусто, если не разобрали или сервис не ответил. */
  read: (photo: File) => Promise<number | null>
  busy: boolean
  error: string | null
}

interface WriteInput {
  panel: PanelCode
  valueUm: number | null
  photo: File
}

function useMeasurementMutations(saleCarId: string) {
  const client = useQueryClient()
  // Обе мутации отвечают всей картой, но она кладётся не в кэш напрямую, а через
  // перезапрос: счётчики и статус панели считает сервер, и ответ на запись — то же
  // самое чтение, только полученное другим путём.
  const refresh = () => client.invalidateQueries({ queryKey: ['thickness', saleCarId] })
  const write = useMutation({
    mutationFn: ({ panel, valueUm, photo }: WriteInput) =>
      putMeasurement(saleCarId, panel, valueUm, photo),
    onSuccess: refresh,
  })
  const erase = useMutation({
    mutationFn: (panel: PanelCode) => deleteMeasurement(saleCarId, panel),
    onSuccess: refresh,
  })
  return { write, erase }
}

export function useThicknessEditor(saleCarId: string): ThicknessEditor {
  const { write, erase } = useMeasurementMutations(saleCarId)
  const failure = write.error ?? erase.error
  return {
    save: async (panel, valueUm, photo) => {
      await write.mutateAsync({ panel, valueUm, photo })
    },
    remove: async (panel) => {
      await erase.mutateAsync(panel)
    },
    read: (photo) =>
      readGauge(saleCarId, photo).then(
        (answer) => answer.value_um,
        // Нечитаемый снимок не ошибка: продавец впишет число руками.
        () => null,
      ),
    busy: write.isPending || erase.isPending,
    error: failure?.message ?? null,
  }
}
