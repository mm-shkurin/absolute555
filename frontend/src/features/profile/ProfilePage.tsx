// Свой профиль: кто вошёл, что у него есть и как отсюда выйти. Имя и фотография
// правятся здесь же (история 21) — раньше их приносил только провайдер входа.
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ROUTES } from '../../shared/navigation/routes'
import { fetchProfile } from './api/profileApi'
import { toProfileView } from './logic/profileView'
import { ProfileIdentity } from './components/ProfileIdentity'
import { useProfileIdentity } from './useProfileIdentity'
import { ModerationEntry } from './components/ModerationEntry'
import { Shortcuts } from './components/Shortcuts'
import { SupplierApplication } from './components/SupplierApplication'
import { MyRequests } from './components/MyRequests'

export function ProfilePage() {
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['profile'], queryFn: ({ signal }) => fetchProfile(signal) })
  const identity = useProfileIdentity()
  const view = query.data ? toProfileView(query.data) : null

  return (
    <>
      <SiteHeader signedIn />
      <main data-testid="profile">
        <Container>
          <PageSection>
            <PageHeading
              title="Профиль"
              sub="Имя и фотографию можно поменять. Пароля здесь нет — вход через провайдера."
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
                <ProfileIdentity
                  name={view.name}
                  avatarUrl={view.avatarUrl}
                  rating={view.rating}
                  line={view.line}
                  actions={identity}
                />
                <ModerationEntry />
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
