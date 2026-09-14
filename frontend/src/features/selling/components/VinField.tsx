import { Form, Field, TextInput } from '../../../shared/ui/Form'
import styles from '../selling.module.css'

export interface VinFieldProps {
  vin: string
  onVin: (value: string) => void
}

export function VinField({ vin, onVin }: VinFieldProps) {
  return (
    <div className={styles.afterAlert}>
      <Form>
        <Field label="VIN — 17 символов" full>
          <TextInput
            value={vin}
            onChange={onVin}
            placeholder="JTJHY00W004012345"
            mono
            testId="vin-input"
          />
        </Field>
      </Form>
    </div>
  )
}
