// URL-пространство сервера, каким оно есть сегодня.
//
// Отдельно от `../endpoints.ts` намеренно: там карта, нарисованная по спецификации и
// мокапам (`/listings`, `/offers`, `/users/me`), здесь — то, что смонтировано в
// `backend/app/api/__init__.py` и отвечает на запросы. Пока эти две карты не сошлись,
// смешивать их в одном файле значит потерять, какая из них проверяема.
//
// Расхождения и то, чего на сервере ещё нет, перечислены в
// `ProductSpecification/api-specs/backend-contract-map.md`.
import { API_VERSION } from '../endpoints'

const V1 = `/api/${API_VERSION}`

const id = (value: string) => encodeURIComponent(value)

export const BACKEND = {
  auth: {
    // Вход начинается редиректом на start, ответ провайдера приходит на серверный
    // callback, а обратно во фронт приезжает одноразовый код: сессия выдаётся только
    // в ответе на exchange, потому что токен в адресной строке остаётся в истории
    // браузера и в referer.
    yandexStart: `${V1}/auth/oauth/yandex/start`,
    oauthExchange: `${V1}/auth/oauth/exchange`,
    refresh: `${V1}/auth/refresh`,
    guestLogin: `${V1}/auth/guest/login`,
    // Выход отзывает токены на сервере. Клиент, стирающий ключ у себя, не отвечает на
    // вопрос «выйти с чужого устройства», а именно за этим кнопку и жмут.
    logout: `${V1}/auth/logout`,
  },
  user: {
    profile: `${V1}/user/profile`,
    avatar: `${V1}/user/avatar`,
    // Удаление своей учётной записи. Без сегмента: ручка висит на корне /user.
    account: `${V1}/user`,
  },
  catalog: {
    brands: `${V1}/catalog/brands`,
    models: (brandId: string) => `${V1}/catalog/brands/${id(brandId)}/models`,
  },
  saleCar: {
    // POST без тела — сервер сам заводит черновик текущему пользователю.
    draft: `${V1}/sale_car`,
    published: `${V1}/sale_car/list`,
    revealPhone: (saleCarId: string) => `${V1}/sale_car/${id(saleCarId)}/reveal-phone`,
    mine: `${V1}/sale_car/user`,
    one: (saleCarId: string) => `${V1}/sale_car/${id(saleCarId)}`,
    photos: (saleCarId: string) => `${V1}/sale_car/${id(saleCarId)}/photos`,
    photo: (saleCarId: string, photoId: string) =>
      `${V1}/sale_car/${id(saleCarId)}/photos/${id(photoId)}`,
    photoOrder: (saleCarId: string) => `${V1}/sale_car/${id(saleCarId)}/photos/order`,
    sts: (saleCarId: string) => `${V1}/sale_car/${id(saleCarId)}/sts`,
    // Второй вход в то же распознавание: снимок прочитан, а VIN в нём — нет, и
    // семнадцать символов вписывает продавец.
    decodeVin: (saleCarId: string) => `${V1}/sale_car/${id(saleCarId)}/decode-vin`,
    submit: (saleCarId: string) => `${V1}/sale_car/${id(saleCarId)}/submit`,
    withdraw: (saleCarId: string) => `${V1}/sale_car/${id(saleCarId)}/withdraw`,
    sold: (saleCarId: string) => `${V1}/sale_car/${id(saleCarId)}/sold`,
    republish: (saleCarId: string) => `${V1}/sale_car/${id(saleCarId)}/republish`,
    revise: (saleCarId: string) => `${V1}/sale_car/${id(saleCarId)}/revise`,
    approve: (saleCarId: string) => `${V1}/sale_car/${id(saleCarId)}/approve`,
    reject: (saleCarId: string) => `${V1}/sale_car/${id(saleCarId)}/reject`,
  },
  thickness: {
    map: (saleCarId: string) => `${V1}/sale_car/${id(saleCarId)}/thickness`,
    // Панель — часть адреса, а не тело: отсюда идемпотентность PUT и уникальность
    // «один замер на панель».
    panel: (saleCarId: string, panel: string) =>
      `${V1}/sale_car/${id(saleCarId)}/thickness/${id(panel)}`,
  },
  offer: {
    collection: `${V1}/offer/`,
    mine: `${V1}/offer/my`,
    ofCar: (saleCarId: string) => `${V1}/offer/car/${id(saleCarId)}`,
    one: (offerId: string) => `${V1}/offer/${id(offerId)}`,
    status: (offerId: string) => `${V1}/offer/${id(offerId)}/status`,
    withdraw: (offerId: string) => `${V1}/offer/${id(offerId)}/withdraw`,
  },
  chat: {
    dialogs: `${V1}/chat/dialogs`,
    messages: (dialogId: string) => `${V1}/chat/dialogs/${id(dialogId)}/messages`,
    read: (dialogId: string) => `${V1}/chat/dialogs/${id(dialogId)}/read`,
    unread: `${V1}/chat/unread`,
    // Живой поток. Токен уходит параметром: у браузерного WebSocket нет заголовков,
    // приложить `Authorization` к рукопожатию нечем.
    socket: (token: string) => `${V1}/chat/ws?token=${encodeURIComponent(token)}`,
  },
  moderation: {
    queue: `${V1}/moderation/queue`,
    counts: `${V1}/moderation/counts`,
    complaints: `${V1}/moderation/complaints`,
    dismissComplaint: (complaintId: string) =>
      `${V1}/moderation/complaints/${id(complaintId)}/dismiss`,
    unpublish: (saleCarId: string) => `${V1}/moderation/listings/${id(saleCarId)}/unpublish`,
    complain: (saleCarId: string) => `${V1}/sale_car/${id(saleCarId)}/complaints`,
    suppliers: `${V1}/moderation/suppliers`,
    approveSupplier: (userId: string) => `${V1}/moderation/suppliers/${id(userId)}/approve`,
    rejectSupplier: (userId: string) => `${V1}/moderation/suppliers/${id(userId)}/reject`,
  },
  // Консоль: люди живут под тем же префиксом `/role`, что и роли, — список отвечает
  // на `/role/users` с самого начала истории проекта.
  admin: {
    users: `${V1}/role/users`,
    user: (userId: string) => `${V1}/role/users/${id(userId)}`,
    userAudit: (userId: string) => `${V1}/role/users/${id(userId)}/audit`,
    blockUser: (userId: string) => `${V1}/role/users/${id(userId)}/block`,
    unblockUser: (userId: string) => `${V1}/role/users/${id(userId)}/unblock`,
    stats: `${V1}/role/stats`,
  },
  review: {
    ofOffer: (offerId: string) => `${V1}/offer/${id(offerId)}/review`,
    one: (reviewId: string) => `${V1}/review/${id(reviewId)}`,
  },
  seller: {
    one: (userId: string) => `${V1}/seller/${id(userId)}`,
    reviews: (userId: string) => `${V1}/seller/${id(userId)}/reviews`,
    listings: (userId: string) => `${V1}/seller/${id(userId)}/listings`,
  },
  supplier: {
    // Лента одобренных витрин. Открыта всем: витрина и есть публичная страница.
    collection: `${V1}/supplier`,
    me: `${V1}/supplier/me`,
    submit: `${V1}/supplier/me/submit`,
    one: (userId: string) => `${V1}/supplier/${id(userId)}`,
  },
  request: {
    collection: `${V1}/request`,
    mine: `${V1}/request/my`,
    close: (requestId: string) => `${V1}/request/${id(requestId)}/close`,
    response: (requestId: string) => `${V1}/request/${id(requestId)}/response`,
    responses: (requestId: string) => `${V1}/request/${id(requestId)}/responses`,
  },
  role: {
    users: `${V1}/role/users`,
    userRole: (userId: string) => `${V1}/role/users/${id(userId)}/role`,
    roleInfo: (userId: string) => `${V1}/role/users/${id(userId)}/role-info`,
    stats: `${V1}/role/stats`,
    request: `${V1}/role/role-request`,
    myRequests: `${V1}/role/my-role-requests`,
    requests: `${V1}/role/role-requests`,
    answerRequest: (requestId: string) => `${V1}/role/role-requests/${id(requestId)}`,
  },
  // Поток событий распознавания. Не запрос: это `text/event-stream`, и открывает его
  // EventSource, а не `send`.
  stream: {
    listing: (saleCarId: string) => `${V1}/task/sse/${id(saleCarId)}`,
  },
} as const
