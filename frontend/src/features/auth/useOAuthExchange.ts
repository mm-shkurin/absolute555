import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '../../shared/navigation/routes'
import { isSignedIn } from '../../shared/session/authSession'
import { exchangeCode, startSessionFrom } from './api/oauthApi'
import { callbackOutcome } from './logic/callbackOutcome'
import { EXCHANGE_REFUSED, MALFORMED_CALLBACK } from './logic/oauthFailures'

export function useOAuthExchange(): string | null {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [failure, setFailure] = useState<string | null>(null)
  // Обмен запускается ровно один раз на открытие экрана: код одноразовый, и второй запрос
  // получил бы отказ по уже потраченному коду.
  const spent = useRef(false)

  useEffect(() => {
    if (spent.current) return
    spent.current = true
    const outcome = callbackOutcome(params)
    if (outcome.kind !== 'exchange') {
      setFailure(outcome.kind === 'refused' ? outcome.reason : MALFORMED_CALLBACK)
      return
    }
    let cancelled = false
    const toFeed = () => navigate(ROUTES.feed, { replace: true })
    exchangeCode(outcome.code)
      .then(startSessionFrom)
      .then(() => !cancelled && toFeed())
      .catch(() => !cancelled && refusedExchange(toFeed, setFailure))
    return () => {
      cancelled = true
    }
  }, [params, navigate])

  return failure
}

// Повторный вход этой же вкладкой мог уже состояться — тогда отказ по потраченному коду
// не повод выкидывать вошедшего человека на экран ошибки.
function refusedExchange(toFeed: () => void, setFailure: (text: string) => void): void {
  if (isSignedIn()) toFeed()
  else setFailure(EXCHANGE_REFUSED)
}
