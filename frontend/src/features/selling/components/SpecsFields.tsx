// Помечается только то, чей источник подтвердил сервер. Не подставилось — значит пусто, и
// заполняет продавец: пометка на угаданном поле снимала бы с него проверку.
import type { Draft } from '../logic/draft'
import { listingYearHint } from '../../../shared/format/yearHints'
import { Form, Field, Select } from '../../../shared/ui/Form'
import { RecognizedInput, isRecognized } from './RecognizedInput'

const TRANSMISSIONS = ['АКПП', 'МКПП', 'Вариатор', 'Робот']

export interface SpecsFieldsProps {
  draft: Draft
  manual: boolean
  onField: (key: keyof Draft, value: string) => void
}

export function SpecsFields({ draft, manual, onField }: SpecsFieldsProps) {
  const common = { draft, onField }
  return (
    <Form>
      <RecognizedInput {...common} name="brand" label="Марка" placeholder="Lexus" />
      <RecognizedInput {...common} name="model" label="Модель" placeholder="LX 570" />
      <RecognizedInput
        {...common}
        name="year"
        label="Год выпуска"
        placeholder={listingYearHint()}
      />
      <Field label="Коробка" source={draft.transmission.source}>
        <Select
          value={draft.transmission.value}
          onChange={(value) => onField('transmission', value)}
          options={TRANSMISSIONS}
          recognized={isRecognized(draft.transmission.source)}
        />
      </Field>
      <RecognizedInput {...common} name="enginePower" label="Мощность, л.с." placeholder="367" />
      <RecognizedInput
        {...common}
        name="vin"
        label={manual ? 'VIN — необязательно' : 'VIN'}
        placeholder="17 символов"
        mono
      />
    </Form>
  )
}
