import { Panel } from '../../../shared/ui/Panel'
import type { SupplierResponseWire } from '../api/requestApi'
import { requestFailureText } from '../logic/requestFailure'
import type { RequestActions } from '../useRequestActions'
import { RespondForm } from './RespondForm'

interface RequestRespondPanelProps {
  myResponse: SupplierResponseWire | undefined
  respond: RequestActions['respond']
}

export function RequestRespondPanel({ myResponse, respond }: RequestRespondPanelProps) {
  return (
    <Panel title="Ваш отклик" testId="request-respond">
      <RespondForm
        // Отклики приезжают после заявки: без ключа форма запоминала пустые
        // поля первого рендера и под «Изменить отклик» показывала пустую цену.
        key={myResponse?.response_id ?? 'new'}
        existing={myResponse ?? null}
        busy={respond.isPending}
        error={respond.error ? requestFailureText(respond.error) : null}
        onSend={(price, days, comment) =>
          respond.mutate({ price, delivery_days: days, comment: comment || undefined })
        }
      />
    </Panel>
  )
}
