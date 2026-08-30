import { describe, expect, it } from 'vitest'
import { emptySupplierDraft, missingForSupplier } from '../supplierDraft'

const filled = {
  ...emptySupplierDraft,
  name: 'Восток-Авто',
  countries: 'Япония, Корея',
  deliveryDays: '45–70 дней',
  prepayment: '30% при заказе',
  phone: '+79130000000',
  about: 'Вожу с аукционов Японии пятый год, работаю через партнёра во Владивостоке.',
}

describe('анкета поставщика', () => {
  it('требует то, по чему покупатель будет выбирать', () => {
    expect(missingForSupplier(emptySupplierDraft)).toEqual([
      'название',
      'страны',
      'срок доставки',
      'условия предоплаты',
      'телефон',
      'рассказ об опыте',
    ])
  })

  it('заполненная анкета проходит', () => {
    expect(missingForSupplier(filled)).toEqual([])
  })

  it('короткая отписка вместо рассказа об опыте не принимается', () => {
    expect(missingForSupplier({ ...filled, about: 'вожу машины' })).toEqual(['рассказ об опыте'])
  })
})
