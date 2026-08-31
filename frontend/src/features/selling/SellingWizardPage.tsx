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
import { useDraftSync } from './useDraftSync'
import { useStsRecognition } from './useStsRecognition'
import { useGallery } from './useGallery'
import { submitDraft } from './api/draftApi'
import { stageFor } from './logic/recognition'
import { useEffect, useState } from 'react'
import styles from './selling.module.css'

export function SellingWizardPage({ onSignIn }: { onSignIn?: () => void }) {
  const navigate = useNavigate()
  const wizard = useDraftState()
  const { draft, state } = wizard
  // Черновик заводится на сервере при входе в мастер и досылается при каждом переходе
  // между шагами: шаг — это законченная порция ввода, и сохранять чаще значит слать
  // запрос на каждое нажатие клавиши.
  const { saleCarId } = useParams()
  const sync = useDraftSync(true, saleCarId)
  const goNext = () => {
    void sync.save(draft)
    wizard.goNext()
  }

  // Отправка на модерацию: сначала досылается последняя правка, иначе на проверку уедет
  // объявление без того, что человек дописал на шаге сводки.
  //
  // Отказ сервера показывается текстом и НЕ переводит мастер на экран «отправлено»: чего
  // именно не хватает, знает сервер, и молча объявить успех значит соврать продавцу.
  const [submitError, setSubmitError] = useState<string | null>(null)
  const submit = async () => {
    setSubmitError(null)
    await sync.save(draft)
    if (!sync.saleCarId) {
      setSubmitError('Черновик не сохранён на сервере. Проверьте связь и попробуйте ещё раз.')
      return
    }
    try {
      await submitDraft(sync.saleCarId)
    } catch (failure) {
      setSubmitError(failure instanceof Error ? failure.message : 'Не удалось отправить.')
      return
    }
    wizard.submit()
  }

  // Поток слушается только пока идёт распознавание: держать соединение открытым на
  // остальных шагах незачем, а сервер шлёт по нему пульс каждые тридцать секунд.
  const recognition = useStsRecognition(sync.saleCarId, state.stage === 'recognizing')
  const gallery = useGallery(sync.saleCarId)

  // Открытый по ссылке черновик подтягивается целиком: поля, их происхождение и снимки.
  // Без этого «Продолжить» открывало бы пустой мастер поверх уже начатого объявления.
  useEffect(() => {
    if (!saleCarId) return
    void sync.reload().then((loaded) => {
      if (loaded) wizard.applyDraft(loaded)
    })
    void gallery.refresh()
    // Загрузка делается один раз на открытие: дальше состоянием владеет мастер.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleCarId])
  // Число фотографий — это то, что лежит на сервере, а не счётчик нажатий: сводка перед
  // отправкой обязана совпадать с тем, что увидит модератор.
  const review = { ...draft, photosCount: gallery.photos.length }

  useEffect(() => {
    if (!recognition.outcome) return
    if (recognition.outcome === 'done') {
      // Распознанное перечитывается из объявления целиком: там же лежит и происхождение
      // каждого поля, а без него подставленные значения неотличимы от введённых.
      void sync.reload().then((loaded) => {
        if (loaded) wizard.applyDraft(loaded)
        wizard.goStage('manual')
        wizard.goStep('specs')
      })
      return
    }
    wizard.goStage(stageFor(recognition.outcome))
    // Хук возвращает шаги мастера, и они не меняются между рендерами.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recognition.outcome])

  const documentHandlers = {
    onPick: (file: File) => {
      wizard.goStage('recognizing')
      recognition.reset()
      void sync.attachDocument(file).then((accepted) => {
        // Снимок не приняли — черновика на сервере нет или сеть отказала. Возвращаем на
        // выбор файла: «распознаём» без загрузки крутилось бы вечно.
        if (!accepted) wizard.goStage('await')
      })
    },
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
                  photos={gallery.photos}
                  limit={gallery.limit}
                  busy={gallery.busy}
                  error={gallery.error}
                  onAdd={(files) => void gallery.add(files)}
                  onRemove={(photoId) => void gallery.remove(photoId)}
                  onBack={wizard.goBack}
                  onNext={goNext}
                />
              ) : null}
              {state.step === 'thickness' ? (
                <StepThickness onBack={wizard.goBack} onSkip={goNext} onFill={goNext} />
              ) : null}
              {state.step === 'review' ? (
                <StepReview
                  draft={review}
                  error={submitError}
                  onBack={wizard.goBack}
                  onSaveDraft={() => navigate(ROUTES.myListings)}
                  onSubmit={() => void submit()}
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
