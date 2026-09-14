import { httpErrorIn } from './httpClient'

export function missingFieldsText(
  error: unknown,
  errorCode: string,
  labels: Record<string, string>,
): string | null {
  const failure = httpErrorIn(error)
  if (failure?.errorCode !== errorCode) return null
  const missing = failure.details?.missing_fields
  const named = Array.isArray(missing)
    ? missing.map((field) => labels[String(field)] ?? String(field))
    : []
  return named.length > 0 ? `Не хватает: ${named.join(', ')}.` : null
}
