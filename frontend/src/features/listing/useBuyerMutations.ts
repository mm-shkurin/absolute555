import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createOffer } from '../../shared/api/backend/offerApi'
import { revealPhone } from '../../shared/api/backend/saleCarApi'

export function useBuyerMutations(listingId: string) {
  const client = useQueryClient()
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
  return { offer, phone }
}
