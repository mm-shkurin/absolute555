import { useEffect, useState } from 'react'
import type { SupplierProfileWire } from '../../shared/api/backend/supplierContract'
import { EMPTY_FORM, toForm, type ProfileForm } from './logic/profileForm'

export function useProfileForm(loaded: SupplierProfileWire | undefined) {
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Форма наполняется тем, что пришло, один раз на загрузку: дальше ею владеет человек,
  // и перетирать набранное ответом сервера значило бы стирать правку на полуслове.
  useEffect(() => {
    if (loaded) setForm(toForm(loaded))
  }, [loaded])

  return {
    form,
    error,
    notice,
    setField: (key: keyof ProfileForm, value: string) => {
      setNotice(null)
      setForm((previous) => ({ ...previous, [key]: value }))
    },
    succeed: (profile: SupplierProfileWire, message: string) => {
      setForm(toForm(profile))
      setError(null)
      setNotice(message)
    },
    fail: (message: string) => {
      setNotice(null)
      setError(message)
    },
  }
}
