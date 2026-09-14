// Второй шаг: проверка того, что подставило распознавание. Подставленные поля подкрашены —
// это весь смысл шага, без пометки он превращается в «нажать дальше не глядя».
import { Button } from '../../../shared/ui/Button'
import type { Draft } from '../logic/draft'
import { Alert } from './Alert'
import { SpecsFields } from './SpecsFields'
import { WizardCard } from './WizardCard'
import { WizardNav } from './WizardNav'

const MANUAL_COPY = {
  testId: 'step-specs-manual',
  title: 'Заполните характеристики сами',
  sub: 'СТС не обязателен. Всё то же самое можно ввести руками — просто дольше.',
}

const RECOGNIZED_COPY = {
  testId: 'step-specs',
  title: 'Проверьте, что распозналось',
  sub: 'Голубым помечены поля, которые заполнило приложение. Перепроверьте их, а остальные впишите сами — ошибка в характеристиках всплывёт при осмотре.',
}

export interface StepSpecsProps {
  draft: Draft
  manual: boolean
  onField: (key: keyof Draft, value: string) => void
  onBack: () => void
  onNext: () => void
}

export function StepSpecs({ draft, manual, onField, onBack, onNext }: StepSpecsProps) {
  return (
    <WizardCard
      {...(manual ? MANUAL_COPY : RECOGNIZED_COPY)}
      nav={
        <WizardNav onBack={onBack}>
          <Button onClick={onNext} data-testid="specs-next">
            Дальше
          </Button>
        </WizardNav>
      }
    >
      <SpecsFields draft={draft} manual={manual} onField={onField} />
      {/* Про расхождение мощности экран не знает: сервер отдаёт одно число, а не два.
          Честный повод сказать о ней ровно один — её не подтянулось вовсе. */}
      {!manual && !draft.enginePower.value ? (
        <Alert tone="warn" spaced>
          Мощность не подтянулась. Впишите её из СТС — без неё объявление хуже находят.
        </Alert>
      ) : null}
    </WizardCard>
  )
}
