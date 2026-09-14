import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { openDirectChat } from '../../../shared/api/backend/chatApi'
import { Panel } from '../../../shared/ui/Panel'
import { ROUTES } from '../../../shared/navigation/routes'
import styles from '../supplier.module.css'

interface OrderPanelProps {
  supplierId: string
}

export function OrderPanel({ supplierId }: OrderPanelProps) {
  const navigate = useNavigate()
  // Переписка заводится сервером и возвращается та же при повторе: кнопка не плодит чатов.
  const write = useMutation({
    mutationFn: () => openDirectChat(supplierId),
    onSuccess: (dialog) => navigate(ROUTES.chat(dialog.dialog_id)),
  })
  return (
    <Panel title="Заказать привоз" first>
      <p>
        Опишите, что нужно — поставщик ответит ценой и сроком. Это не покупка, а начало переговоров.
      </p>
      <div className={styles.actions}>
        <ButtonLink to={ROUTES.newImportRequest} block>
          Оставить заявку «хочу такую»
        </ButtonLink>
        <Button
          tone="ghost"
          block
          disabled={write.isPending}
          onClick={() => write.mutate()}
          data-testid="supplier-write"
        >
          Написать
        </Button>
        {write.error ? <p className={styles.writeError}>{(write.error as Error).message}</p> : null}
      </div>
    </Panel>
  )
}
