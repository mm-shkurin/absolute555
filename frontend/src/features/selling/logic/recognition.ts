// Исход распознавания СТС, собранный из двух источников: событий потока и поля `autofill`
// в выдаче объявления. Источника два, потому что поток можно не застать — вкладку
// закрыли, связь оборвалась, — и тогда исход читается из объявления при возврате.
import type { AutofillState } from '../../../shared/api/backend/saleCarContract'
import type { TaskStatus } from '../../../shared/api/backend/listingStream'
import type { DocumentStage } from './wizardSteps'

// Два отказа разведены намеренно: «не разобрали снимок» лечится новой фотографией,
// «VIN прочитан, но машина не нашлась» — только ручным вводом. Общее «ошибка» отправило бы
// половину продавцов переснимать документ, который снят хорошо.
const BY_STATUS: Record<string, AutofillState> = {
  Pending: 'pending',
  Started: 'pending',
  OcrStarted: 'pending',
  OcrSuccess: 'pending',
  OcrFailed: 'unreadable',
  DecodeStarted: 'pending',
  DecodeProcessing: 'pending',
  DecodeSuccess: 'done',
  DecodeFailed: 'undecoded',
}

export function outcomeOf(status: TaskStatus | string | undefined): AutofillState | null {
  if (!status) return null
  return BY_STATUS[status] ?? null
}

const STAGE: Record<AutofillState, DocumentStage> = {
  none: 'await',
  pending: 'recognizing',
  unreadable: 'unreadable',
  // Прочитанный VIN, по которому не нашлась машина, — это ручной ввод: подставлять нечего.
  undecoded: 'novin',
  // Удачное распознавание НЕ переводит шаг в ручной ввод: на характеристиках подставленные
  // поля должны быть помечены как распознанные, а вид «заполняю сам» эту пометку прячет.
  done: 'await',
}

/** Куда встаёт мастер, когда исход известен. `done` уводит на характеристики, поэтому
 *  стадия первого шага для него уже не важна — её выбирает вызывающий вместе с шагом. */
export function stageFor(state: AutofillState): DocumentStage {
  return STAGE[state]
}

export function isFinal(state: AutofillState): boolean {
  return state === 'done' || state === 'unreadable' || state === 'undecoded'
}
