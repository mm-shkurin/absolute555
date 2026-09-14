import { useMutation, useQueryClient } from '@tanstack/react-query'
import { changeStatus, patchListing } from '../../shared/api/backend/saleCarApi'

export type OwnerAction = 'withdraw' | 'sold' | 'republish'

/** Что продавец открывает покупателю. Правится тем же PATCH, что и остальные поля
 *  объявления: отдельная ручка ради трёх флагов была бы вторым способом сказать то же. */
export interface ListingSettings {
  phone_visible?: boolean
  chat_allowed?: boolean
  offers_visible?: boolean
}

export function useOwnerMutations(listingId: string) {
  const client = useQueryClient()
  const owner = useMutation({
    // Какой переход разрешён в текущем статусе, решает сервер: таблица переходов живёт
    // там, и повторять её здесь значит разойтись с ней на первом же правиле.
    mutationFn: (action: OwnerAction) => changeStatus(listingId, action),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['listing', listingId] })
      void client.invalidateQueries({ queryKey: ['my-listings'] })
    },
  })
  const setting = useMutation({
    mutationFn: (patch: ListingSettings) => patchListing(listingId, patch),
    // Карточка перечитывается, а не собирается на клиенте: настройку мог не принять
    // сервер, и переключатель показал бы состояние, которого нет.
    onSuccess: () => void client.invalidateQueries({ queryKey: ['listing', listingId] }),
  })
  return { owner, setting }
}
