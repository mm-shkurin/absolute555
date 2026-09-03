// Единственный выдуманный адрес, который ещё нужен: лента поставщиков. Ручки под неё нет
// ни в одной спеке — покупатель находит поставщика через его позиции и заявки, а
// «список всех поставщиков» никто не заказывал.
//
// Остальные выдуманные пути (`/listings`, `/offers`, `/chats`, `/users/me`,
// `/moderation/listings`) удалены: экраны за ними давно ходят на настоящие адреса, и
// заглушка отвечала бы на запросы, которых никто не делает.
import { SUPPLIERS } from './fixtures/importing'

export function legacyRoute(path: string, query: URLSearchParams): unknown {
  if (path === '/listings' && query.get('channel') === 'import') {
    // Машины и заявки этого канала приходят настоящими ручками (истории 17 и 18):
    // выдуманной осталась только половина с поставщиками.
    return {
      cars: [],
      suppliers: SUPPLIERS,
      requests: [],
      cars_total: 0,
      suppliers_total: SUPPLIERS.length,
      requests_total: 0,
    }
  }
  return null
}
