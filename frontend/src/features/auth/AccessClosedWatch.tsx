// Перевод на экран закрытого доступа, откуда бы отказ ни пришёл.
//
// Один слушатель на приложение, а не проверка в каждом экране: отказ приходит в ответ на
// любой запрос, и экран, который забыли научить, оставил бы человека с плашкой «не
// хватает прав» — текстом, по которому не понять ни что случилось, ни что делать.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAccessClosed } from '../../shared/session/accessClosed'
import { ROUTES } from '../../shared/navigation/routes'

export function AccessClosedWatch() {
  const navigate = useNavigate()

  useEffect(
    () => onAccessClosed(() => navigate(ROUTES.accessClosed, { replace: true })),
    [navigate],
  )

  return null
}
