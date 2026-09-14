// Свой профиль поставщика: чтение, правка и отправка в очередь.
import { useQuery } from '@tanstack/react-query'
import {
  fetchMyProfile,
  saveMyProfile,
  submitMyProfile,
} from '../../shared/api/backend/supplierApi'
import type { SupplierProfileWire } from '../../shared/api/backend/supplierContract'
import { toUpdate, type ProfileForm } from './logic/profileForm'
import { useProfileForm } from './useProfileForm'
import { useProfileMutation } from './useProfileMutation'

export interface SupplierProfileHandle {
  profile: SupplierProfileWire | null
  form: ProfileForm
  setField: (key: keyof ProfileForm, value: string) => void
  save: () => Promise<void>
  submit: () => Promise<void>
  busy: boolean
  error: string | null
  /** Что получилось последним действием — без этого сохранение выглядело как ничего. */
  notice: string | null
  isLoading: boolean
  loadError: Error | null
  reload: () => void
}

const SUBMITTED = 'Отправлено на проверку. Модератор решит, и мы покажем решение здесь.'

async function saveAndSubmit(form: ProfileForm) {
  // Отправка сохраняет набранное: иначе в очередь уехал бы прошлый текст, а человек
  // видел бы на экране свой.
  await saveMyProfile(toUpdate(form))
  return submitMyProfile()
}

export function useSupplierProfile(): SupplierProfileHandle {
  const query = useQuery({
    queryKey: ['supplier-profile'],
    queryFn: ({ signal }) => fetchMyProfile(signal),
  })
  const { form, error, notice, setField, succeed, fail } = useProfileForm(query.data)
  const save = useProfileMutation(() => saveMyProfile(toUpdate(form)), 'Сохранено.', succeed, fail)
  const submit = useProfileMutation(() => saveAndSubmit(form), SUBMITTED, succeed, fail)

  return {
    profile: query.data ?? null,
    form,
    notice,
    setField,
    save: save.run,
    submit: submit.run,
    busy: save.isPending || submit.isPending,
    error,
    isLoading: query.isPending,
    loadError: (query.error as Error | null) ?? null,
    reload: () => void query.refetch(),
  }
}
