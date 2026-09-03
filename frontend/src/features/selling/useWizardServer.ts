// Связка мастера с сервером: черновик, снимок СТС, галерея, отправка.
//
// Отдельно от страницы, потому что страница — это разметка шести шагов, а здесь весь
// разговор с сервером: когда завести черновик, когда дослать правку, что делать с исходом
// распознавания и чем кончается отправка. Вместе они не помещались ни в голове, ни в
// двухсотстрочный предел.
import { useCallback, useEffect, useState } from 'react'
import { submitDraft } from './api/draftApi'
import type { Draft } from './logic/draft'
import { stageFor } from './logic/recognition'
import { submitFailureText } from './logic/submitFailure'
import type { ListingKind } from '../../shared/api/backend/saleCarContract'
import { useDraftSync } from './useDraftSync'
import { useGallery, type Gallery } from './useGallery'
import { useStsRecognition } from './useStsRecognition'
import type { DocumentStage, StepId } from './logic/wizardSteps'

interface WizardHandle {
  draft: Draft
  stage: DocumentStage
  applyDraft: (draft: Draft) => void
  goStage: (stage: DocumentStage) => void
  goStep: (step: StepId) => void
  submit: () => void
}

export interface WizardServer {
  saleCarId: string | null
  gallery: Gallery
  /** Досылает правку и переводит на следующий шаг: шаг — законченная порция ввода, и
   *  сохранять чаще значит слать запрос на каждое нажатие клавиши. */
  saveAnd: (next: () => void) => void
  pickDocument: (file: File) => void
  /** Проверить VIN, вписанный руками, когда снимок прочитан, а VIN в нём — нет. */
  checkVin: (vin: string) => void
  submitForReview: () => Promise<void>
  submitError: string | null
}

export function useWizardServer(
  wizard: WizardHandle,
  existingId?: string,
  kind?: ListingKind,
): WizardServer {
  const sync = useDraftSync(true, existingId, kind)
  const gallery = useGallery(sync.saleCarId)
  // Поток слушается только пока идёт распознавание: держать соединение открытым на
  // остальных шагах незачем, а сервер шлёт по нему пульс каждые тридцать секунд.
  const recognition = useStsRecognition(sync.saleCarId, wizard.stage === 'recognizing')
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Открытый по ссылке черновик подтягивается целиком: поля, их происхождение и снимки.
  // Без этого «Продолжить» открывало бы пустой мастер поверх уже начатого объявления.
  useEffect(() => {
    if (!existingId) return
    void sync.reload().then((loaded) => {
      if (loaded) wizard.applyDraft(loaded)
    })
    void gallery.refresh()
    // Загрузка делается один раз на открытие: дальше состоянием владеет мастер.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingId])

  useEffect(() => {
    if (!recognition.outcome) return
    if (recognition.outcome === 'done') {
      // Распознанное перечитывается из объявления целиком: там же лежит и происхождение
      // каждого поля, а без него подставленные значения неотличимы от введённых.
      void sync.reload().then((loaded) => {
        if (loaded) wizard.applyDraft(loaded)
        wizard.goStage(stageFor('done'))
        wizard.goStep('specs')
      })
      return
    }
    wizard.goStage(stageFor(recognition.outcome))
    // Хук возвращает шаги мастера, и они не меняются между рендерами.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recognition.outcome])

  // Запрос не приняли — черновика на сервере нет или сеть отказала. Мастер возвращается
  // на тот экран, с которого распознавание запускали: «распознаём» без запроса крутилось
  // бы вечно.
  const startRecognition = useCallback(
    (send: () => Promise<boolean>, fallback: DocumentStage) => {
      wizard.goStage('recognizing')
      recognition.reset()
      void send().then((accepted) => {
        if (!accepted) wizard.goStage(fallback)
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recognition],
  )

  const pickDocument = useCallback(
    (file: File) => startRecognition(() => sync.attachDocument(file), 'await'),
    [startRecognition, sync],
  )

  const checkVin = useCallback(
    (vin: string) => startRecognition(() => sync.decodeByVin(vin), 'novin'),
    [startRecognition, sync],
  )

  // Отказ сервера показывается текстом и НЕ переводит мастер на экран «отправлено»: чего
  // именно не хватает, знает сервер, и молча объявить успех значит соврать продавцу.
  const submitForReview = async () => {
    setSubmitError(null)
    await sync.save(wizard.draft)
    if (!sync.saleCarId) {
      setSubmitError('Черновик не сохранён на сервере. Проверьте связь и попробуйте ещё раз.')
      return
    }
    try {
      await submitDraft(sync.saleCarId)
    } catch (failure) {
      // Отказ «не хватает полей» называет их поимённо: общий текст отправил бы продавца
      // перечитывать шесть шагов подряд.
      setSubmitError(submitFailureText(failure))
      return
    }
    wizard.submit()
  }

  return {
    saleCarId: sync.saleCarId,
    gallery,
    saveAnd: (next) => {
      void sync.save(wizard.draft)
      next()
    },
    pickDocument,
    checkVin,
    submitForReview,
    submitError,
  }
}
