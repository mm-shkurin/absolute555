import { useNavigate } from 'react-router-dom'
import { FormCard, NavSpacer } from '../../../shared/ui/FormCard'
import { Button } from '../../../shared/ui/Button'
import { ROUTES } from '../../../shared/navigation/routes'
import { useApplicationDraft } from '../useApplicationDraft'
import { ApplicationFields } from './ApplicationFields'
import { ApplicationNotes } from './ApplicationNotes'

const SUB =
  'Заявку рассматривает модератор. Одобрят — сможете завести профиль поставщика и публиковать позиции под привоз.'

export function ApplicationCard() {
  const navigate = useNavigate()
  const { draft, setDraft, request, gaps, waiting } = useApplicationDraft()
  const nav = (
    <>
      <Button tone="ghost" onClick={() => navigate(ROUTES.profile)}>
        Отмена
      </Button>
      <NavSpacer />
      <Button
        disabled={request.sending || waiting || gaps.length > 0}
        onClick={() => request.send(draft)}
        data-testid="submit-application"
      >
        Отправить заявку
      </Button>
    </>
  )
  return (
    <FormCard title="Заявка на роль поставщика" sub={SUB} testId="supplier-form" nav={nav}>
      <ApplicationFields waiting={waiting} draft={draft} onDraft={setDraft} />
      <ApplicationNotes failure={request.failure} gaps={waiting ? [] : gaps} />
    </FormCard>
  )
}
