// Свой профиль поставщика. Витрина проходит ту же модерацию, что и объявление: профиль,
// опубликованный без проверки, ничем не отличается от объявления, обходящего очередь.
import { Link } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { NarrowPage } from '../../shared/ui/FormCard'
import { FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ROUTES } from '../../shared/navigation/routes'
import { ProfileEditor } from './components/ProfileEditor'
import { useSupplierProfile } from './useSupplierProfile'
import styles from './supplierProfile.module.css'

export function SupplierProfilePage() {
  const handle = useSupplierProfile()
  return (
    <>
      <SiteHeader signedIn />
      <main data-testid="supplier-profile-page">
        <Container>
          <NarrowPage>
            <div className={styles.crumbs}>
              <Link to={ROUTES.profile}>Профиль</Link> › Профиль поставщика
            </div>
            <PageSection>
              {handle.isLoading ? <ListSkeleton /> : null}
              {handle.loadError ? (
                <FailureNotice message={handle.loadError.message} onRetry={handle.reload} />
              ) : null}
              {handle.profile ? <ProfileEditor profile={handle.profile} handle={handle} /> : null}
            </PageSection>
          </NarrowPage>
        </Container>
      </main>
    </>
  )
}
