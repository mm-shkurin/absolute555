// Состояние мастера: черновик и место в автомате. Отдельным хуком, чтобы страница осталась
// разметкой, а переходы можно было проверить без рендера.
import { useState } from 'react'
import { EMPTY_DRAFT, type Draft } from './logic/draft'
import {
  INITIAL_STATE,
  nextStep,
  previousStep,
  type DocumentStage,
  type StepId,
} from './logic/wizardSteps'

export function useDraftState() {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [state, setState] = useState(INITIAL_STATE)

  // Поля черновика делятся на строки и структуры «значение плюс происхождение». Правка
  // руками сбрасывает происхождение: значение, которое человек переписал, больше не «из VIN».
  const setField = (key: keyof Draft, value: string) =>
    setDraft((current) => {
      const field = current[key]
      if (typeof field === 'object' && field !== null && 'source' in field) {
        return { ...current, [key]: { value, source: 'manual' } }
      }
      return { ...current, [key]: value }
    })

  return {
    draft,
    state,
    setField,
    // Подстановка целиком: после распознавания приходит не одно поле, а вся шапка сразу,
    // и склеивать её по полю значило бы шесть рендеров вместо одного.
    applyDraft: (next: Draft) => setDraft(next),
    setShowPhone: (showPhone: boolean) => setDraft((current) => ({ ...current, showPhone })),
    addPhoto: () => setDraft((current) => ({ ...current, photosCount: current.photosCount + 1 })),
    goStep: (step: StepId) => setState((current) => ({ ...current, step })),
    goStage: (stage: DocumentStage) => setState((current) => ({ ...current, stage })),
    goNext: () => setState((current) => ({ ...current, step: nextStep(current.step) })),
    goBack: () => setState((current) => ({ ...current, step: previousStep(current.step) })),
    submit: () => setState((current) => ({ ...current, submitted: true })),
  }
}
