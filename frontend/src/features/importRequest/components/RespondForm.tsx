// Отклик поставщика: цена под ключ, срок и слово от себя.
//
// Повторный отклик правит свой, а не заводит второй — поэтому кнопка называется
// «Изменить отклик», когда он уже есть.
import { Button } from '../../../shared/ui/Button'
import type { SupplierResponseWire } from '../../../shared/api/backend/requestContract'
import { useRespondDraft } from '../useRespondDraft'
import { RespondFields } from './RespondFields'
import styles from '../request.module.css'

interface RespondFormProps {
  existing: SupplierResponseWire | null
  busy: boolean
  error: string | null
  onSend: (price: number, days: number, comment: string) => void
}

export function RespondForm({ existing, busy, error, onSend }: RespondFormProps) {
  const draft = useRespondDraft(existing)
  return (
    <div data-testid="respond-form">
      <RespondFields draft={draft} />
      {error ? (
        <p className={styles.refused} role="alert" data-testid="bid-error">
          {error}
        </p>
      ) : null}
      <Button
        disabled={busy || !draft.complete}
        onClick={() => onSend(...draft.values())}
        data-testid="bid-send"
      >
        {existing ? 'Изменить отклик' : 'Откликнуться'}
      </Button>
    </div>
  )
}
