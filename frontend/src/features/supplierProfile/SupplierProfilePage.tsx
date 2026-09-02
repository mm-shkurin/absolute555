// Свой профиль поставщика. Витрина проходит ту же модерацию, что и объявление: профиль,
// опубликованный без проверки, ничем не отличается от объявления, обходящего очередь.
import { Link } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { FormCard, NarrowPage, NavSpacer } from '../../shared/ui/FormCard'
import { Button } from '../../shared/ui/Button'
import { PanelNote } from '../../shared/ui/Panel'
import { FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ROUTES } from '../../shared/navigation/routes'
import { ProfileFields } from './components/ProfileFields'
import { missingForSubmit } from './logic/profileForm'
import { STATUS_NOTE, STATUS_WORD, isEditable } from './logic/profileStatus'
import { useSupplierProfile } from './useSupplierProfile'
import styles from './supplierProfile.module.css'

export function SupplierProfilePage() {
  const handle = useSupplierProfile()
  const status = handle.profile?.status ?? 'draft'
  const editable = isEditable(status)
  const gaps = missingForSubmit(handle.form)

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
              {handle.profile ? (
                <FormCard
                  title="Профиль поставщика"
                  sub={STATUS_NOTE[status]}
                  testId="supplier-profile-form"
                  nav={
                    <>
                      <Button
                        tone="ghost"
                        disabled={!editable || handle.busy}
                        onClick={() => void handle.save()}
                        data-testid="profile-save"
                      >
                        Сохранить
                      </Button>
                      <NavSpacer />
                      <Button
                        disabled={!editable || handle.busy || gaps.length > 0}
                        onClick={() => void handle.submit()}
                        data-testid="profile-submit"
                      >
                        Отправить на проверку
                      </Button>
                    </>
                  }
                >
                  <div className={styles.status} data-testid="profile-status" data-status={status}>
                    {STATUS_WORD[status]}
                  </div>
                  {status === 'rejected' && handle.profile.reject_reason ? (
                    <PanelNote>
                      Причина отказа: {handle.profile.reject_reason}. Правка вернёт профиль в
                      черновик.
                    </PanelNote>
                  ) : null}
                  <ProfileFields
                    form={handle.form}
                    disabled={!editable}
                    onField={handle.setField}
                  />
                  {gaps.length > 0 ? (
                    <p className={styles.gaps} data-testid="profile-gaps">
                      Для отправки не хватает: {gaps.join(', ')}.
                    </p>
                  ) : null}
                  {handle.error ? (
                    <p className={styles.refused} role="alert" data-testid="profile-error">
                      {handle.error}
                    </p>
                  ) : null}
                </FormCard>
              ) : null}
            </PageSection>
          </NarrowPage>
        </Container>
      </main>
    </>
  )
}
