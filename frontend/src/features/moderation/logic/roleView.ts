// Заявки на роль поставщика глазами владельца площадки. Решение принимается по двум
// вещам: что человек обещает и сколько он здесь. Оба факта стоят в одной строке.
import { pluralize } from '../../../shared/format/money'
import { ratingValue } from '../../../shared/format/rating'
import type { RoleApplicationWire } from '../api/moderationApi'

export interface RoleApplicationView {
  id: string
  name: string
  meta: string
  fresh: boolean
  terms: { label: string; value: string; mono?: boolean }[]
  about: string | null
}

const DATE = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

// Аккаунт, заведённый пару дней назад ради роли поставщика, — единственный сигнал, который
// у площадки есть до первой поставки. Он назван словами, а не спрятан в дату регистрации.
const FRESH_DAYS = 7

export function toRoleApplication(wire: RoleApplicationWire): RoleApplicationView {
  const fresh = wire.account_age_days <= FRESH_DAYS
  return {
    id: wire.id,
    name: wire.company_name ? `${wire.company_name} · ${wire.applicant_name}` : wire.applicant_name,
    meta: [
      `заявка от ${DATE.format(new Date(wire.applied_at))}`,
      fresh ? accountAge(wire.account_age_days) : `на площадке с ${wire.member_since}`,
      `рейтинг покупателя ${ratingValue(wire.buyer_rating)}`,
    ].join(' · '),
    fresh,
    terms: [
      { label: 'Страны', value: wire.countries.join(', ') || 'не указаны' },
      { label: 'Марки', value: wire.brands.join(', ') || 'любые' },
      { label: 'Срок доставки', value: wire.delivery_days },
      { label: 'Предоплата', value: `${wire.prepayment_percent}% при заказе` },
      { label: 'Телефон', value: wire.phone_masked, mono: true },
      {
        label: 'Привёз за год',
        value:
          wire.claimed_deliveries === null
            ? 'не сказал'
            : `по его словам — ${wire.claimed_deliveries} ${pluralize(wire.claimed_deliveries, 'машина', 'машины', 'машин')}`,
      },
    ],
    about: wire.about,
  }
}

function accountAge(days: number): string {
  if (days <= 1) return 'аккаунт создан вчера'
  return `аккаунт создан ${days} ${pluralize(days, 'день', 'дня', 'дней')} назад`
}
