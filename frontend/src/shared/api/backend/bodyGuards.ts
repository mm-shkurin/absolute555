// Проверки формы успешного ответа там, где ответ решает, куда пойдёт поток: вход и исход
// распознавания. Проверяются только поля, которые код читает.
import type { AutofillState } from './saleCarContract'

const AUTOFILL_STATES: ReadonlySet<unknown> = new Set<AutofillState>([
  'none',
  'pending',
  'unreadable',
  'undecoded',
  'done',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isTokenPairBody(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.access_token === 'string' &&
    typeof value.refresh_token === 'string'
  )
}

function isAutofill(value: unknown): boolean {
  return isRecord(value) && AUTOFILL_STATES.has(value.state)
}

export function isSaleCarBody(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.sale_car_id === 'string' &&
    (value.autofill === undefined || value.autofill === null || isAutofill(value.autofill))
  )
}
