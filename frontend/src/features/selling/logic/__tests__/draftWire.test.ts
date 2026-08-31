import { describe, expect, it } from 'vitest'
import { toDraft, toPatch } from '../draftWire'
import { EMPTY_DRAFT } from '../draft'
import type { SaleCarWire } from '../../../../shared/api/backend/saleCarContract'

const car = (over: Partial<SaleCarWire> = {}): SaleCarWire => ({
  sale_car_id: 'c1',
  user_id: 'u1',
  vin: null,
  brand: null,
  model: null,
  mark_raw: null,
  model_raw: null,
  year: null,
  transmission: null,
  engine_power: null,
  task_id: null,
  task_status: null,
  phone_number: null,
  price: null,
  milleage: null,
  description: null,
  status: 'draft',
  reject_reason: null,
  reject_label: null,
  published_at: null,
  created_at: null,
  updated_at: null,
  car_data: null,
  preview_photo_url: null,
  photos: [],
  autofill: null,
  seller: null,
  ...over,
})

describe('черновик с провода', () => {
  it('помечает распознанные марку и модель как пришедшие из документа', () => {
    const draft = toDraft(
      car({
        brand: 'Toyota',
        model: 'Camry',
        autofill: {
          state: 'done',
          brand_source: 'ocr',
          model_source: 'ocr',
          updated_at: null,
        },
      }),
    )
    expect(draft.brand).toEqual({ value: 'Toyota', source: 'document' })
    expect(draft.model.source).toBe('document')
  })

  it('поле, переписанное продавцом, перестаёт быть распознанным', () => {
    const draft = toDraft(
      car({
        brand: 'Toyota',
        autofill: { state: 'done', brand_source: 'seller', model_source: null, updated_at: null },
      }),
    )
    expect(draft.brand.source).toBe('manual')
  })

  it('берёт прочитанное с документа, когда справочник марку не связал', () => {
    expect(toDraft(car({ mark_raw: 'ТОЙОТА' })).brand.value).toBe('ТОЙОТА')
  })
})

describe('черновик на провод', () => {
  it('не отправляет пустые поля: пустая правка сервером отвергается', () => {
    expect(toPatch(EMPTY_DRAFT)).toEqual({})
  })

  it('шлёт числа числами, а пробег — под именем milleage, как его зовёт сервер', () => {
    const patch = toPatch({ ...EMPTY_DRAFT, price: ' 1390000 ', mileage: '96400' })
    expect(patch.price).toBe(1390000)
    expect(patch.milleage).toBe(96400)
  })

  it('не отправляет нечисло в числовом поле, чтобы одна опечатка не отменила остальные правки', () => {
    const patch = toPatch({ ...EMPTY_DRAFT, mileage: 'сто тысяч', phone: '+79000000000' })
    expect(patch.milleage).toBeUndefined()
    expect(patch.phone_number).toBe('+79000000000')
  })

  it('шлёт марку и модель как прочитанные строки: идентификаторов справочника у мастера нет', () => {
    const patch = toPatch({
      ...EMPTY_DRAFT,
      brand: { value: 'Toyota', source: 'manual' },
      model: { value: 'Camry', source: 'manual' },
    })
    expect(patch).toMatchObject({ mark_raw: 'Toyota', model_raw: 'Camry' })
    expect(patch.brand_id).toBeUndefined()
  })
})
