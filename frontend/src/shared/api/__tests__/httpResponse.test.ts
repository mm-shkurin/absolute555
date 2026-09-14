import { describe, expect, it } from 'vitest'
import { readSuccessBody, toHttpError, UnexpectedBodyError } from '../httpResponse'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const isPage = (value: unknown) => typeof value === 'object' && value !== null && 'items' in value

describe('разбор ответа сервера', () => {
  it('Scenario: отказ с полями неверного типа — код и текст не подхватываются', async () => {
    // Given шлюз вернул тело, где код — число, а детали — массив
    const res = json(400, { code: 42, message: ['не строка'], details: [1, 2] })
    // When отказ переводится в ошибку
    const error = await toHttpError(res)
    // Then остаётся только статус
    expect(error.status).toBe(400)
    expect(error.errorCode).toBeUndefined()
    expect(error.details).toBeUndefined()
    expect(error.message).toBe('HTTP 400')
  })

  it('Scenario: отказ обычной формы — код, текст и детали на месте', async () => {
    const res = json(409, { code: 'DUPLICATE', message: 'Уже есть', details: { id: 'r1' } })

    const error = await toHttpError(res)

    expect(error.errorCode).toBe('DUPLICATE')
    expect(error.message).toBe('Уже есть')
    expect(error.details).toEqual({ id: 'r1' })
  })

  it('Scenario: тело успеха не прошло проверку формы — ошибка вместо тихого приведения', async () => {
    const failure = await readSuccessBody(json(200, { total: 1 }), 'json', isPage).catch(
      (error: unknown) => error,
    )

    expect(failure).toBeInstanceOf(UnexpectedBodyError)
  })

  it('Scenario: тело успеха прошло проверку — возвращается как есть', async () => {
    const body = await readSuccessBody(json(200, { items: [] }), 'json', () => true)

    expect(body).toEqual({ items: [] })
  })
})
