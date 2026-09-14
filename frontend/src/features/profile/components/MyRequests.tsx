// Свои заявки на привоз. Отклик — главное число строки: заявка без откликов ничем не
// отличается от заявки, о которой забыли, кроме этого счётчика.
import { Panel } from '../../../shared/ui/Panel'
import { ButtonLink } from '../../../shared/ui/Button'
import { ROUTES } from '../../../shared/navigation/routes'
import type { ImportRequestView } from '../logic/profileView'
import { RequestRow } from './RequestRow'

interface MyRequestsProps {
  requests: ImportRequestView[]
}

export function MyRequests({ requests }: MyRequestsProps) {
  const aside = (
    <ButtonLink to={ROUTES.newImportRequest} tone="ghost" size="small">
      Новая заявка
    </ButtonLink>
  )
  return (
    <Panel title="Мои заявки на привоз" aside={aside} testId="my-requests">
      {requests.length === 0 ? (
        <p>Не нашли нужную машину в ленте — опишите её заявкой, и поставщики откликнутся сами.</p>
      ) : null}
      {requests.map((request) => (
        <RequestRow key={request.id} request={request} />
      ))}
    </Panel>
  )
}
