import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ROUTES } from '../../shared/navigation/routes'
import { changeStatus } from '../../shared/api/backend/saleCarApi'
import type { MyListingAction } from './logic/myListingRows'

export function useMyListingActions() {
  const navigate = useNavigate()
  const client = useQueryClient()
  // Возврат отклонённого в черновик и снятого в продажу — переходы сервера, а не открытие
  // мастера: из `rejected` отправка запрещена, и правка без этого шага кончилась бы
  // отказом на последнем нажатии.
  const move = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'revise' | 'republish' }) =>
      changeStatus(id, action),
    onSuccess: (_result, { id, action }) => {
      void client.invalidateQueries({ queryKey: ['my-listings'] })
      if (action === 'revise') navigate(ROUTES.sellingDraft(id))
    },
  })
  const { mutate } = move

  const onAction = useCallback(
    (action: MyListingAction['id'], row: { id: string }) => {
      if (action === 'offers') navigate(ROUTES.offers)
      else if (action === 'fix') mutate({ id: row.id, action: 'revise' })
      else if (action === 'republish') mutate({ id: row.id, action: 'republish' })
      // Продолжение открывает ИМЕННО этот черновик, а не новый: мастер без идентификатора
      // завёл бы второе объявление на ту же машину.
      else if (action === 'continue') navigate(ROUTES.sellingDraft(row.id))
      else navigate(ROUTES.listing(row.id))
    },
    [mutate, navigate],
  )

  return { move, onAction }
}
