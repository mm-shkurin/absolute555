import { describe, expect, it } from 'vitest'
import { EMPTY_DRAFT } from '../draft'
import { toDraft, toPatch } from '../draftWire'
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
  preview_photo_url: null,
  photos: [],
  autofill: null,
  seller: null,
  thickness: null,
  listing_kind: 'stock',
  import_country: null,
  delivery_days: null,
  turnkey_price: null,
  ...over,
})

describe('черновик с провода', () => {
  it('помечает распознанные марку и модель как заполненные приложением', () => {
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
    expect(draft.brand).toEqual({ value: 'Toyota', source: 'recognized' })
    expect(draft.model.source).toBe('recognized')
  })

  // История 20: пометка ставится только там, где источник подтвердил сервер. Год, коробка,
  // мощность и VIN своего источника на проводе не имеют, и метка на них была бы догадкой.
  it('не помечает распознанным то, чей источник сервер не назвал', () => {
    const draft = toDraft(
      car({
        year: 2012,
        transmission: 'АКПП',
        engine_power: 367,
        vin: 'XW8ZZZ61ZJG012345',
        autofill: { state: 'done', brand_source: 'ocr', model_source: 'ocr', updated_at: null },
      }),
    )
    expect(draft.year).toEqual({ value: '2012', source: 'manual' })
    expect(draft.transmission.source).toBe('manual')
    expect(draft.enginePower.source).toBe('manual')
    expect(draft.vin.source).toBe('manual')
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

  it('привоз кладёт в правку страну, срок и цену под ключ', () => {
    const patch = toPatch({
      ...EMPTY_DRAFT,
      kind: 'import',
      importCountry: 'Япония',
      deliveryDays: '60',
      turnkeyPrice: '6690000',
    })
    expect(patch.import_country).toBe('Япония')
    expect(patch.delivery_days).toBe(60)
    expect(patch.turnkey_price).toBe(6690000)
  })

  it('машина в наличии полей привоза не отправляет, даже если они заполнены', () => {
    const patch = toPatch({ ...EMPTY_DRAFT, importCountry: 'Япония', deliveryDays: '60' })
    expect(patch.import_country).toBeUndefined()
    expect(patch.delivery_days).toBeUndefined()
  })
})
