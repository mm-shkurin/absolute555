import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDraftState } from './useDraftState'
import { useWizardServer } from './useWizardServer'

export function useSellingWizard() {
  const navigate = useNavigate()
  const wizard = useDraftState()
  const { saleCarId } = useParams()
  // Канал выбирается адресом входа в мастер и дальше не меняется. Чужая роль получит на
  // создании `403 NOT_AN_IMPORTER` — кнопку сюда показывают только поставщику.
  const [search] = useSearchParams()
  const kind = search.get('kind') === 'import' ? 'import' : 'stock'
  const server = useWizardServer({ ...wizard, stage: wizard.state.stage }, saleCarId, kind)
  const goNext = () => server.saveAnd(wizard.goNext)
  return { navigate, wizard, server, goNext, saleCarId }
}

export type SellingWizard = ReturnType<typeof useSellingWizard>
