import { ROUTES } from '../../../shared/navigation/routes'
import type { SellingWizard } from '../useSellingWizard'
import { StepDocument } from './StepDocument'
import { StepPhotos } from './StepPhotos'
import { StepPricing } from './StepPricing'
import { StepReview } from './StepReview'
import { StepSpecs } from './StepSpecs'
import { StepThickness } from './StepThickness'

export interface WizardStepProps {
  ctx: SellingWizard
}

export function WizardSteps({ ctx }: WizardStepProps) {
  const { step } = ctx.wizard.state
  return (
    <div>
      {step === 'document' ? <DocumentStep ctx={ctx} /> : null}
      {step === 'specs' ? <SpecsStep ctx={ctx} /> : null}
      {step === 'pricing' ? <PricingStep ctx={ctx} /> : null}
      {step === 'photos' ? <PhotosStep ctx={ctx} /> : null}
      {step === 'thickness' ? <ThicknessStep ctx={ctx} /> : null}
      {step === 'review' ? <ReviewStep ctx={ctx} /> : null}
    </div>
  )
}

function DocumentStep({ ctx: { wizard, server } }: WizardStepProps) {
  const handlers = {
    onPick: server.pickDocument,
    onManual: () => {
      wizard.goStage('manual')
      wizard.goStep('specs')
    },
    onRetake: () => wizard.goStage('await'),
    onCancel: () => wizard.goStage('await'),
    onDone: () => wizard.goStep('specs'),
    onCheckVin: () => server.checkVin(wizard.draft.vin.value),
  }
  return (
    <StepDocument
      stage={wizard.state.stage}
      vin={wizard.draft.vin.value}
      onVin={(value) => wizard.setField('vin', value)}
      handlers={handlers}
    />
  )
}

function SpecsStep({ ctx: { wizard, goNext } }: WizardStepProps) {
  return (
    <StepSpecs
      draft={wizard.draft}
      manual={wizard.state.stage === 'manual'}
      onField={wizard.setField}
      onBack={wizard.goBack}
      onNext={goNext}
    />
  )
}

function PricingStep({ ctx: { wizard, goNext } }: WizardStepProps) {
  return (
    <StepPricing
      draft={wizard.draft}
      onField={wizard.setField}
      onShowPhone={wizard.setShowPhone}
      onBack={wizard.goBack}
      onNext={goNext}
    />
  )
}

function PhotosStep({ ctx: { wizard, server, goNext } }: WizardStepProps) {
  const { gallery } = server
  return (
    <StepPhotos
      photos={gallery.photos}
      limit={gallery.limit}
      busy={gallery.busy}
      error={gallery.error}
      onAdd={(files) => void gallery.add(files)}
      onReorder={(photoIds) => void gallery.reorder(photoIds)}
      onRemove={(photoId) => void gallery.remove(photoId)}
      onBack={wizard.goBack}
      onNext={goNext}
    />
  )
}

function ThicknessStep({ ctx: { wizard, server, goNext, navigate, saleCarId } }: WizardStepProps) {
  // Черновик, начатый с `/sell`, заводится сервером, и его id в адресе нет — берём его у
  // сервера. Без этого кнопка молча шла на следующий шаг.
  const fill = () => {
    const draftId = saleCarId ?? server.saleCarId
    return draftId ? navigate(ROUTES.sellingThickness(draftId)) : goNext()
  }
  return <StepThickness onBack={wizard.goBack} onSkip={goNext} onFill={fill} />
}

// Число фотографий — это то, что лежит на сервере, а не счётчик нажатий: сводка перед
// отправкой обязана совпадать с тем, что увидит модератор.
function ReviewStep({ ctx: { wizard, server, navigate } }: WizardStepProps) {
  return (
    <StepReview
      draft={{ ...wizard.draft, photosCount: server.gallery.photos.length }}
      coverUrl={server.gallery.photos[0]?.preview_url ?? null}
      error={server.submitError}
      onBack={wizard.goBack}
      onSaveDraft={() => navigate(ROUTES.myListings)}
      onSubmit={() => void server.submitForReview()}
      onFillThickness={() => wizard.goStep('thickness')}
    />
  )
}
