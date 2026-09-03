// Экран для того, кому закрыли доступ.
//
// Не «ошибка входа»: общий отказ прячет положение дел и от нарушителя, и от задетого по
// ошибке, и второй возвращается снова, считая это сбоем. Здесь названа причина и сказано,
// куда писать, — это единственный путь оспорить решение.
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { BigNotice } from '../../shared/ui/BigNotice'
import { ButtonLink } from '../../shared/ui/Button'
import { ROUTES } from '../../shared/navigation/routes'
import { closedAccessReason } from '../../shared/session/accessClosed'

export function AccessClosedPage() {
  const reason = closedAccessReason()

  return (
    <>
      <SiteHeader signedIn={false} />
      <main data-testid="access-closed">
        <Container>
          <PageSection>
            <BigNotice
              icon="✕"
              tone="bad"
              title="Доступ к площадке закрыт"
              actions={
                <ButtonLink to={ROUTES.feed} tone="ghost">
                  Смотреть объявления
                </ButtonLink>
              }
              fine="Написать нам: support@absolute555.ru"
            >
              {reason}
            </BigNotice>
          </PageSection>
        </Container>
      </main>
    </>
  )
}
