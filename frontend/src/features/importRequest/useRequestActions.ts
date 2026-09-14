import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ROUTES } from '../../shared/navigation/routes'
import { closeRequest, putResponse } from './api/requestApi'

interface ResponseBody {
  price: number
  delivery_days: number
  comment?: string
}

export function useRequestActions(requestId: string) {
  const client = useQueryClient()
  const navigate = useNavigate()
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['import-request', requestId] })
    void client.invalidateQueries({ queryKey: ['import-request-responses', requestId] })
  }
  const respond = useMutation({
    mutationFn: (body: ResponseBody) => putResponse(requestId, body),
    // Отклик — начало разговора, а не запись в списке: поставщика уводят в переписку,
    // где его цена и срок уже стоят первой строкой.
    onSuccess: (answered) => {
      refresh()
      void client.invalidateQueries({ queryKey: ['chats'] })
      if (answered.dialog_id) navigate(ROUTES.chat(answered.dialog_id))
    },
  })
  const close = useMutation({ mutationFn: () => closeRequest(requestId), onSuccess: refresh })
  return { respond, close }
}

export type RequestActions = ReturnType<typeof useRequestActions>
