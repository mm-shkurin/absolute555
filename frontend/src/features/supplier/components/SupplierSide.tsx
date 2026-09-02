// Правая колонка страницы поставщика: как начать и как это устроено. Порядок расчётов
// назван прямо — площадка денег не держит, и человек должен понять это до переписки,
// а не после предоплаты.
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { Panel, PanelNote } from '../../../shared/ui/Panel'
import { ROUTES } from '../../../shared/navigation/routes'
import type { SupplierView } from '../logic/supplierView'
import styles from '../supplier.module.css'

export function SupplierSide({ supplier }: { supplier: SupplierView }) {
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
          <Button tone="ghost" block>
            Написать
          </Button>
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
