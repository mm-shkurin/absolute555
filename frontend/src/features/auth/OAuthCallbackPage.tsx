// Возврат от провайдера. Экран живёт секунду, но он обязателен: обмен одноразового кода на
// пару токенов происходит здесь, и человек должен видеть, что вход не сорвался, а идёт.
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { BigNotice, Spinner } from '../../shared/ui/BigNotice'
import { Button, ButtonLink } from '../../shared/ui/Button'
import { ROUTES } from '../../shared/navigation/routes'
import { isSignedIn } from '../../shared/session/authSession'
import { beginSignIn } from '../../shared/session/signIn'
import { exchangeCode, startSessionFrom } from './api/oauthApi'
import { callbackOutcome } from './logic/callbackOutcome'

const MALFORMED = 'Адрес возврата неполный: кода входа в нём нет. Начните вход заново.'

export function OAuthCallbackPage() {
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
    if (outcome.kind === 'refused') {
      setFailure(outcome.reason)
      return
    }
    if (outcome.kind === 'malformed') {
      setFailure(MALFORMED)
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

  return (
    <>
      <SiteHeader signedIn={false} />
      <main data-testid="oauth-callback">
        <Container>
          <PageSection>
            {failure ? (
              <BigNotice
                icon="✕"
                tone="bad"
                title="Войти не получилось"
                actions={
                  <>
                    <Button onClick={beginSignIn}>Попробовать снова</Button>
                    <ButtonLink to={ROUTES.feed} tone="ghost">
                      Вернуться в ленту
                    </ButtonLink>
                  </>
                }
                fine="Данные не пострадали: объявление и черновик на месте."
              >
                {failure}
              </BigNotice>
            ) : (
              <BigNotice icon={<Spinner />} title="Завершаем вход">
                Секунда — и вернём вас туда, где вы нажали кнопку. Действие продолжится само.
              </BigNotice>
            )}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
