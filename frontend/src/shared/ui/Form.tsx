// Поля формы. Одна обёртка на все формы приложения: подпись, отметка происхождения
// значения и сам контрол.
import type { ChangeEvent, ReactNode } from 'react'
import type { FieldSource } from './fieldSource'
import styles from './Form.module.css'

const SOURCE_TAG: Record<FieldSource, string | null> = {
  manual: null,
  vin: 'из VIN',
  document: 'из СТС',
}

export function Form({ children }: { children: ReactNode }) {
  return <div className={styles.form}>{children}</div>
}

export function Field({
  label,
  source = 'manual',
  full,
  children,
}: {
  label: string
  source?: FieldSource
  full?: boolean
  children: ReactNode
}) {
  const tag = SOURCE_TAG[source]
  return (
    <label className={[styles.field, full ? styles.full : ''].join(' ')}>
      <span className={styles.label}>
        {label}
        {tag ? <span className={styles.tag}>{tag}</span> : null}
      </span>
      {children}
    </label>
  )
}

interface InputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  mono?: boolean
  recognized?: boolean
  testId?: string
}

export function TextInput({ value, onChange, placeholder, mono, recognized, testId }: InputProps) {
  return (
    <input
      className={controlClass(mono, recognized)}
      value={value}
      placeholder={placeholder}
      data-testid={testId}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
    />
  )
}

export function TextArea({ value, onChange, placeholder }: InputProps) {
  return (
    <textarea
      className={styles.control}
      value={value}
      placeholder={placeholder}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
    />
  )
}

export function Select({
  value,
  onChange,
  options,
  recognized,
  disabled,
}: InputProps & { options: string[]; disabled?: boolean }) {
  return (
    <select
      className={controlClass(false, recognized)}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Выберите</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

export function Switch({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <label className={styles.switch}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.track} />
      {children}
    </label>
  )
}

function controlClass(mono?: boolean, recognized?: boolean): string {
  return [styles.control, mono ? styles.mono : '', recognized ? styles.recognized : '']
    .filter(Boolean)
    .join(' ')
}
