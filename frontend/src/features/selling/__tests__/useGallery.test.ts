import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useGallery } from '../useGallery'
import { BACKEND } from '../../../shared/api/backend/paths'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'

const photo = (photoId: string, position: number) => ({
  photo_id: photoId,
  url: `https://cdn/${photoId}.jpg`,
  preview_url: `https://cdn/${photoId}-s.jpg`,
  position,
})
const gallery = (...photos: ReturnType<typeof photo>[]) => ({
  sale_car_id: 'car1',
  photos,
  limit: 15,
})

let server: FakeServer

beforeEach(() => {
  server = fakeServer()
  signedIn()
})
afterEach(resetServer)

describe('фотографии в мастере', () => {
  it('Scenario: добавленные фото показываются так, как их сохранил сервер', async () => {
    // Given черновик без фотографий
    server.on('POST', BACKEND.saleCar.photos('car1'), {
      status: 200,
      body: gallery(photo('p1', 0), photo('p2', 1)),
    })
    const { result } = renderHook(() => useGallery('car1'))
    // When продавец добавляет два снимка
    await act(() => result.current.add([new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg')]))
    // Then в галерее два фото из ответа сервера, ошибок нет
    expect(result.current.photos.map((one) => one.photo_id)).toEqual(['p1', 'p2'])
    expect(result.current.error).toBeNull()
    expect(result.current.busy).toBe(false)
  })

  it('Scenario: шестнадцатое фото — отказ текстом, а не молчание', async () => {
    server.on('POST', BACKEND.saleCar.photos('car1'), {
      status: 409,
      body: { code: 'PHOTO_LIMIT_EXCEEDED', message: 'limit' },
    })
    const { result } = renderHook(() => useGallery('car1'))

    await act(() => result.current.add([new File(['a'], 'a.jpg')]))

    expect(result.current.error).toBe('Больше фотографий добавить нельзя.')
  })

  it('Scenario: продавец меняет порядок — сервер получает новый порядок', async () => {
    server.on('PUT', BACKEND.saleCar.photoOrder('car1'), {
      status: 200,
      body: gallery(photo('p2', 0), photo('p1', 1)),
    })
    const { result } = renderHook(() => useGallery('car1'))

    await act(() => result.current.reorder(['p2', 'p1']))

    expect(server.callsTo('PUT', BACKEND.saleCar.photoOrder('car1'))[0].body).toEqual({
      photo_ids: ['p2', 'p1'],
    })
    expect(result.current.photos[0].photo_id).toBe('p2')
  })

  it('Scenario: удалённое фото пропадает из галереи', async () => {
    server.on('DELETE', BACKEND.saleCar.photo('car1', 'p1'), {
      status: 200,
      body: gallery(photo('p2', 0)),
    })
    const { result } = renderHook(() => useGallery('car1'))

    await act(() => result.current.remove('p1'))

    expect(result.current.photos.map((one) => one.photo_id)).toEqual(['p2'])
  })

  it('Scenario: вернулся к черновику — галерея перечитывается с сервера', async () => {
    server.on('GET', BACKEND.saleCar.one('car1'), {
      status: 200,
      body: { sale_car_id: 'car1', photos: [photo('p1', 0)] },
    })
    const { result } = renderHook(() => useGallery('car1'))

    await act(() => result.current.refresh())

    expect(result.current.photos).toHaveLength(1)
  })

  it('без черновика запрос не уходит', async () => {
    const { result } = renderHook(() => useGallery(null))

    await act(() => result.current.add([new File(['a'], 'a.jpg')]))

    expect(server.calls).toEqual([])
  })
})
