import { useState } from 'react'
import { emptyRoleRequestDraft, missingForRoleRequest } from './logic/roleRequestDraft'
import { useRoleRequest } from './useRoleRequest'

export function useApplicationDraft() {
  const [draft, setDraft] = useState(emptyRoleRequestDraft)
  const request = useRoleRequest()
  const gaps = missingForRoleRequest(draft)
  const pending = request.mine.find(
    (one) => one.requested_role === 'importer' && one.status === 'pending',
  )
  const waiting = request.sent || pending !== undefined
  return { draft, setDraft, request, gaps, waiting }
}
