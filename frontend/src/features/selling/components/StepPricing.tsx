// Третий шаг: цена, пробег и связь. Телефон обязателен, но его показ — выбор продавца.
import { Button } from '../../../shared/ui/Button'
import type { Draft } from '../logic/draft'
import { Switch } from '../../../shared/ui/Form'
import { PricingFields } from './PricingFields'
import { WizardCard } from './WizardCard'
import { WizardNav } from './WizardNav'
import styles from '../selling.module.css'

export interface StepPricingProps {
  draft: Draft
  onField: (key: keyof Draft, value: string) => void
  onShowPhone: (value: boolean) => void
  onBack: () => void
  onNext: () => void
}

export function StepPricing({ draft, onField, onShowPhone, onBack, onNext }: StepPricingProps) {
  return (
    <WizardCard
      testId="step-pricing"
      title="Цена, пробег и как с вами связаться"
      sub="Телефон нужен, но в карточке он скрыт — покажется только если вы разрешите."
      nav={
        <WizardNav onBack={onBack}>
          <Button onClick={onNext} data-testid="pricing-next">
            Дальше
          </Button>
        </WizardNav>
      }
    >
      <PricingFields draft={draft} onField={onField} />
      <Switch checked={draft.showPhone} onChange={onShowPhone}>
        Показывать телефон в карточке
      </Switch>
      <p className={styles.hint}>
        Выключено — общаться будут только через чат. Номер можно дать в переписке вручную.
      </p>
    </WizardCard>
  )
}
