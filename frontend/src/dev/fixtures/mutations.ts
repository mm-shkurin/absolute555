// Ответы заглушки на изменяющие запросы.
//
// Отдельно от чтения: общий `{ok:true}` однажды уже вернул мастеру черновик без
// идентификатора, и тот откатывался на выбор файла — сценарий падал на шаге, который ни
// при чём. Здесь видно, какие мутации отвечают по-настоящему, а какие ещё нет.
import { saleCar } from './wire'

const REVIEW_OF_OFFER = /^\/offer\/([^/]+)\/review$/
const REVIEW = /^\/review\/([^/]+)$/
const REVEAL_PHONE = /^\/sale_car\/([^/]+)\/reveal-phone$/
const STS = /^\/sale_car\/([^/]+)\/sts$/
const VIN = /^\/sale_car\/([^/]+)\/decode-vin$/
const ONE = /^\/sale_car\/([^/]+)$/

export function mutation(path: string): unknown {
  if (path === '/sale_car') return saleCar('l1')

  // Телефон отвечает номером, а не общим успехом: экран рисует то, что пришло, и на
  // `{ok:true}` показал бы пустое место вместо номера.
  if (REVEAL_PHONE.test(path)) return { phone_number: '+7 913 776-04-21' }

  // Снимок и вписанный VIN — два входа в одно распознавание, и отвечают они одинаково:
  // принято, читаем. Исход экран дочитывает из объявления.
  const recognizing = STS.exec(path)?.[1] ?? VIN.exec(path)?.[1]
  if (recognizing) {
    return {
      sale_car_id: recognizing,
      autofill: { state: 'pending', brand_source: null, model_source: null, updated_at: null },
    }
  }

  // Отзыв отвечает написанным отзывом, а не `{ok:true}`: экран читает `review_id`, чтобы
  // следующее нажатие вело в правку, а не во второе написание.
  const reviewedOffer = REVIEW_OF_OFFER.exec(path)?.[1]
  if (reviewedOffer) return review(`rv-${reviewedOffer}`, reviewedOffer)

  const editedReview = REVIEW.exec(path)?.[1]
  if (editedReview) return review(editedReview, 'o1')

  const patched = ONE.exec(path)?.[1]
  if (patched) return saleCar(patched)

  // Остальные кнопки, дошедшие до сети, не должны падать посреди клика.
  return { ok: true }
}

function review(reviewId: string, offerId: string) {
  const now = new Date()
  return {
    review_id: reviewId,
    offer_id: offerId,
    sale_car_id: 'l1',
    seller_id: 'u2',
    author: { user_id: 'u1', name: 'Вы', avatar_url: null },
    rating: 5,
    text: null,
    created_at: now.toISOString(),
    updated_at: null,
    // Окно правки — сутки с момента написания.
    editable_until: new Date(now.getTime() + 24 * 3600_000).toISOString(),
  }
}
