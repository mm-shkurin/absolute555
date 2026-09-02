// Мастер продажи: шесть шагов от фотографии СТС до отправки на модерацию.
//
// Черновик живёт в состоянии страницы, а не в форме шага: человек ходит по шагам вперёд и
// назад, и поле, размонтированное вместе со своим шагом, унесло бы значение с собой.
import { useNavigate, useParams } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { ROUTES } from '../../shared/navigation/routes'
import { StepNav } from './components/StepNav'
import { StepDocument } from './components/StepDocument'
import { StepSpecs } from './components/StepSpecs'
import { StepPricing } from './components/StepPricing'
import { StepPhotos } from './components/StepPhotos'
import { StepThickness } from './components/StepThickness'
import { StepReview } from './components/StepReview'
import { StepSent } from './components/StepSent'
import { useDraftState } from './useDraftState'
import { useWizardServer } from './useWizardServer'
import styles from './selling.module.css'

export function SellingWizardPage({ onSignIn }: { onSignIn?: () => void }) {
  const navigate = useNavigate()
  const wizard = useDraftState()
  const { draft, state } = wizard
  const { saleCarId } = useParams()
  // Весь разговор с сервером — в одном хуке: страница остаётся разметкой шести шагов.
  const server = useWizardServer({ ...wizard, stage: state.stage }, saleCarId)
  const goNext = () => server.saveAnd(wizard.goNext)
  // Число фотографий — это то, что лежит на сервере, а не счётчик нажатий: сводка перед
  // отправкой обязана совпадать с тем, что увидит модератор.
  const review = { ...draft, photosCount: server.gallery.photos.length }

  const documentHandlers = {
    onPick: server.pickDocument,
    onManual: () => {
      wizard.goStage('manual')
      wizard.goStep('specs')
    },
    onRetake: () => wizard.goStage('await'),
    onCancel: () => wizard.goStage('await'),
    onDone: () => wizard.goStep('specs'),
  }

  if (state.submitted) {
    return (
      <>
        <SiteHeader signedIn onSignIn={onSignIn} />
        <main data-testid="selling">
          <Container>
            <div className={styles.layout}>
              <StepNav current={state.step} onGo={wizard.goStep} />
              <StepSent onPreview={() => navigate(ROUTES.feed)} />
            </div>
          </Container>
        </main>
      </>
    )
  }

  return (
    <>
      <SiteHeader signedIn onSignIn={onSignIn} />
      <main data-testid="selling">
        <Container>
          <div className={styles.crumbs}>
            <span>Новое объявление</span>
            <span className={styles.spacer} />
            <span>Черновик сохраняется автоматически</span>
          </div>
          <div className={styles.layout}>
            <StepNav current={state.step} onGo={wizard.goStep} />
            <div>
              {state.step === 'document' ? (
                <StepDocument
                  stage={state.stage}
                  vin={draft.vin.value}
                  onVin={(value) => wizard.setField('vin', value)}
                  handlers={documentHandlers}
                />
              ) : null}
              {state.step === 'specs' ? (
                <StepSpecs
                  draft={draft}
                  manual={state.stage === 'manual'}
                  onField={wizard.setField}
                  onBack={wizard.goBack}
                  onNext={goNext}
                />
              ) : null}
              {state.step === 'pricing' ? (
                <StepPricing
                  draft={draft}
                  onField={wizard.setField}
                  onShowPhone={wizard.setShowPhone}
                  onBack={wizard.goBack}
                  onNext={goNext}
                />
              ) : null}
              {state.step === 'photos' ? (
                <StepPhotos
                  photos={server.gallery.photos}
                  limit={server.gallery.limit}
                  busy={server.gallery.busy}
                  error={server.gallery.error}
                  onAdd={(files) => void server.gallery.add(files)}
                  onRemove={(photoId) => void server.gallery.remove(photoId)}
                  onBack={wizard.goBack}
                  onNext={goNext}
                />
              ) : null}
              {state.step === 'thickness' ? (
                <StepThickness
                  onBack={wizard.goBack}
                  onSkip={goNext}
                  // Заполнять нечего, пока черновик не заведён на сервере: замер
                  // кладётся по адресу объявления, и без него шаг просто идёт дальше.
                  onFill={() =>
                    saleCarId ? navigate(ROUTES.sellingThickness(saleCarId)) : goNext()
                  }
                />
              ) : null}
              {state.step === 'review' ? (
                <StepReview
                  draft={review}
                  error={server.submitError}
                  onBack={wizard.goBack}
                  onSaveDraft={() => navigate(ROUTES.myListings)}
                  onSubmit={() => void server.submitForReview()}
                  onFillThickness={() => wizard.goStep('thickness')}
                />
              ) : null}
            </div>
          </div>
        </Container>
      </main>
    </>
  )
}
