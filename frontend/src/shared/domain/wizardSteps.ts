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

export const STEP_IDS: StepId[] = ['document', 'specs', 'pricing', 'photos', 'thickness', 'review']

export function stepIndex(step: StepId): number {
  return STEP_IDS.indexOf(step)
}

export function nextStep(step: StepId): StepId {
  return STEP_IDS[Math.min(stepIndex(step) + 1, STEP_IDS.length - 1)]
}

export function previousStep(step: StepId): StepId {
  return STEP_IDS[Math.max(stepIndex(step) - 1, 0)]
}

// Пройденным считается шаг левее текущего. Черновик можно бросить и вернуться, поэтому
// «пройден» здесь значит «был показан», а не «заполнен без единого пустого поля».
export function isPassed(step: StepId, current: StepId): boolean {
  return stepIndex(step) < stepIndex(current)
}

/** Шаг, с которого продолжать начатый черновик: первый, где ещё пусто.
 *
 *  Без этого «Продолжить» открывало фото СТС, хотя марка, год и цена уже подтянуты с
 *  сервера, — и казалось, что мастер всё забыл. */
export function resumeStep(draft: {
  brand: { value: string }
  model: { value: string }
  year: { value: string }
  price: string
  mileage: string
  photosCount: number
}): StepId {
  const named = [draft.brand, draft.model, draft.year].filter((field) => field.value.trim())
  if (named.length === 0) return 'document'
  if (named.length < 3 || !draft.mileage.trim()) return 'specs'
  if (!draft.price.trim()) return 'pricing'
  if (draft.photosCount === 0) return 'photos'
  return 'thickness'
}
