import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approveListing, rejectListing } from '../../shared/api/backend/saleCarApi'
import type { RejectionLabel } from '../../shared/api/backend/moderationContract'

export type QueueDecision =
  | { kind: 'publish'; id: string }
  | { kind: 'reject'; id: string; label: RejectionLabel; comment: string }

export function useQueueDecision(onDecided: () => void) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (decision: QueueDecision) =>
      decision.kind === 'publish'
        ? approveListing(decision.id)
        : rejectListing(decision.id, decision.label, decision.comment),
    onSuccess: () => {
      // Разобранная карточка уходит из очереди, и выбор вместе с ней: оставленный выбор
      // указывал бы на строку, которой в списке уже нет.
      onDecided()
      void client.invalidateQueries({ queryKey: ['moderation-queue'] })
      void client.invalidateQueries({ queryKey: ['complaints'] })
    },
  })
}
