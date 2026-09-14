import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { dismissComplaint, unpublishListing } from './api/moderationApi'
import type { RejectionLabel } from '../../shared/api/backend/moderationContract'

export function useComplaintActions() {
  const client = useQueryClient()
  // Снятие с публикации требует причину: карточку уже видели люди, и продавец должен
  // узнать не только что её сняли, но и за что.
  const [unpublishing, setUnpublishing] = useState<string | null>(null)
  const refresh = () => {
    setUnpublishing(null)
    void client.invalidateQueries({ queryKey: ['complaints'] })
    void client.invalidateQueries({ queryKey: ['moderation-queue'] })
  }
  const { unpublish, dismissAll } = useComplaintMutations(refresh)
  const { mutate: unpublishMutate, reset: unpublishReset } = unpublish
  const { mutate: dismissMutate, reset: dismissReset } = dismissAll
  return {
    unpublishing,
    busy: unpublish.isPending || dismissAll.isPending,
    failure: unpublish.error ?? dismissAll.error,
    toggle: useCallback((id: string) => setUnpublishing((now) => (now === id ? null : id)), []),
    unpublish: useCallback(
      (id: string, label: RejectionLabel) => unpublishMutate({ id, label }),
      [unpublishMutate],
    ),
    dismiss: useCallback((ids: string[]) => dismissMutate(ids), [dismissMutate]),
    reset: () => {
      unpublishReset()
      dismissReset()
    },
  }
}

function useComplaintMutations(refresh: () => void) {
  const unpublish = useMutation({
    mutationFn: ({ id, label }: { id: string; label: RejectionLabel }) =>
      unpublishListing(id, label),
    onSuccess: refresh,
  })
  // Жалобы копятся на объявление, а решение принимается по их совокупности: отклоняются
  // все открытые жалобы карточки, а не выбранная строка.
  const dismissAll = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => dismissComplaint(id))),
    onSuccess: refresh,
  })
  return { unpublish, dismissAll }
}
