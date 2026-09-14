import { useQuery } from '@tanstack/react-query'
import { fetchMyProfile } from '../../shared/api/backend/supplierApi'
import { currentRole } from '../../shared/session/authSession'

export function useMyStorefront() {
  // Витрина спрашивается только у того, кому роль уже выдана: остальным сервер отвечает
  // отказом, и лишний красный запрос в консоли ничего не объясняет.
  return useQuery({
    queryKey: ['my-storefront'],
    queryFn: ({ signal }) => fetchMyProfile(signal),
    enabled: currentRole() === 'importer',
    retry: false,
  })
}
