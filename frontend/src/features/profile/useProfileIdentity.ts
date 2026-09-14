// Действия над своей учётной записью: имя, фотография, выход.
//
// Отдельно от экрана, потому что каждое из них — запрос с исходом: экран показывает
// результат, а решает, что считать успехом и что делать с сессией, этот слой.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeAvatar, renameProfile, uploadAvatar } from '../../shared/api/backend/accountApi'
import type { IdentityActions } from './components/ProfileIdentity'
import { useSignOut } from './useSignOut'

export function useProfileIdentity(): IdentityActions {
  const client = useQueryClient()
  // Профиль перечитывается после каждой правки, а не собирается на клиенте: имя, которое
  // сервер обрезал или отклонил, иначе осталось бы на экране как сохранённое.
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['profile'] })
  }
  const rename = useMutation({ mutationFn: renameProfile, onSuccess: refresh })
  const setPhoto = useMutation({ mutationFn: uploadAvatar, onSuccess: refresh })
  const dropPhoto = useMutation({ mutationFn: removeAvatar, onSuccess: refresh })
  const signOut = useSignOut()

  const failed = rename.error ?? setPhoto.error ?? dropPhoto.error
  return {
    onRename: (name: string) => rename.mutate(name),
    onPickPhoto: (file: File) => setPhoto.mutate(file),
    onDropPhoto: () => dropPhoto.mutate(),
    onSignOut: () => signOut.mutate(),
    busy: rename.isPending || setPhoto.isPending || dropPhoto.isPending,
    error: failed ? failed.message : null,
  }
}
