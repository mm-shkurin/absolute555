// Профиль из того, что сервер знает о человеке сегодня.
//
// `GET /user/profile` отдаёт строку пользователя: идентификаторы провайдеров, их сырые
// ответы, роль и даты. Ни рейтинга, ни числа сделок, ни счётчиков разделов там нет —
// отзывы это история 12, а сводка кабинета вообще не сделана.
import { monthAndYear } from '../../../shared/format/dates'
import type {
  RoleRequestWire,
  UserWire,
} from '../../../shared/api/backend/accountContract'
import type { BuyerRequestWire } from '../../../shared/api/backend/requestContract'
import type { ProfileWire, SupplierApplicationStatus } from '../api/profileApi'


/** Имя, каким его назвал сервер: своё, если человек его вписал, иначе провайдерское
 *  (история 21 — правило живёт на строке, а не здесь). Разбор `yandex_json` остался
 *  запасным ходом для записей, заведённых до появления колонки: сервер отдаёт по ним
 *  `null`, а имя в их профиле провайдера есть. */
function nameOf(user: UserWire): string {
  if (user.name && user.name.trim()) return user.name.trim()

  const source = user.yandex_json ?? user.vk_json ?? user.tg_json ?? {}
  const candidates = [source.real_name, source.display_name, source.first_name, source.name]
  const found = candidates.find((value) => typeof value === 'string' && value.trim())
  if (typeof found === 'string') return found.trim()
  return user.is_guest ? 'Гость' : ''
}

export function toProfileWire(
  user: UserWire,
  listings: { total: number; rejected: number },
  roleRequests: RoleRequestWire[] = [],
  importRequests: BuyerRequestWire[] = [],
): ProfileWire {
  const forImporter = roleRequests.filter((one) => one.requested_role === 'importer')
  // Живая заявка перевешивает решённые: человек ждёт ответа именно по ней. Роль уже
  // выдана — состояние читается по самой роли, а не по журналу заявок.
  const live = forImporter.find((one) => one.status === 'pending') ?? forImporter[0] ?? null
  return {
    id: user.id,
    name: nameOf(user),
    avatar_url: user.avatar_url,
    // Рейтинг и сделки появятся с отзывами: `null` показывается как «пока без оценок»,
    // а ноль читался бы как «оценили на ноль».
    rating: null,
    deals_count: 0,
    reviews_count: 0,
    member_since: monthAndYear(user.created_at),
    listings_count: listings.total,
    rejected_listings: listings.rejected,
    // Счётчиков непрочитанного и предложений сервер не считает; их экраны сами покажут,
    // сколько там всего, когда человек туда зайдёт.
    incoming_offers: 0,
    outgoing_offers: 0,
    unread_messages: 0,
    supplier_status:
      user.role === 'importer' ? 'approved' : ((live?.status ?? 'none') as SupplierApplicationStatus),
    supplier_applied_at: live?.created_at ?? null,
    import_requests: importRequests.map((request) => ({
      id: request.request_id,
      title: `${request.brand ?? ''} ${request.model ?? ''}`.trim() || 'Заявка на привоз',
      budget_max: request.budget_max,
      created_at: request.created_at,
      responses_count: request.responses_count,
      active: request.status === 'open',
    })),
  }
}
