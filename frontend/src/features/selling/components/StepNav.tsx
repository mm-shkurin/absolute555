// Лестница шагов. Кликабельна назад и вперёд: черновик сохраняется на каждом шаге, и
// запрет прыгать вперёд заставлял бы проходить мастер заново ради одной правки.
import { STEP_IDS, isPassed, stepIndex, type StepId } from '../../../shared/domain/wizardSteps'
import { STEP_TITLE } from '../logic/stepTitles'
import styles from '../selling.module.css'

export function StepNav({ current, onGo }: { current: StepId; onGo: (step: StepId) => void }) {
  return (
    <nav className={styles.steps} data-testid="wizard-steps">
      {STEP_IDS.map((step, index) => (
        <button
          key={step}
          type="button"
          className={[
            styles.step,
            step === current ? styles.current : '',
            isPassed(step, current) ? styles.passed : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onGo(step)}
          aria-current={step === current}
        >
          <span className={styles.stepNumber}>{index + 1}</span>
          <span className={styles.stepTitle}>{STEP_TITLE[step]}</span>
        </button>
      ))}
    </nav>
  )
}

export function stepNumber(step: StepId): number {
  return stepIndex(step) + 1
}
