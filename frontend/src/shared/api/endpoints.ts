// Пути, которых на сервере ещё нет.
//
// Настоящая карта — `backend/paths.ts`: там то, что смонтировано в `app/api.py` и
// отвечает на запросы. Здесь остаток, нарисованный по мокапам, — четыре фичи, чьи истории
// не доехали. Каждая группа названа своей историей: путь без истории — это путь, который
// никто не заведёт, и держать его значит держать кладбище.
//
// Собрано из сегментов, а не написано литералом: версия — часть опубликованного контракта
// и двигается вместе с ним.
const MOUNT = 'api'
export const API_VERSION = 'v1'

const V1 = `/${MOUNT}/${API_VERSION}`

export const API = {
  // Канал «под заказ»: позиции поставщиков в ленте — истории 16 и 17.
  listings: {
    collection: `${V1}/listings`,
  },
  // Поставщики и заявки на привоз — истории 16 и 17.
  importing: {
    request: (id: string) => `${V1}/import-requests/${encodeURIComponent(id)}`,
    responses: (id: string) => `${V1}/import-requests/${encodeURIComponent(id)}/responses`,
  },
} as const
