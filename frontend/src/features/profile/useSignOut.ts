import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../shared/api/backend/accountApi'
import { currentSession, endSession } from '../../shared/session/authSession'
import { ROUTES } from '../../shared/navigation/routes'

export function useSignOut() {
  const client = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async () => {
      const session = currentSession()
      if (!session) return
      try {
        await logout(session.refreshToken)
      } catch {
        // Сервер не ответил — выходим всё равно. Человек нажал «выйти», и оставить его
        // внутри из-за сбоя сети значит не сделать единственное, о чём он попросил;
        // токен на сервере доживёт до своего срока сам.
      }
    },
    onSettled: () => {
      endSession()
      client.clear()
      navigate(ROUTES.home)
    },
  })
}
