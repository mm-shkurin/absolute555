import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ROUTES } from '../../shared/navigation/routes'
import { openRequest } from '../../shared/api/backend/requestApi'
import { emptyRequestDraft, missingForRequest, toRequestBody } from './logic/requestDraft'
import type { RequestDraft } from './logic/requestDraft'

export function useNewRequest() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(emptyRequestDraft)
  const open = useMutation({
    mutationFn: () => openRequest(toRequestBody(draft)),
    onSuccess: (request) => navigate(ROUTES.importRequest(request.request_id)),
  })
  const patch = (changes: Partial<RequestDraft>) =>
    setDraft((current) => ({ ...current, ...changes }))

  return {
    draft,
    gaps: missingForRequest(draft),
    open,
    cancel: () => navigate(ROUTES.importFeed),
    set: (key: keyof RequestDraft, value: string) => patch({ [key]: value }),
    // Смена марки обнуляет модель: модель от другой марки уехала бы в заявку молча.
    pickBrand: (id: string, name: string) =>
      patch({ brandId: id, brandName: name, modelId: '', modelName: '' }),
    pickModel: (id: string, name: string) => patch({ modelId: id, modelName: name }),
  }
}

export type NewRequestState = ReturnType<typeof useNewRequest>
