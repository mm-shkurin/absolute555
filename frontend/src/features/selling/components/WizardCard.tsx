// Обёртка шага: та же карточка, что у одиночной формы, но без верхнего отступа — его задаёт
// сетка мастера.
import { FormCard, type FormCardProps } from '../../../shared/ui/FormCard'

export interface WizardCardProps extends Omit<FormCardProps, 'flush' | 'testId'> {
  testId: string
}

export function WizardCard(props: WizardCardProps) {
  return <FormCard {...props} flush />
}
