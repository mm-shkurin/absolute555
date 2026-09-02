// Заявки покупателя и отклики поставщиков в заглушке. Форма — контракт истории 18.
import type {
  BuyerRequestWire,
  SupplierResponseWire,
} from '../../shared/api/backend/requestContract'

const DAYS = 24 * 3600_000

// Заявки живут в памяти сессии: открытие, закрытие и отклик обязаны менять то, что экран
// прочитает следующим запросом.
let requests: BuyerRequestWire[] = [
  {
    request_id: 'r1',
    user_id: 'u1',
    brand: 'Toyota',
    model: 'Land Cruiser 300',
    year_from: 2022,
    budget_max: 12000000,
    comment: 'Белый, без пробега по России.',
    status: 'open',
    responses_count: 1,
    created_at: new Date(Date.now() - 2 * DAYS).toISOString(),
  },
]

const responses = new Map<string, SupplierResponseWire[]>([
  [
    'r1',
    [
      {
        response_id: 'rs1',
        request_id: 'r1',
        supplier_id: 'u9',
        price: 12400000,
        delivery_days: 60,
        comment: 'Возьму с аукциона, растаможка моя.',
        updated_at: null,
      },
    ],
  ],
])

export function myRequests(): BuyerRequestWire[] {
  return requests
}

export function openRequests(): { items: BuyerRequestWire[]; total: number; page: number; size: number } {
  const items = requests.filter((one) => one.status === 'open')
  return { items, total: items.length, page: 1, size: 20 }
}

export function addRequest(body: Record<string, unknown>): BuyerRequestWire {
  const request: BuyerRequestWire = {
    request_id: `r${requests.length + 1}`,
    user_id: 'u1',
    brand: 'Toyota',
    model: 'Alphard',
    year_from: typeof body.year_from === 'number' ? body.year_from : null,
    budget_max: typeof body.budget_max === 'number' ? body.budget_max : null,
    comment: typeof body.comment === 'string' ? body.comment : null,
    status: 'open',
    responses_count: 0,
    created_at: new Date().toISOString(),
  }
  requests = [request, ...requests]
  return request
}

export function closeRequest(requestId: string): BuyerRequestWire | null {
  requests = requests.map((one) =>
    one.request_id === requestId ? { ...one, status: 'closed' as const } : one,
  )
  return requests.find((one) => one.request_id === requestId) ?? null
}

export function requestResponses(requestId: string): SupplierResponseWire[] {
  return responses.get(requestId) ?? []
}

export function putRequestResponse(
  requestId: string,
  body: Record<string, unknown>,
): SupplierResponseWire {
  const mine: SupplierResponseWire = {
    response_id: `rs-${requestId}-me`,
    request_id: requestId,
    supplier_id: 'u1',
    price: typeof body.price === 'number' ? body.price : 0,
    delivery_days: typeof body.delivery_days === 'number' ? body.delivery_days : 0,
    comment: typeof body.comment === 'string' ? body.comment : null,
    updated_at: new Date().toISOString(),
  }
  // Повторный отклик правит свой, а не заводит второй — как на сервере.
  const rest = (responses.get(requestId) ?? []).filter((one) => one.supplier_id !== 'u1')
  responses.set(requestId, [...rest, mine])
  return mine
}
