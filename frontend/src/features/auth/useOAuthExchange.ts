import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '../../shared/navigation/routes'
import { isSignedIn } from '../../shared/session/authSession'
import { exchangeCode, startSessionFrom } from './api/oauthApi'
import { callbackOutcome } from './logic/callbackOutcome'

const MALFORMED = 'Адрес возврата неполный: кода входа в нём нет. Начните вход заново.'

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
      setFailure(outcome.kind === 'refused' ? outcome.reason : MALFORMED)
      return
    }
    exchangeCode(outcome.code)
      .then(startSessionFrom)
      .then(() => navigate(ROUTES.feed, { replace: true }))
      .catch(() => {
        // Повторный вход этой же вкладкой мог уже состояться — тогда отказ по потраченному
        // коду не повод выкидывать вошедшего человека на экран ошибки.
        if (isSignedIn()) navigate(ROUTES.feed, { replace: true })
        else setFailure('Код входа не подошёл — возможно, он уже использован или истёк.')
      })
  }, [params, navigate])

  return failure
}
