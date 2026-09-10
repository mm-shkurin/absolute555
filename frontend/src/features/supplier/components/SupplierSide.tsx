// Правая колонка страницы поставщика: как начать и как это устроено. Порядок расчётов
// назван прямо — площадка денег не держит, и человек должен понять это до переписки,
// а не после предоплаты.
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { openDirectChat } from '../../../shared/api/backend/chatApi'
import { Panel, PanelNote } from '../../../shared/ui/Panel'
import { ROUTES } from '../../../shared/navigation/routes'
import type { SupplierView } from '../logic/supplierView'
import styles from '../supplier.module.css'

export function SupplierSide({ supplier }: { supplier: SupplierView }) {
  const navigate = useNavigate()
  // Переписка заводится сервером и возвращается та же при повторе: кнопка не плодит чатов.
  const write = useMutation({
    mutationFn: () => openDirectChat(supplier.id),
    onSuccess: (dialog) => navigate(ROUTES.chat(dialog.dialog_id)),
  })
  const prepayment = supplier.terms.find((term) => term.label === 'Предоплата')?.value ?? ''
  return (
    <aside className={styles.side}>
      <Panel title="Заказать привоз" first>
        <p>
          Опишите, что нужно — поставщик ответит ценой и сроком. Это не покупка, а начало
          переговоров.
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
      <Panel title="Как это работает">
        <ol className={styles.steps}>
          <li>Вы описываете машину и бюджет</li>
          <li>Поставщик отвечает ценой под ключ и сроком</li>
          <li>Предоплата {prepayment.toLowerCase()}</li>
          <li>Остаток — по прибытии</li>
        </ol>
        <PanelNote>
          Площадка не участвует в расчётах и не держит деньги. Проверяйте условия сами — рейтинг и
          отзывы для этого и нужны.
        </PanelNote>
      </Panel>
    </aside>
  )
}
