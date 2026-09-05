// Профили поставщиков в заглушке. Форма — контракт истории 16.
import type {
  SupplierProfileWire,
  SupplierStatus,
} from '../../shared/api/backend/supplierContract'

function profile(userId: string, status: SupplierStatus): SupplierProfileWire {
  return {
    user_id: userId,
    company_name: 'Восток-Авто',
    countries: ['Япония', 'Корея'],
    brands: ['Toyota', 'Lexus', 'Honda'],
    delivery_days_min: 45,
    delivery_days_max: 70,
    terms: 'Предоплата 30% при заказе, остальное после прибытия в порт.',
    description:
      'Вожу с аукционов Японии пятый год. Беру конкретный лот с аукционного листа, растаможку веду сам.',
    status,
    reject_reason: status === 'rejected' ? 'Не указаны условия расчётов' : null,
    updated_at: new Date(Date.now() - 3 * 24 * 3600_000).toISOString(),
  }
}

// Свой профиль живёт в памяти сессии: правка и отправка в очередь обязаны менять то, что
// экран прочитает следующим запросом, иначе статус на экране разойдётся с кнопками.
let mine: SupplierProfileWire = profile('u1', 'draft')

export function myProfile(): SupplierProfileWire {
  return mine
}

export function editMyProfile(update: Partial<SupplierProfileWire>): SupplierProfileWire {
  // Правка снимает отказ и возвращает профиль в черновик — как на сервере.
  mine = { ...mine, ...update, status: 'draft', reject_reason: null }
  return mine
}

export function submitMyProfile(): SupplierProfileWire {
  mine = { ...mine, status: 'pending' }
  return mine
}

export function supplierQueue(): { items: SupplierProfileWire[]; total: number } {
  const items = [mine.status === 'pending' ? mine : profile('u9', 'pending')]
  return { items, total: items.length }
}

/** Лента одобренных витрин. Свой профиль попадает в неё, как только его одобрили —
 *  иначе экран показывал бы пустоту сразу после одобрения. */
export function supplierList(): {
  items: SupplierProfileWire[]
  total: number
  page: number
  size: number
} {
  const items = [profile('u9', 'published'), profile('u7', 'published')]
  if (mine.status === 'published') items.unshift(mine)
  return { items, total: items.length, page: 1, size: 20 }
}

export function publicProfile(userId: string): SupplierProfileWire {
  return profile(userId, 'published')
}
