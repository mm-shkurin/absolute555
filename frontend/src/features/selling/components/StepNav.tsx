// Лестница шагов. Кликабельна назад и вперёд: черновик сохраняется на каждом шаге, и
// запрет прыгать вперёд заставлял бы проходить мастер заново ради одной правки.
import { STEPS, isPassed, stepIndex, type StepId } from '../logic/wizardSteps'
import styles from '../selling.module.css'

export function StepNav({ current, onGo }: { current: StepId; onGo: (step: StepId) => void }) {
  return (
    <nav className={styles.steps} data-testid="wizard-steps">
      {STEPS.map((step, index) => (
        <button
          key={step.id}
          type="button"
          className={[
            styles.step,
            step.id === current ? styles.current : '',
            isPassed(step.id, current) ? styles.passed : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onGo(step.id)}
          aria-current={step.id === current}
        >
          <span className={styles.stepNumber}>{index + 1}</span>
          <span className={styles.stepTitle}>{step.title}</span>
        </button>
      ))}
    </nav>
  )
}

export function stepNumber(step: StepId): number {
  return stepIndex(step) + 1
}
