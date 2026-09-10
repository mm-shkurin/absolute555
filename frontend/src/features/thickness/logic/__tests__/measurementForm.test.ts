import { describe, expect, it } from 'vitest'
import { checkMeasurement } from '../measurementForm'

const photo = () => new File([new Uint8Array([1, 2, 3])], 'device.jpg', { type: 'image/jpeg' })

describe('форма замера', () => {
  it('пропускает число с фотографией', () => {
    const checked = checkMeasurement(' 96 ', photo())
    expect(checked).toMatchObject({ ok: true, valueUm: 96 })
  })

  it('без фотографии замер не отправляется', () => {
    expect(checkMeasurement('96', null)).toEqual({
      ok: false,
      reason: 'Нужна фотография экрана прибора.',
    })
  })

  it('пустое поле означает «прочитай сам», а не ноль', () => {
    expect(checkMeasurement('  ', photo())).toMatchObject({ ok: true, valueUm: null })
  })

  it('держит границы контракта: 1..3000', () => {
    expect(checkMeasurement('0', photo())).toMatchObject({ ok: false })
    expect(checkMeasurement('3001', photo())).toMatchObject({ ok: false })
    expect(checkMeasurement('1', photo())).toMatchObject({ ok: true, valueUm: 1 })
    expect(checkMeasurement('3000', photo())).toMatchObject({ ok: true, valueUm: 3000 })
  })

  it('десятые с экрана прибора округляет до целых мкм, подписанное число отвергает', () => {
    expect(checkMeasurement('97.3', photo())).toMatchObject({ ok: true, valueUm: 97 })
    expect(checkMeasurement('57,5', photo())).toMatchObject({ ok: true, valueUm: 58 })
    expect(checkMeasurement('-96', photo())).toMatchObject({ ok: false })
  })
})
