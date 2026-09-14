// Свой профиль: кто вошёл, что у него есть и как отсюда выйти. Имя и фотография
// правятся здесь же (история 21) — раньше их приносил только провайдер входа.
import { useQuery } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { fetchProfile } from './api/profileApi'
import { toProfileView } from './logic/profileView'
import { ProfileSections } from './components/ProfileSections'
import { useProfileIdentity } from './useProfileIdentity'
import { useMyStorefront } from './useMyStorefront'

const SUB = 'Имя и фотографию можно поменять. Пароля здесь нет — вход через провайдера.'

export function ProfilePage() {
  const query = useQuery({ queryKey: ['profile'], queryFn: ({ signal }) => fetchProfile(signal) })
  const identity = useProfileIdentity()
  const storefront = useMyStorefront()
  const view = query.data ? toProfileView(query.data) : null
  const failure = !query.isPending && query.error ? (query.error as Error) : null
  return (
    <>
      <SiteHeader signedIn />
      <main data-testid="profile">
        <Container>
          <PageSection>
            <PageHeading title="Профиль" sub={SUB} />
            {query.isPending ? <ListSkeleton rows={3} /> : null}
            {failure ? (
              <FailureNotice message={failure.message} onRetry={() => void query.refetch()} />
            ) : null}
            {view ? (
              <ProfileSections view={view} identity={identity} storefront={storefront.data} />
            ) : null}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
