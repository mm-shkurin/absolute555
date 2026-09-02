// Что можно сделать с открытой карточкой: предложить цену, раскрыть телефон, а владельцу —
// снять с публикации или отметить проданной.
//
// Переписки среди действий нет намеренно: диалог заводит сервер при первом предложении
// цены, отдельной ручки «начать переписку» не существует.
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createOffer } from '../../shared/api/backend/offerApi'
import { changeStatus, revealPhone } from '../../shared/api/backend/saleCarApi'

export type OwnerAction = 'withdraw' | 'sold' | 'republish'

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
}

export function useListingActions(listingId: string): ListingActions {
  const client = useQueryClient()
  const [offering, setOffering] = useState(false)

  const offer = useMutation({
    mutationFn: (price: number) => createOffer({ sale_car_id: listingId, price }),
    // Предложение заводит диалог и меняет счётчик на карточке — перечитывают оба списка.
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['listing', listingId] })
      void client.invalidateQueries({ queryKey: ['offers'] })
      void client.invalidateQueries({ queryKey: ['chat-dialogs'] })
    },
  })

  const phone = useMutation({ mutationFn: () => revealPhone(listingId) })

  const owner = useMutation({
    // Какой переход разрешён в текущем статусе, решает сервер: таблица переходов живёт
    // там, и повторять её здесь значит разойтись с ней на первом же правиле.
    mutationFn: (action: OwnerAction) => changeStatus(listingId, action),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['listing', listingId] })
      void client.invalidateQueries({ queryKey: ['my-listings'] })
    },
  })

  const failure = (offer.error ?? phone.error ?? owner.error) as Error | null
  return {
    phone: phone.data?.phone_number ?? null,
    offering,
    busy: offer.isPending || phone.isPending || owner.isPending,
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
  }
}
