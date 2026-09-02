import { describe, expect, it } from 'vitest'
import { EMPTY_QUERY, toFeedFilters, toggleTransmission } from '../feedQuery'

describe('перевод фильтров ленты в параметры запроса', () => {
  it('не отправляет пустые поля: пустая строка «от» и отсутствие фильтра — одно и то же', () => {
    expect(toFeedFilters({ ...EMPTY_QUERY, priceFrom: '  ', yearTo: '' })).toEqual({
      brand_id: undefined,
      year_from: undefined,
      year_to: undefined,
      price_from: undefined,
      price_to: undefined,
      mileage_from: undefined,
      mileage_to: undefined,
      transmission: undefined,
      model_id: undefined,
      kind: 'stock',
      with_thickness_map: undefined,
      sort: 'newest',
      page: 1,
    })
  })

  it('вкладка ленты уходит каналом поставки, а не остаётся в экране', () => {
    expect(toFeedFilters({ ...EMPTY_QUERY, tab: 'import' }).kind).toBe('import')
  })

  it('«с картой замеров» отправляется только когда включено', () => {
    expect(toFeedFilters(EMPTY_QUERY).with_thickness_map).toBeUndefined()
    expect(toFeedFilters({ ...EMPTY_QUERY, withThicknessMap: true }).with_thickness_map).toBe(true)
  })

  it('переводит границы в числа, а не в строки', () => {
    const filters = toFeedFilters({ ...EMPTY_QUERY, priceFrom: '300000', yearTo: '2020' })
    expect(filters.price_from).toBe(300000)
    expect(filters.year_to).toBe(2020)
  })

  it('называет сортировки так, как их принимает сервер', () => {
    expect(toFeedFilters({ ...EMPTY_QUERY, sort: 'price-asc' }).sort).toBe('price_asc')
    expect(toFeedFilters({ ...EMPTY_QUERY, sort: 'price-desc' }).sort).toBe('price_desc')
  })

  it('передаёт коробки списком, чтобы каждая ушла отдельным параметром', () => {
    const query = toggleTransmission(toggleTransmission(EMPTY_QUERY, 'автомат'), 'механика')
    expect(toFeedFilters(query).transmission).toEqual(['автомат', 'механика'])
  })

  it('нумерует страницы с единицы', () => {
    expect(toFeedFilters(EMPTY_QUERY, 3).page).toBe(3)
  })
})
