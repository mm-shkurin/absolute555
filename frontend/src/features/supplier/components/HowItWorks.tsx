import { Panel, PanelNote } from '../../../shared/ui/Panel'
import styles from '../supplier.module.css'

interface HowItWorksProps {
  prepayment: string
}

export function HowItWorks({ prepayment }: HowItWorksProps) {
  return (
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
  )
}
