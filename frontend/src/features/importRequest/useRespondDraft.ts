import { useState } from 'react'
import type { SupplierResponseWire } from './api/requestApi'

// Цену пишут так, как её читают, — с пробелами между разрядами, как в подсказке поля.
// `Number` на «6 690 000» даёт NaN, и кнопка молча не нажималась.
function amount(raw: string): number {
  return Number(raw.replace(/[\s\u00a0]/g, '').replace(',', '.'))
}

export interface RespondDraft {
  price: string
  days: string
  comment: string
  setPrice: (value: string) => void
  setDays: (value: string) => void
  setComment: (value: string) => void
  complete: boolean
  values: () => [price: number, days: number, comment: string]
}

export function useRespondDraft(existing: SupplierResponseWire | null): RespondDraft {
  const [price, setPrice] = useState(existing ? String(existing.price) : '')
  const [days, setDays] = useState(existing ? String(existing.delivery_days) : '')
  const [comment, setComment] = useState(existing?.comment ?? '')
  return {
    price,
    days,
    comment,
    setPrice,
    setDays,
    setComment,
    complete: amount(price) > 0 && amount(days) > 0,
    values: () => [amount(price), Math.round(amount(days)), comment.trim()],
  }
}
