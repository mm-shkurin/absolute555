import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { withdrawOffer } from '../../shared/api/backend/offerApi'
import { acceptOffer, rejectOffer } from './api/offersApi'

export type OfferDecision = 'accept' | 'reject' | 'withdraw'

interface DecisionInput {
  decision: OfferDecision
  offerId: string
}

function sendDecision({ decision, offerId }: DecisionInput) {
  if (decision === 'accept') return acceptOffer(offerId)
  if (decision === 'reject') return rejectOffer(offerId)
  return withdrawOffer(offerId)
}

export function useOfferDecision() {
  const client = useQueryClient()
  const answer = useMutation({
    mutationFn: sendDecision,
    // Принятое предложение меняет и остальные офферы машины, и саму карточку: правило
    // принадлежит серверу, поэтому экран перечитывает списки, а не пересчитывает их сам.
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['offers'] })
      void client.invalidateQueries({ queryKey: ['my-listings'] })
    },
  })
  const { mutate } = answer
  const decide = useCallback(
    (decision: OfferDecision, offerId: string) => mutate({ decision, offerId }),
    [mutate],
  )
  return { answer, decide }
}
