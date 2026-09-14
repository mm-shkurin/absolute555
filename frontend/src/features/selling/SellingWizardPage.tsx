// Мастер продажи: шесть шагов от фотографии СТС до отправки на модерацию.
//
// Черновик живёт в состоянии страницы, а не в форме шага: человек ходит по шагам вперёд и
// назад, и поле, размонтированное вместе со своим шагом, унесло бы значение с собой.
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { ROUTES } from '../../shared/navigation/routes'
import { StepNav } from './components/StepNav'
import { StepSent } from './components/StepSent'
import { WizardSteps } from './components/WizardSteps'
import { useSellingWizard } from './useSellingWizard'
import styles from './selling.module.css'

export interface SellingWizardPageProps {
  onSignIn?: () => void
}

export function SellingWizardPage({ onSignIn }: SellingWizardPageProps) {
  const ctx = useSellingWizard()
  const { state, goStep } = ctx.wizard
  return (
    <>
      <SiteHeader signedIn onSignIn={onSignIn} />
      <main data-testid="selling">
        <Container>
          {state.submitted ? null : (
            <div className={styles.crumbs}>
              <span>Новое объявление</span>
              <span className={styles.spacer} />
              <span>Черновик сохраняется автоматически</span>
            </div>
          )}
          <div className={styles.layout}>
            <StepNav current={state.step} onGo={goStep} />
            {state.submitted ? (
              <StepSent onPreview={() => ctx.navigate(ROUTES.feed)} />
            ) : (
              <WizardSteps ctx={ctx} />
            )}
          </div>
        </Container>
      </main>
    </>
  )
}
