// Подать заявку на роль и узнать, чем кончились прежние.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMyRoleRequests, requestRole } from '../../shared/api/backend/accountApi'
import type { RoleRequestWire } from '../../shared/api/backend/accountContract'
import type { RoleRequestDraft } from './logic/roleRequestDraft'

export interface RoleRequestResult {
  mine: RoleRequestWire[]
  sending: boolean
  sent: boolean
  failure: string | null
  send: (draft: RoleRequestDraft) => void
}

export function useRoleRequest(): RoleRequestResult {
  const client = useQueryClient()
  const mine = useQuery({
    queryKey: ['my-role-requests'],
    queryFn: ({ signal }) => fetchMyRoleRequests(signal),
  })

  const send = useMutation({
    mutationFn: (draft: RoleRequestDraft) =>
      requestRole({
        requested_role: 'importer',
        reason: draft.reason.trim(),
        additional_info: draft.about.trim() || undefined,
      }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['my-role-requests'] }),
  })

  return {
    mine: mine.data ?? [],
    sending: send.isPending,
    sent: send.isSuccess,
    // Живая заявка и уже выданная роль — ответ сервера, а не поломка экрана: текст
    // отказа объясняет, почему второй заявки не будет.
    failure: (send.error as Error | null)?.message ?? null,
    send: (draft) => send.mutate(draft),
  }
}
