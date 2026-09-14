import { failureText } from '../../../shared/api/failureText'
import { missingFieldsText } from '../../../shared/api/missingFields'

const FIELD_LABEL: Record<string, string> = {
  company_name: 'название',
  countries: 'страны',
  brands: 'марки',
  delivery_days_min: 'срок доставки от',
  delivery_days_max: 'срок доставки до',
  terms: 'условия',
  description: 'описание',
}

export function profileFailureText(error: unknown): string {
  return missingFieldsText(error, 'PROFILE_INCOMPLETE', FIELD_LABEL) ?? failureText(error)
}
