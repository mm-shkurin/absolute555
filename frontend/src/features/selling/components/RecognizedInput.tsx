import type { Draft, FieldSource } from '../logic/draft'
import { Field, TextInput } from '../../../shared/ui/Form'

export const isRecognized = (source: FieldSource) => source !== 'manual'

export interface RecognizedInputProps {
  draft: Draft
  name: 'brand' | 'model' | 'year' | 'enginePower' | 'vin'
  label: string
  placeholder: string
  mono?: boolean
  onField: (key: keyof Draft, value: string) => void
}

export function RecognizedInput({
  draft,
  name,
  label,
  placeholder,
  mono,
  onField,
}: RecognizedInputProps) {
  const field = draft[name]
  return (
    <Field label={label} source={field.source}>
      <TextInput
        value={field.value}
        onChange={(value) => onField(name, value)}
        recognized={isRecognized(field.source)}
        placeholder={placeholder}
        mono={mono}
      />
    </Field>
  )
}
