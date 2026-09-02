// Свой профиль. Имя и аватар приходят от провайдера входа — здесь их не редактируют,
// поэтому экран целиком про навигацию и состояния, а не про форму настроек.
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { Panel } from '../../shared/ui/Panel'
import { PersonHead } from '../../shared/ui/Avatar'
import { Button } from '../../shared/ui/Button'
import { FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ROUTES } from '../../shared/navigation/routes'
import { fetchProfile } from './api/profileApi'
import { toProfileView } from './logic/profileView'
import { Shortcuts } from './components/Shortcuts'
import { SupplierApplication } from './components/SupplierApplication'
import { MyRequests } from './components/MyRequests'

export function ProfilePage({ onSignOut }: { onSignOut?: () => void }) {
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['profile'], queryFn: ({ signal }) => fetchProfile(signal) })
  const view = query.data ? toProfileView(query.data) : null

  return (
    <>
      <SiteHeader signedIn />
      <main data-testid="profile">
        <Container>
          <PageSection>
            <PageHeading
              title="Профиль"
              sub="Имя и аватар пришли от провайдера входа. Пароля здесь нет."
            />
            {query.isPending ? <ListSkeleton rows={3} /> : null}
            {!query.isPending && query.error ? (
              <FailureNotice
                message={(query.error as Error).message}
                onRetry={() => void query.refetch()}
              />
            ) : null}
            {view ? (
              <>
                <Panel first>
                  <PersonHead
                    name={view.name}
                    rating={view.rating}
                    line={view.line}
                    action={
                      <Button tone="ghost" onClick={() => onSignOut?.()}>
                        Выйти
                      </Button>
                    }
                  />
                </Panel>
                <Shortcuts shortcuts={view.shortcuts} />
                <SupplierApplication
                  state={view.supplier}
                  onApply={() => navigate(ROUTES.supplierApplication)}
                />
                <MyRequests requests={view.requests} />
              </>
            ) : null}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
