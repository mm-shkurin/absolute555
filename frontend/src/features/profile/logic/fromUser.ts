// Профиль из того, что сервер знает о человеке сегодня.
//
// `GET /user/profile` отдаёт строку пользователя: идентификаторы провайдеров, их сырые
// ответы, роль и даты. Ни рейтинга, ни числа сделок, ни счётчиков разделов там нет —
// отзывы это история 12, а сводка кабинета вообще не сделана.
import type { UserWire } from '../../../shared/api/backend/accountContract'
import type { ProfileWire } from '../api/profileApi'

const MONTH = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })

/** Имя берётся из ответа провайдера, которым человек вошёл: своего поля имени у нас нет.
 *  Если провайдер его не дал — пусто, и экран покажет вход вместо выдуманного имени. */
function nameOf(user: UserWire): string {
  const source = user.yandex_json ?? user.vk_json ?? user.tg_json ?? {}
  const candidates = [source.real_name, source.display_name, source.first_name, source.name]
  const found = candidates.find((value) => typeof value === 'string' && value.trim())
  if (typeof found === 'string') return found.trim()
  return user.is_guest ? 'Гость' : ''
}

export function toProfileWire(
  user: UserWire,
  listings: { total: number; rejected: number },
): ProfileWire {
  return {
    id: user.id,
    name: nameOf(user),
    // Рейтинг и сделки появятся с отзывами: `null` показывается как «пока без оценок»,
    // а ноль читался бы как «оценили на ноль».
    rating: null,
    deals_count: 0,
    reviews_count: 0,
    member_since: user.created_at ? MONTH.format(new Date(user.created_at)) : '',
    listings_count: listings.total,
    rejected_listings: listings.rejected,
    // Счётчиков непрочитанного и предложений сервер не считает; их экраны сами покажут,
    // сколько там всего, когда человек туда зайдёт.
    incoming_offers: 0,
    outgoing_offers: 0,
    unread_messages: 0,
    supplier_status: 'none',
    supplier_applied_at: null,
    import_requests: [],
  }
}
