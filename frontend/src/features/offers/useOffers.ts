import { useQuery } from '@tanstack/react-query'
import { fetchOffers, type OfferDirection } from './api/offersApi'
import { toOfferRow, type OfferRowView } from './logic/offerRows'
import { useOfferDecision, type OfferDecision } from './useOfferDecision'

export type { OfferDecision } from './useOfferDecision'

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
  const result = useQuery({
    queryKey: ['offers', direction],
    queryFn: ({ signal }) => fetchOffers(direction, signal),
  })
  const { answer, decide } = useOfferDecision()

  return {
    rows: (result.data?.items ?? []).map((item) => toOfferRow(item, direction, now)),
    incomingTotal: result.data?.incoming_total ?? 0,
    outgoingTotal: result.data?.outgoing_total ?? 0,
    isLoading: result.isPending,
    error: result.error ?? answer.error,
    retry: () => {
      answer.reset()
      void result.refetch()
    },
    decide,
    deciding: answer.isPending,
  }
}
