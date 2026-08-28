// Второй шаг: проверка того, что подставило распознавание. Поля из VIN подкрашены — это
// весь смысл шага, без пометки он превращается в «нажать дальше не глядя».
import { Button } from '../../../shared/ui/Button'
import type { Draft, FieldSource } from '../logic/draft'
import { Alert } from './Alert'
import { Form, Field, Select, TextInput } from './Form'
import { WizardCard, NavSpacer } from './WizardCard'

const TRANSMISSIONS = ['АКПП', 'МКПП', 'Вариатор', 'Робот']

interface Props {
  draft: Draft
  manual: boolean
  onField: (key: keyof Draft, value: string) => void
  onBack: () => void
  onNext: () => void
}

const recognized = (source: FieldSource) => source !== 'manual'

export function StepSpecs({ draft, manual, onField, onBack, onNext }: Props) {
  return (
    <WizardCard
      testId={manual ? 'step-specs-manual' : 'step-specs'}
      title={manual ? 'Заполните характеристики сами' : 'Проверьте, что распозналось'}
      sub={
        manual
          ? 'СТС не обязателен. Всё то же самое можно ввести руками — просто дольше.'
          : 'Голубым помечены поля, которые заполнило приложение. Перепроверьте их — ошибка в характеристиках всплывёт при осмотре.'
      }
      nav={
        <>
          <Button tone="ghost" onClick={onBack}>
            Назад
          </Button>
          <NavSpacer />
          <Button onClick={onNext} data-testid="specs-next">
            Дальше
          </Button>
        </>
      }
    >
      <Form>
        <Field label="Марка" source={draft.brand.source}>
          <TextInput
            value={draft.brand.value}
            onChange={(value) => onField('brand', value)}
            recognized={recognized(draft.brand.source)}
            placeholder="Lexus"
          />
        </Field>
        <Field label="Модель" source={draft.model.source}>
          <TextInput
            value={draft.model.value}
            onChange={(value) => onField('model', value)}
            recognized={recognized(draft.model.source)}
            placeholder="LX 570"
          />
        </Field>
        <Field label="Год выпуска" source={draft.year.source}>
          <TextInput
            value={draft.year.value}
            onChange={(value) => onField('year', value)}
            recognized={recognized(draft.year.source)}
            placeholder="2012"
          />
        </Field>
        <Field label="Коробка" source={draft.transmission.source}>
          <Select
            value={draft.transmission.value}
            onChange={(value) => onField('transmission', value)}
            options={TRANSMISSIONS}
            recognized={recognized(draft.transmission.source)}
          />
        </Field>
        <Field label="Мощность, л.с." source={draft.enginePower.source}>
          <TextInput
            value={draft.enginePower.value}
            onChange={(value) => onField('enginePower', value)}
            recognized={recognized(draft.enginePower.source)}
            placeholder="367"
          />
        </Field>
        <Field label={manual ? 'VIN — необязательно' : 'VIN'} source={draft.vin.source}>
          <TextInput
            value={draft.vin.value}
            onChange={(value) => onField('vin', value)}
            recognized={recognized(draft.vin.source)}
            placeholder="17 символов"
            mono
          />
        </Field>
      </Form>
      {!manual && draft.enginePower.source === 'document' ? (
        <Alert tone="warn" spaced>
          Мощность в СТС и по VIN разошлись. Оставили значение из документа — поправьте, если знаете
          точное.
        </Alert>
      ) : null}
    </WizardCard>
  )
}
