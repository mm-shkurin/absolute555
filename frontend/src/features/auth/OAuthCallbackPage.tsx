// Возврат от провайдера. Экран живёт секунду, но он обязателен: обмен одноразового кода на
// пару токенов происходит здесь, и человек должен видеть, что вход не сорвался, а идёт.
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { BigNotice, Spinner } from '../../shared/ui/BigNotice'
import { SignInFailureNotice } from './components/SignInFailureNotice'
import { useOAuthExchange } from './useOAuthExchange'

export function OAuthCallbackPage() {
  const failure = useOAuthExchange()
  return (
    <>
      <SiteHeader signedIn={false} />
      <main data-testid="oauth-callback">
        <Container>
          <PageSection>
            {failure ? (
              <SignInFailureNotice failure={failure} />
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
