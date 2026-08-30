// Возврат от провайдера. Экран живёт секунду, но он обязателен: обмен кода на токены
// происходит здесь, и человек должен видеть, что вход не сорвался, а идёт.
//
// Сам обмен появится вместе с подключением бэкенда; сейчас экран показывает оба исхода
// по параметрам возврата, потому что отказ провайдера приходит именно так.
import { useSearchParams } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { BigNotice, Spinner } from '../../shared/ui/BigNotice'
import { ButtonLink } from '../../shared/ui/Button'
import { ROUTES } from '../../shared/navigation/routes'

export function OAuthCallbackPage() {
  const [params] = useSearchParams()
  // Провайдер сообщает отказ параметром `error` — это единственный способ отличить
  // «человек закрыл окно» от «мы ещё меняем код на токены».
  const failed = params.get('error') !== null

  return (
    <>
      <SiteHeader signedIn={false} />
      <main data-testid="oauth-callback">
        <Container>
          <PageSection>
            {failed ? (
              <BigNotice
                icon="✕"
                tone="bad"
                title="Войти не получилось"
                actions={
                  <>
                    <ButtonLink to={ROUTES.feed}>Попробовать снова</ButtonLink>
                    <ButtonLink to={ROUTES.feed} tone="ghost">
                      Вернуться в ленту
                    </ButtonLink>
                  </>
                }
                fine="Если повторяется — попробуйте второй способ входа: VK ID вместо Яндекс ID или наоборот."
              >
                Провайдер не подтвердил вход — возможно, вы закрыли окно или отклонили доступ.
                Данные не пострадали, объявление и черновик на месте.
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
