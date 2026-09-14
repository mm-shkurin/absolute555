import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { complain } from '../../shared/api/backend/moderationApi'
import type { ComplaintReason } from '../../shared/api/backend/moderationContract'

export function useComplaintSheet(listingId: string) {
  const [isOpen, setOpen] = useState(false)
  // Повторная жалоба и жалоба на своё объявление — ответ сервера, а не поломка экрана:
  // текст отказа показывается в шторке, и она остаётся открытой.
  const complaint = useMutation({
    mutationFn: ({ reason, text }: { reason: ComplaintReason; text: string }) =>
      complain(listingId, reason, text),
  })
  return {
    isOpen,
    open: () => {
      complaint.reset()
      setOpen(true)
    },
    close: () => setOpen(false),
    busy: complaint.isPending,
    failure: complaint.error?.message ?? null,
    sent: complaint.isSuccess,
    send: (reason: ComplaintReason, text: string) => complaint.mutate({ reason, text }),
  }
}

export type ComplaintSheetState = ReturnType<typeof useComplaintSheet>
