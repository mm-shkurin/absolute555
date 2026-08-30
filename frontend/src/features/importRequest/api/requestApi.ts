// Заявка на привоз и отклики на неё. Отклик — это предложение наоборот: не покупатель
// торгуется за машину, а поставщики за покупателя.
import { API } from '../../../shared/api/endpoints'
import { send } from '../../../shared/api/send'

export interface RequestWire {
  id: string
  title: string
  years: string
  budget_max: number | null
  mileage_max_km: number | null
  countries: string[]
  wait_days_max: number | null
  comment: string | null
  created_at: string
  active: boolean
  owned_by_me: boolean
}

export interface BidWire {
  id: string
  supplier_id: string
  supplier_name: string
  rating: number | null
  deliveries_count: number
  comment: string
  price: number
  delivery_days: number
}

export async function fetchRequest(id: string, signal?: AbortSignal): Promise<RequestWire> {
  return send<RequestWire>(API.importing.request(id), { signal })
}

export async function fetchBids(id: string, signal?: AbortSignal): Promise<{ items: BidWire[] }> {
  return send<{ items: BidWire[] }>(API.importing.responses(id), { signal })
}
