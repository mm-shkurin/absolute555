import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acceptOffer,
  fetchOffers,
  rejectOffer,
  withdrawOffer,
  type OfferDirection,
} from './api/offersApi'
import { toOfferRow, type OfferRowView } from './logic/offerRows'

export type OfferDecision = 'accept' | 'reject' | 'withdraw'

export interface OffersResult {
  rows: OfferRowView[]
  incomingTotal: number
  outgoingTotal: number
  isLoading: boolean
  error: Error | null
  retry: () => void
  decide: (decision: OfferDecision, offerId: string) => void
  deciding: boolean
}

export function useOffers(direction: OfferDirection, now: Date): OffersResult {
  const client = useQueryClient()
  const result = useQuery({
    queryKey: ['offers', direction],
    queryFn: ({ signal }) => fetchOffers(direction, signal),
  })

  const answer = useMutation({
    mutationFn: ({ decision, offerId }: { decision: OfferDecision; offerId: string }) =>
      decision === 'accept'
        ? acceptOffer(offerId)
        : decision === 'reject'
          ? rejectOffer(offerId)
          : withdrawOffer(offerId),
    // Принятое предложение меняет и остальные офферы машины, и саму карточку: правило
    // принадлежит серверу, поэтому экран перечитывает списки, а не пересчитывает их сам.
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['offers'] })
      void client.invalidateQueries({ queryKey: ['my-listings'] })
    },
  })

  return {
    rows: (result.data?.items ?? []).map((item) => toOfferRow(item, direction, now)),
    incomingTotal: result.data?.incoming_total ?? 0,
    outgoingTotal: result.data?.outgoing_total ?? 0,
    isLoading: result.isPending,
    error: ((result.error ?? answer.error) as Error | null) ?? null,
    retry: () => {
      answer.reset()
      void result.refetch()
    },
    decide: (decision, offerId) => answer.mutate({ decision, offerId }),
    deciding: answer.isPending,
  }
}
