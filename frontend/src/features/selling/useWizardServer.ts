// Связка мастера с сервером: черновик, снимок СТС, галерея, отправка.
//
// Отдельно от страницы, потому что страница — это разметка шести шагов, а здесь весь
// разговор с сервером: когда завести черновик, когда дослать правку, что делать с исходом
// распознавания и чем кончается отправка. Вместе они не помещались ни в голове, ни в
// двухсотстрочный предел.
import { useCallback, useEffect, useRef, useState } from 'react'
import { changeStatus } from '../../shared/api/backend/saleCarApi'
import type { Draft } from './logic/draft'
import { stageFor } from './logic/recognition'
import { submitFailureText } from './logic/submitFailure'
import type { ListingKind } from '../../shared/api/backend/saleCarContract'
import { useDraftSync } from './useDraftSync'
import { useGallery, type Gallery } from './useGallery'
import { useLatest } from './useLatest'
import { useStsRecognition } from './useStsRecognition'
import { resumeStep, type DocumentStage, type StepId } from '../../shared/domain/wizardSteps'

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
  const wizardRef = useLatest(wizard)
  const syncRef = useLatest(sync)
  const galleryRef = useLatest(gallery)
  const recognitionRef = useLatest(recognition)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // Открытый по ссылке черновик подтягивается целиком: поля, их происхождение и снимки.
  // Без этого «Продолжить» открывало бы пустой мастер поверх уже начатого объявления.
  // Загрузка делается один раз на открытие: дальше состоянием владеет мастер.
  useEffect(() => {
    if (!existingId) return
    let cancelled = false
    void syncRef.current.reload().then((loaded) => {
      if (cancelled || !loaded) return
      wizardRef.current.applyDraft(loaded)
      wizardRef.current.goStep(resumeStep(loaded))
    })
    return () => {
      cancelled = true
    }
  }, [existingId, syncRef, wizardRef])

  // Галерея — отдельно и после того, как id черновика дошёл до неё: в первом заходе он ещё
  // не выставлен, запрос молча не уходил, и «Отправка» показывала «0 из 15» при шести фото.
  useEffect(() => {
    if (existingId && sync.saleCarId) void galleryRef.current.refresh()
  }, [existingId, sync.saleCarId, galleryRef])

  useEffect(() => {
    const outcome = recognition.outcome
    if (!outcome) return
    if (outcome !== 'done') {
      wizardRef.current.goStage(stageFor(outcome))
      return
    }
    // Распознанное перечитывается из объявления целиком: там же лежит и происхождение
    // каждого поля, а без него подставленные значения неотличимы от введённых.
    let cancelled = false
    void syncRef.current.reload().then((loaded) => {
      if (cancelled) return
      if (loaded) wizardRef.current.applyDraft(loaded)
      wizardRef.current.goStage(stageFor('done'))
      wizardRef.current.goStep('specs')
    })
    return () => {
      cancelled = true
    }
  }, [recognition.outcome, syncRef, wizardRef])

  // Запрос не приняли — черновика на сервере нет или сеть отказала. Мастер возвращается
  // на тот экран, с которого распознавание запускали: «распознаём» без запроса крутилось
  // бы вечно.
  const startRecognition = useCallback(
    (send: () => Promise<boolean>, fallback: DocumentStage) => {
      wizardRef.current.goStage('recognizing')
      recognitionRef.current.reset()
      void send().then((accepted) => {
        if (!accepted && mounted.current) wizardRef.current.goStage(fallback)
      })
    },
    [wizardRef, recognitionRef],
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
    if (!mounted.current) return
    if (!sync.saleCarId) {
      setSubmitError('Черновик не сохранён на сервере. Проверьте связь и попробуйте ещё раз.')
      return
    }
    try {
      await changeStatus(sync.saleCarId, 'submit')
    } catch (failure) {
      if (!mounted.current) return
      // Отказ «не хватает полей» называет их поимённо: общий текст отправил бы продавца
      // перечитывать шесть шагов подряд.
      setSubmitError(submitFailureText(failure))
      return
    }
    if (mounted.current) wizard.submit()
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
