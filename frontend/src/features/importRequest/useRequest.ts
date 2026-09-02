// Одна заявка. Отдельной ручки под неё в контракте нет: автор читает свои заявки списком,
// поставщик — ленту спроса, и страница ищет заявку там же, где её видит вызывающий.
// Не найдено — значит эта заявка ему не видна: закрытая чужая выглядит так же.
import { useQuery } from '@tanstack/react-query'
import {
  fetchMyRequests,
  fetchOpenRequests,
  fetchResponses,
  type BuyerRequestWire,
} from './api/requestApi'
import { currentRole } from '../../shared/session/authSession'

async function findRequest(requestId: string, signal?: AbortSignal): Promise<BuyerRequestWire> {
  const mine = await fetchMyRequests(signal)
  const own = mine.find((one) => one.request_id === requestId)
  if (own) return own
  // Ленту спроса читает только поставщик: покупателю она сказала бы, с кем он в очереди.
  if (currentRole() === 'importer') {
    const open = await fetchOpenRequests(1, signal)
    const found = open.items.find((one) => one.request_id === requestId)
    if (found) return found
  }
  throw new Error('Заявка не найдена — возможно, её закрыли.')
}

export function useRequest(requestId: string) {
  const request = useQuery({
    queryKey: ['import-request', requestId],
    queryFn: ({ signal }) => findRequest(requestId, signal),
  })
  const responses = useQuery({
    queryKey: ['import-request-responses', requestId],
    queryFn: ({ signal }) => fetchResponses(requestId, signal),
    enabled: Boolean(request.data),
  })
  return { request, responses }
}
