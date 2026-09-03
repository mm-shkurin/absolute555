// Ответы заглушки на изменяющие запросы, разложенные по адресам.
//
// Отдельно от чтения: PUT и DELETE меняют то, что следующий GET прочитает, и общий
// `{ok:true}` вернул бы экрану успех без данных — панель осталась бы серой, а статус
// профиля разошёлся бы с кнопками.
import { accessChanged } from './fixtures/admin'
import { mutation } from './fixtures/mutations'
import { editMyProfile, publicProfile, submitMyProfile } from './fixtures/supplier'
import { addRequest, closeRequest, putRequestResponse } from './fixtures/requests'
import { eraseMeasurement, thicknessMap, writeMeasurement } from './fixtures/thickness'
import type { BodyPanel } from '../shared/api/backend/thicknessContract'

export function mutate(path: string, method: string, payload?: BodyInit | null): unknown {
  // Профиль поставщика в заглушке живой: правка и отправка меняют то, что экран
  // прочитает следующим запросом, иначе статус разошёлся бы с кнопками.
  if (path === '/supplier/me') return editMyProfile(jsonOf(payload))
  if (path === '/supplier/me/submit') return submitMyProfile()
  if (path === '/request') return addRequest(jsonOf(payload))
  const closed = /^\/request\/([^/]+)\/close$/.exec(path)
  if (closed) return closeRequest(closed[1])
  const responded = /^\/request\/([^/]+)\/response$/.exec(path)
  if (responded) return putRequestResponse(responded[1], jsonOf(payload))
  const approved = /^\/moderation\/suppliers\/([^/]+)\/approve$/.exec(path)
  if (approved) return { ...publicProfile(approved[1]), status: 'published' }
  const rejected = /^\/moderation\/suppliers\/([^/]+)\/reject$/.exec(path)
  if (rejected) return { ...publicProfile(rejected[1]), status: 'rejected' }

  // Заглушка отвечает и на блокировку: общий `{ok:true}` вернул бы карточке ответ без
  // признака доступа, и экран показал бы прежнее состояние как новое.
  const blocked = /^\/role\/users\/([^/]+)\/block$/.exec(path)
  if (blocked) return accessChanged(blocked[1], true, reasonOf(payload))
  const unblocked = /^\/role\/users\/([^/]+)\/unblock$/.exec(path)
  if (unblocked) return accessChanged(unblocked[1], false, reasonOf(payload))

  const panelPath = /^\/sale_car\/([^/]+)\/thickness\/([^/]+)$/.exec(path)
  if (panelPath) {
    const [, saleCarId, panel] = panelPath
    if (method === 'DELETE') eraseMeasurement(saleCarId, panel as BodyPanel)
    else writeMeasurement(saleCarId, panel as BodyPanel, valueOf(payload))
    return thicknessMap(saleCarId)
  }
  return mutation(path)
}

function reasonOf(payload?: BodyInit | null): string {
  const reason = jsonOf(payload).reason
  return typeof reason === 'string' ? reason : ''
}

function jsonOf(payload?: BodyInit | null): Record<string, unknown> {
  if (typeof payload !== 'string') return {}
  try {
    return JSON.parse(payload) as Record<string, unknown>
  } catch {
    return {}
  }
}

function valueOf(payload?: BodyInit | null): number {
  const sent = payload instanceof FormData ? payload.get('value_um') : null
  const parsed = Number(sent ?? '')
  // Пустое поле — история 15: число читает сервер. Заглушка читать не умеет и кладёт
  // заведомо заводское значение, чтобы экран не остался без ответа.
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 120
}

