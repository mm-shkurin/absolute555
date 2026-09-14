// Ответы заглушки на изменяющие запросы, разложенные по адресам.
//
// Отдельно от чтения: PUT и DELETE меняют то, что следующий GET прочитает, и общий
// `{ok:true}` вернул бы экрану успех без данных — панель осталась бы серой, а статус
// профиля разошёлся бы с кнопками.
import { accessChanged } from './fixtures/admin'
import { dropUserPhoto, renameUser, setUserPhoto } from './fixtures/identity'
import { mutation, review } from './fixtures/mutations'
import {
  dropMyCover,
  editMyProfile,
  publicProfile,
  setMyCover,
  submitMyProfile,
} from './fixtures/supplier'
import { addRequest, closeRequest, putRequestResponse } from './fixtures/requests'
import { eraseMeasurement, thicknessMap, writeMeasurement } from './fixtures/thickness'
import { dialogs } from './fixtures/wireChat'
import type { BodyPanel } from '../shared/api/backend/thicknessContract'

const UNMATCHED = Symbol('unmatched')

type Payload = BodyInit | null | undefined
type RouteGroup = (path: string, method: string, payload: Payload) => unknown

export function mutate(path: string, method: string, payload?: BodyInit | null): unknown {
  for (const group of [identityReply, supplierReply, chatReply, thicknessReply]) {
    const reply = group(path, method, payload)
    if (reply !== UNMATCHED) return reply
  }
  return mutation(path)
}

const identityReply: RouteGroup = (path, method, payload) => {
  // Своё имя и фотография тоже живые: экран перечитывает профиль после правки, и
  // общий `{ok:true}` вернул бы ему прежнее имя как сохранённое.
  if (path === '/user/profile') return renameUser(String(jsonOf(payload).name ?? ''))
  if (path === '/user/avatar') return method === 'DELETE' ? dropUserPhoto() : setUserPhoto()
  // Выход и удаление записи не отвечают телом — как и сервер, 204.
  if (path === '/auth/logout' || path === '/user') return null
  // Заглушка отвечает и на блокировку: общий `{ok:true}` вернул бы карточке ответ без
  // признака доступа, и экран показал бы прежнее состояние как новое.
  const blocked = /^\/role\/users\/([^/]+)\/block$/.exec(path)
  if (blocked) return accessChanged(blocked[1], true, reasonOf(payload))
  const unblocked = /^\/role\/users\/([^/]+)\/unblock$/.exec(path)
  if (unblocked) return accessChanged(unblocked[1], false, reasonOf(payload))
  return UNMATCHED
}

const supplierReply: RouteGroup = (path, method, payload) => {
  // Профиль поставщика в заглушке живой: правка и отправка меняют то, что экран
  // прочитает следующим запросом, иначе статус разошёлся бы с кнопками.
  if (path === '/supplier/me') return editMyProfile(jsonOf(payload))
  if (path === '/supplier/me/submit') return submitMyProfile()
  if (path === '/supplier/me/cover') return method === 'DELETE' ? dropMyCover() : setMyCover()
  if (path === '/request') return addRequest(jsonOf(payload))
  const closed = /^\/request\/([^/]+)\/close$/.exec(path)
  if (closed) return closeRequest(closed[1])
  const responded = /^\/request\/([^/]+)\/response$/.exec(path)
  if (responded) return putRequestResponse(responded[1], jsonOf(payload))
  const approved = /^\/moderation\/suppliers\/([^/]+)\/approve$/.exec(path)
  if (approved) return { ...publicProfile(approved[1]), status: 'published' }
  const rejected = /^\/moderation\/suppliers\/([^/]+)\/reject$/.exec(path)
  if (rejected) return { ...publicProfile(rejected[1]), status: 'rejected' }
  return UNMATCHED
}

const chatReply: RouteGroup = (path) => {
  // Прямая переписка отвечает диалогом: экран уходит в него по dialog_id из ответа, и на
  // `{ok:true}` остался бы на месте, показав отправку как неудачу.
  const direct = /^\/chat\/dialogs\/direct\/([^/]+)$/.exec(path)
  if (direct)
    return { ...dialogs()[0], counterpart: { ...dialogs()[0].counterpart, user_id: direct[1] } }
  const dialogReview = /^\/chat\/dialogs\/([^/]+)\/review$/.exec(path)
  if (dialogReview) return review(`rv-${dialogReview[1]}`, dialogReview[1])
  return UNMATCHED
}

const thicknessReply: RouteGroup = (path, method, payload) => {
  // Раньше этого адреса: панельный шаблон ниже принял бы `read` за имя панели и записал
  // бы замер вместо чтения снимка.
  const gauge = /^\/sale_car\/([^/]+)\/thickness\/read$/.exec(path)
  if (gauge) return { value_um: 180 }
  const panelPath = /^\/sale_car\/([^/]+)\/thickness\/([^/]+)$/.exec(path)
  if (!panelPath) return UNMATCHED
  const [, saleCarId, panel] = panelPath
  if (method === 'DELETE') eraseMeasurement(saleCarId, panel as BodyPanel)
  else writeMeasurement(saleCarId, panel as BodyPanel, valueOf(payload))
  return thicknessMap(saleCarId)
}

function reasonOf(payload: Payload): string {
  const reason = jsonOf(payload).reason
  return typeof reason === 'string' ? reason : ''
}

function jsonOf(payload: Payload): Record<string, unknown> {
  if (typeof payload !== 'string') return {}
  try {
    return JSON.parse(payload) as Record<string, unknown>
  } catch {
    return {}
  }
}

function valueOf(payload: Payload): number {
  const sent = payload instanceof FormData ? payload.get('value_um') : null
  const parsed = Number(sent ?? '')
  // Пустое поле — история 15: число читает сервер. Заглушка читать не умеет и кладёт
  // заведомо заводское значение, чтобы экран не остался без ответа.
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 120
}
