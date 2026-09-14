// Разбор того, что продавец ввёл в форму замера, до отправки.
//
// Проверка здесь не заменяет серверную, а спасает от круга по сети ради опечатки:
// границы 1..3000 записаны в контракте, за ними сервер отвечает 422.
import { VALUE_UM_MAX, VALUE_UM_MIN } from '../../../shared/api/backend/thicknessContract'

export type FormCheck =
  { ok: true; valueUm: number | null; photo: File } | { ok: false; reason: string }

export function checkMeasurement(value: string, photo: File | null): FormCheck {
  if (!photo) return { ok: false, reason: 'Нужна фотография экрана прибора.' }
  const trimmed = value.trim()
  // Пустое поле — законный случай: число тогда читает сервер со снимка прибора, и
  // отказ приходит кодом OCR_UNREADABLE, а не молчанием.
  if (trimmed === '') return { ok: true, valueUm: null, photo }
  // Приборы показывают десятые (97.3): число принимается с точкой или запятой и
  // округляется до целых мкм — так его хранит карта.
  if (!/^\d+([.,]\d{1,2})?$/.test(trimmed))
    return { ok: false, reason: 'Только число, без знаков.' }
  const valueUm = Math.round(Number(trimmed.replace(',', '.')))
  if (valueUm < VALUE_UM_MIN || valueUm > VALUE_UM_MAX) {
    return { ok: false, reason: `Прибор показывает от ${VALUE_UM_MIN} до ${VALUE_UM_MAX} мкм.` }
  }
  return { ok: true, valueUm, photo }
}
