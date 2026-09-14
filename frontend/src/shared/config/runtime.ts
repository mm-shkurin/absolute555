// Значения, которыми владеет развёртывание, а не код. Читаются из `VITE_*` один раз:
// чтение по месту означает, что одна и та же величина в двух модулях может разойтись.

function positiveNumber(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

// Сколько ждём ответа бэкенда, прежде чем считать запрос повисшим.
export const REQUEST_TIMEOUT_MS = positiveNumber(import.meta.env.VITE_REQUEST_TIMEOUT_MS, 30_000)

// Сколько держим SSE-подписку на распознавание, если сервер молчит. Распознавание СТС
// занимает десятки секунд, поэтому окно заметно шире обычного запроса.
export const RECOGNITION_STREAM_TIMEOUT_MS = positiveNumber(
  import.meta.env.VITE_RECOGNITION_STREAM_TIMEOUT_MS,
  180_000,
)

// Сколько фотографий разрешено в объявлении. Правило продуктовое, но проверяет его и клиент,
// чтобы не отправлять заведомо отказной запрос.
export const MAX_LISTING_PHOTOS = positiveNumber(import.meta.env.VITE_MAX_LISTING_PHOTOS, 15)

// Одноразовый код провайдера длиннее этого — не код, а мусор в адресной строке.
export const MAX_OAUTH_CODE_LENGTH = positiveNumber(import.meta.env.VITE_MAX_OAUTH_CODE_LENGTH, 512)

// Длина текста отзыва: клиент не даёт набрать больше, чем примет сервер.
export const MAX_REVIEW_TEXT_LENGTH = positiveNumber(
  import.meta.env.VITE_MAX_REVIEW_TEXT_LENGTH,
  2000,
)
