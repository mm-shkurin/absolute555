import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../shared/navigation/routes'
import type { SideHandlers } from './components/SidePanel'
import type { ListingActions } from './useListingActions'

export function useSideHandlers(
  actions: ListingActions,
  onComplain: () => void,
  onSignIn?: () => void,
): SideHandlers {
  const navigate = useNavigate()
  return {
    onOffer: actions.openOffer,
    // Переписка начинается предложением цены: диалог заводит сервер, отдельной ручки
    // «написать продавцу» нет, и кнопка ведёт туда, где переписка появится.
    onMessage: () => navigate(ROUTES.chats),
    onShowPhone: actions.showPhone,
    onSignIn: () => onSignIn?.(),
    onComplain,
  }
}
