// Шаги мастера продажи и переходы между ними.
//
// Экран мастера — конечный автомат, и он описан здесь, а не в разметке: ветка «распознали»
// или «не разобрали VIN» меняет не вид, а состояние, и хранить её в JSX значило бы
// восстанавливать её по дереву компонентов.
export type StepId = 'document' | 'specs' | 'pricing' | 'photos' | 'thickness' | 'review'

// Состояния первого шага. Отдельным типом: их пять, все живут внутри одного шага, и в
// боковой навигации им незачем появляться.
export type DocumentStage = 'await' | 'recognizing' | 'unreadable' | 'novin' | 'manual'

export interface WizardState {
  step: StepId
  stage: DocumentStage
  submitted: boolean
}

export const INITIAL_STATE: WizardState = { step: 'document', stage: 'await', submitted: false }

export const STEPS: { id: StepId; title: string }[] = [
  { id: 'document', title: 'Фото СТС' },
  { id: 'specs', title: 'Характеристики' },
  { id: 'pricing', title: 'Цена и контакты' },
  { id: 'photos', title: 'Фотографии' },
  { id: 'thickness', title: 'Карта замеров' },
  { id: 'review', title: 'Отправка' },
]

export function stepIndex(step: StepId): number {
  return STEPS.findIndex((item) => item.id === step)
}

export function nextStep(step: StepId): StepId {
  return STEPS[Math.min(stepIndex(step) + 1, STEPS.length - 1)].id
}

export function previousStep(step: StepId): StepId {
  return STEPS[Math.max(stepIndex(step) - 1, 0)].id
}

// Пройденным считается шаг левее текущего. Черновик можно бросить и вернуться, поэтому
// «пройден» здесь значит «был показан», а не «заполнен без единого пустого поля».
export function isPassed(step: StepId, current: StepId): boolean {
  return stepIndex(step) < stepIndex(current)
}
