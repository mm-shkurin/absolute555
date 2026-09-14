// Что можно сделать с открытой карточкой: предложить цену, раскрыть телефон, а владельцу —
// снять с публикации или отметить проданной.
//
// Переписки среди действий нет намеренно: диалог заводит сервер при первом предложении
// цены, отдельной ручки «начать переписку» не существует.
import { useState } from 'react'
import { useBuyerMutations } from './useBuyerMutations'
import { useOwnerMutations, type ListingSettings, type OwnerAction } from './useOwnerMutations'

export type { ListingSettings, OwnerAction }

export interface ListingActions {
  phone: string | null
  offering: boolean
  busy: boolean
  failure: string | null
  offerSent: boolean
  openOffer: () => void
  closeOffer: () => void
  sendOffer: (price: number) => void
  showPhone: () => void
  owner: (action: OwnerAction) => void
  setting: (patch: ListingSettings) => void
}

export function useListingActions(listingId: string): ListingActions {
  const [offering, setOffering] = useState(false)
  const { offer, phone } = useBuyerMutations(listingId)
  const { owner, setting } = useOwnerMutations(listingId)
  const failure = offer.error ?? phone.error ?? owner.error ?? setting.error
  return {
    phone: phone.data?.phone_number ?? null,
    offering,
    busy: offer.isPending || phone.isPending || owner.isPending || setting.isPending,
    failure: failure?.message ?? null,
    offerSent: offer.isSuccess,
    openOffer: () => {
      offer.reset()
      setOffering(true)
    },
    closeOffer: () => setOffering(false),
    sendOffer: (price) => offer.mutate(price),
    showPhone: () => phone.mutate(),
    owner: (action) => owner.mutate(action),
    setting: (patch) => setting.mutate(patch),
  }
}
