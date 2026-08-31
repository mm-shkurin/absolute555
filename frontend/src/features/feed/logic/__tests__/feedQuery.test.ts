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
      sort: 'newest',
      page: 1,
    })
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
