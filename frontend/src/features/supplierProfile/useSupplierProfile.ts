// Свой профиль поставщика: чтение, правка и отправка в очередь.
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchMyProfile,
  saveMyProfile,
  submitMyProfile,
} from '../../shared/api/backend/supplierApi'
import type { SupplierProfileWire } from '../../shared/api/backend/supplierContract'
import { EMPTY_FORM, toForm, toUpdate, type ProfileForm } from './logic/profileForm'
import { profileFailureText } from './logic/profileStatus'

export interface SupplierProfileHandle {
  profile: SupplierProfileWire | null
  form: ProfileForm
  setField: (key: keyof ProfileForm, value: string) => void
  save: () => Promise<void>
  submit: () => Promise<void>
  busy: boolean
  error: string | null
  isLoading: boolean
  loadError: Error | null
  reload: () => void
}

export function useSupplierProfile(): SupplierProfileHandle {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['supplier-profile'], queryFn: ({ signal }) => fetchMyProfile(signal) })
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  // Форма наполняется тем, что пришло, один раз на загрузку: дальше ею владеет человек,
  // и перетирать набранное ответом сервера значило бы стирать правку на полуслове.
  useEffect(() => {
    if (query.data) setForm(toForm(query.data))
  }, [query.data])

  const done = (profile: SupplierProfileWire) => {
    client.setQueryData(['supplier-profile'], profile)
    setForm(toForm(profile))
    setError(null)
  }

  const save = useMutation({
    mutationFn: () => saveMyProfile(toUpdate(form)),
    onSuccess: done,
    onError: (failure) => setError(profileFailureText(failure)),
  })

  const submit = useMutation({
    mutationFn: async () => {
      // Отправка сохраняет набранное: иначе в очередь уехал бы прошлый текст, а человек
      // видел бы на экране свой.
      await saveMyProfile(toUpdate(form))
      return submitMyProfile()
    },
    onSuccess: done,
    onError: (failure) => setError(profileFailureText(failure)),
  })

  return {
    profile: query.data ?? null,
    form,
    setField: (key, value) => setForm((previous) => ({ ...previous, [key]: value })),
    save: async () => {
      await save.mutateAsync().catch(() => undefined)
    },
    submit: async () => {
      await submit.mutateAsync().catch(() => undefined)
    },
    busy: save.isPending || submit.isPending,
    error,
    isLoading: query.isPending,
    loadError: (query.error as Error | null) ?? null,
    reload: () => void query.refetch(),
  }
}
