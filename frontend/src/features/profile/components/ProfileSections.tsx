import { useNavigate } from 'react-router-dom'
import type { SupplierProfileWire } from '../../../shared/api/backend/supplierContract'
import { currentRole } from '../../../shared/session/authSession'
import { ROUTES } from '../../../shared/navigation/routes'
import type { toProfileView } from '../logic/profileView'
import { ProfileIdentity, type IdentityActions } from './ProfileIdentity'
import { SupplierStorefront } from './SupplierStorefront'
import { ModerationEntry } from './ModerationEntry'
import { Shortcuts } from './Shortcuts'
import { SupplierApplication } from './SupplierApplication'
import { MyRequests } from './MyRequests'

interface ProfileSectionsProps {
  view: ReturnType<typeof toProfileView>
  identity: IdentityActions
  storefront: SupplierProfileWire | undefined
}

export function ProfileSections({ view, identity, storefront }: ProfileSectionsProps) {
  const navigate = useNavigate()
  return (
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
          status={storefront?.status ?? null}
          rejectReason={storefront?.reject_reason ?? null}
        />
      ) : null}
      <Shortcuts shortcuts={view.shortcuts} userId={view.id} />
      <SupplierApplication
        state={view.supplier}
        onApply={() => navigate(ROUTES.supplierApplication)}
      />
      <MyRequests requests={view.requests} />
    </>
  )
}
