// Действия над своей учётной записью: имя, фотография, выход.
//
// Отдельно от экрана, потому что каждое из них — запрос с исходом: экран показывает
// результат, а решает, что считать успехом и что делать с сессией, этот слой.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  logout,
  removeAvatar,
  renameProfile,
  uploadAvatar,
} from '../../shared/api/backend/accountApi'
import { currentSession, endSession } from '../../shared/session/authSession'
import { ROUTES } from '../../shared/navigation/routes'
import type { IdentityActions } from './components/ProfileIdentity'

export function useProfileIdentity(): IdentityActions {
  const client = useQueryClient()
  const navigate = useNavigate()

  // Профиль перечитывается после каждой правки, а не собирается на клиенте: имя, которое
  // сервер обрезал или отклонил, иначе осталось бы на экране как сохранённое.
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['profile'] })
  }

  const rename = useMutation({ mutationFn: renameProfile, onSuccess: refresh })
  const setPhoto = useMutation({ mutationFn: uploadAvatar, onSuccess: refresh })
  const dropPhoto = useMutation({ mutationFn: removeAvatar, onSuccess: refresh })

  const signOut = useMutation({
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

  const failed = rename.error ?? setPhoto.error ?? dropPhoto.error
  return {
    onRename: (name: string) => rename.mutate(name),
    onPickPhoto: (file: File) => setPhoto.mutate(file),
    onDropPhoto: () => dropPhoto.mutate(),
    onSignOut: () => signOut.mutate(),
    busy: rename.isPending || setPhoto.isPending || dropPhoto.isPending,
    error: failed ? (failed as Error).message : null,
  }
}
