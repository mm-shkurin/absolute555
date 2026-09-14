import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SupplierProfileWire } from '../../shared/api/backend/supplierContract'
import { profileFailureText } from './logic/profileFailure'

export function useProfileMutation(
  mutationFn: () => Promise<SupplierProfileWire>,
  message: string,
  succeed: (profile: SupplierProfileWire, message: string) => void,
  fail: (message: string) => void,
) {
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn,
    onSuccess: (profile) => {
      client.setQueryData(['supplier-profile'], profile)
      succeed(profile, message)
    },
    onError: (failure) => fail(profileFailureText(failure)),
  })
  return {
    // Исход уже доставлен через onSuccess/onError; отказ промиса не должен всплыть необработанным.
    run: () => mutation.mutateAsync().then(ignore, ignore),
    isPending: mutation.isPending,
  }
}

function ignore() {
  return undefined
}
