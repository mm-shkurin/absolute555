// Третий шаг: цена, пробег и связь. Телефон обязателен, но его показ — выбор продавца.
import { Button } from '../../../shared/ui/Button'
import type { Draft } from '../logic/draft'
import { Form, Field, Select, Switch, TextArea, TextInput } from './Form'
import { WizardCard, NavSpacer } from './WizardCard'
import styles from '../selling.module.css'

const CITIES = ['Омск', 'Калачинск', 'Тара']

interface Props {
  draft: Draft
  onField: (key: keyof Draft, value: string) => void
  onShowPhone: (value: boolean) => void
  onBack: () => void
  onNext: () => void
}

export function StepPricing({ draft, onField, onShowPhone, onBack, onNext }: Props) {
  return (
    <WizardCard
      testId="step-pricing"
      title="Цена, пробег и как с вами связаться"
      sub="Телефон нужен, но в карточке он скрыт — покажется только если вы разрешите."
      nav={
        <>
          <Button tone="ghost" onClick={onBack}>
            Назад
          </Button>
          <NavSpacer />
          <Button onClick={onNext} data-testid="pricing-next">
            Дальше
          </Button>
        </>
      }
    >
      <Form>
        <Field label="Цена, ₽">
          <TextInput
            value={draft.price}
            onChange={(value) => onField('price', value)}
            placeholder="4 020 000"
          />
        </Field>
        <Field label="Пробег, км">
          <TextInput
            value={draft.mileage}
            onChange={(value) => onField('mileage', value)}
            placeholder="180 000"
          />
        </Field>
        <Field label="Город">
          <Select
            value={draft.city}
            onChange={(value) => onField('city', value)}
            options={CITIES}
          />
        </Field>
        <Field label="Телефон">
          <TextInput
            value={draft.phone}
            onChange={(value) => onField('phone', value)}
            placeholder="+7 913 000-00-00"
            mono
          />
        </Field>
        <Field label="Описание" full>
          <TextArea
            value={draft.description}
            onChange={(value) => onField('description', value)}
            placeholder="Что важно знать покупателю: история обслуживания, что менялось, что требует внимания."
          />
        </Field>
      </Form>
      <Switch checked={draft.showPhone} onChange={onShowPhone}>
        Показывать телефон в карточке
      </Switch>
      <p className={styles.hint}>
        Выключено — общаться будут только через чат. Номер можно дать в переписке вручную.
      </p>
    </WizardCard>
  )
}
