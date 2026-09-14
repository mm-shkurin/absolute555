// Пятый шаг: карта замеров. Единственный необязательный шаг мастера, и он честно назван
// необязательным — иначе продавец без прибора бросает объявление на середине.
import { Button } from '../../../shared/ui/Button'
import { ThicknessTiles } from './ThicknessTiles'
import { WizardCard } from './WizardCard'
import { WizardNav } from './WizardNav'

export interface StepThicknessProps {
  onBack: () => void
  onSkip: () => void
  onFill: () => void
}

export function StepThickness({ onBack, onSkip, onFill }: StepThicknessProps) {
  return (
    <WizardCard
      testId="step-thickness"
      title="Карта замеров — необязательно"
      sub="Шаг можно пропустить, объявление всё равно опубликуется. Но с полной картой оно получает бейдж и поднимается выше в ленте — это единственный способ попасть наверх."
      nav={
        <WizardNav onBack={onBack}>
          <Button tone="ghost" onClick={onSkip} data-testid="thickness-skip">
            Пропустить
          </Button>
          <Button onClick={onFill}>Заполнить карту</Button>
        </WizardNav>
      }
    >
      <ThicknessTiles />
    </WizardCard>
  )
}
