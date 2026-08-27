// Единственное место, знающее URL-пространство сервера.
//
// Только пути. Всё про то, КАК отправляется запрос — заголовки, обновление сессии, форма
// ошибки — принадлежит `httpClient` и `send`; здесь карта, а не клиент.
//
// Собрано из сегментов, а не написано одним литералом: версия — часть опубликованного
// контракта в `ProductSpecification/api-specs/` и двигается вместе с ним. Меняющиеся
// сегменты сделаны функциями, чтобы вызывающий не забыл про кодирование.
const MOUNT = 'api'
export const API_VERSION = 'v1'

const V1 = `/${MOUNT}/${API_VERSION}`

export const API = {
  auth: {
    // Пароля нет: вход только через Яндекс ID и VK ID — UserFlows, поток 1.
    oauthStart: (provider: string) => `${V1}/auth/oauth/${encodeURIComponent(provider)}/start`,
    oauthExchange: `${V1}/auth/oauth/exchange`,
    refresh: `${V1}/auth/refresh`,
    me: `${V1}/auth/me`,
  },
  listings: {
    collection: `${V1}/listings`,
    one: (id: string) => `${V1}/listings/${encodeURIComponent(id)}`,
    photos: (id: string) => `${V1}/listings/${encodeURIComponent(id)}/photos`,
    submit: (id: string) => `${V1}/listings/${encodeURIComponent(id)}/submit`,
    complaints: (id: string) => `${V1}/listings/${encodeURIComponent(id)}/complaints`,
  },
  // Распознавание СТС и экрана толщиномера: запуск задачи и поток её прогресса.
  recognition: {
    vehicleDocument: `${V1}/recognition/vehicle-document`,
    gauge: `${V1}/recognition/gauge`,
    stream: (jobId: string) => `${V1}/recognition/${encodeURIComponent(jobId)}/stream`,
  },
  thickness: {
    map: (listingId: string) => `${V1}/listings/${encodeURIComponent(listingId)}/thickness`,
    panel: (listingId: string, panel: string) =>
      `${V1}/listings/${encodeURIComponent(listingId)}/thickness/${encodeURIComponent(panel)}`,
  },
  offers: {
    collection: `${V1}/offers`,
    one: (id: string) => `${V1}/offers/${encodeURIComponent(id)}`,
    accept: (id: string) => `${V1}/offers/${encodeURIComponent(id)}/accept`,
    reject: (id: string) => `${V1}/offers/${encodeURIComponent(id)}/reject`,
    withdraw: (id: string) => `${V1}/offers/${encodeURIComponent(id)}/withdraw`,
  },
  chats: {
    collection: `${V1}/chats`,
    messages: (chatId: string) => `${V1}/chats/${encodeURIComponent(chatId)}/messages`,
    stream: (chatId: string) => `${V1}/chats/${encodeURIComponent(chatId)}/stream`,
  },
  reviews: {
    collection: `${V1}/reviews`,
    ofSeller: (userId: string) => `${V1}/users/${encodeURIComponent(userId)}/reviews`,
  },
  // Справочник марок и моделей: выбор марки сужает модели — UserFlows, поток 4.
  reference: {
    brands: `${V1}/reference/brands`,
    models: (brandId: string) => `${V1}/reference/brands/${encodeURIComponent(brandId)}/models`,
  },
  importing: {
    suppliers: `${V1}/suppliers`,
    supplier: (id: string) => `${V1}/suppliers/${encodeURIComponent(id)}`,
    applications: `${V1}/supplier-applications`,
    requests: `${V1}/import-requests`,
    request: (id: string) => `${V1}/import-requests/${encodeURIComponent(id)}`,
    responses: (id: string) => `${V1}/import-requests/${encodeURIComponent(id)}/responses`,
  },
  moderation: {
    queue: `${V1}/moderation/listings`,
    publish: (id: string) => `${V1}/moderation/listings/${encodeURIComponent(id)}/publish`,
    reject: (id: string) => `${V1}/moderation/listings/${encodeURIComponent(id)}/reject`,
    complaints: `${V1}/moderation/complaints`,
    roleApplications: `${V1}/moderation/supplier-applications`,
  },
} as const
