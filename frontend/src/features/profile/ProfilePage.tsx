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
import { fetchMyProfile } from '../../shared/api/backend/supplierApi'
import { currentRole } from '../../shared/session/authSession'
import { toProfileView } from './logic/profileView'
import { ProfileIdentity } from './components/ProfileIdentity'
import { SupplierStorefront } from './components/SupplierStorefront'
import { useProfileIdentity } from './useProfileIdentity'
import { ModerationEntry } from './components/ModerationEntry'
import { Shortcuts } from './components/Shortcuts'
import { SupplierApplication } from './components/SupplierApplication'
import { MyRequests } from './components/MyRequests'

export function ProfilePage() {
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['profile'], queryFn: ({ signal }) => fetchProfile(signal) })
  const identity = useProfileIdentity()
  // Витрина спрашивается только у того, кому роль уже выдана: остальным сервер отвечает
  // отказом, и лишний красный запрос в консоли ничего не объясняет.
  const storefront = useQuery({
    queryKey: ['my-storefront'],
    queryFn: ({ signal }) => fetchMyProfile(signal),
    enabled: currentRole() === 'importer',
    retry: false,
  })
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
                {currentRole() === 'importer' ? (
                  <SupplierStorefront
                    status={storefront.data?.status ?? null}
                    rejectReason={storefront.data?.reject_reason ?? null}
                  />
                ) : null}
                <Shortcuts shortcuts={view.shortcuts} userId={view.id} />
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
