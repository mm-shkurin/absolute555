import { describe, expect, it } from 'vitest'
import { callbackOutcome } from '../callbackOutcome'

const at = (search: string) => callbackOutcome(new URLSearchParams(search))

describe('адрес возврата от провайдера', () => {
  it('меняет код на сессию, когда он пришёл', () => {
    expect(at('code=abc123&provider=yandex')).toEqual({ kind: 'exchange', code: 'abc123' })
  })

  it('при отказе не трогает обмен вовсе: кода в таком возврате нет', () => {
    expect(at('error=provider_failed&provider=yandex').kind).toBe('refused')
  })

  it('различает причины отказа, потому что человеку они говорят разное', () => {
    const stale = at('error=state_invalid')
    const refused = at('error=provider_failed')
    expect(stale).not.toEqual(refused)
    expect(stale.kind === 'refused' && stale.reason).toContain('устарела')
  })

  it('незнакомую причину объясняет общим текстом, а не показывает её код', () => {
    const outcome = at('error=teapot')
    expect(outcome.kind === 'refused' && outcome.reason).not.toContain('teapot')
  })

  it('пустой и неправдоподобно длинный код не тратит', () => {
    expect(at('code=%20%20').kind).toBe('malformed')
    expect(at(`code=${'x'.repeat(600)}`).kind).toBe('malformed')
    expect(at('provider=yandex').kind).toBe('malformed')
  })
})
