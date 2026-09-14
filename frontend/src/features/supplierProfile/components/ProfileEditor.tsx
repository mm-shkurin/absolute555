import { FormCard } from '../../../shared/ui/FormCard'
import type { SupplierProfileWire } from '../../../shared/api/backend/supplierContract'
import { missingForSubmit } from '../logic/profileForm'
import { STATUS_NOTE, isEditable, shownStatus } from '../logic/profileStatus'
import type { SupplierProfileHandle } from '../useSupplierProfile'
import { CoverPicker } from './CoverPicker'
import { ProfileActions } from './ProfileActions'
import { ProfileFields } from './ProfileFields'
import { ProfileMessages } from './ProfileMessages'
import { ProfileStatusNotes } from './ProfileStatusNotes'

interface ProfileEditorProps {
  profile: SupplierProfileWire
  handle: SupplierProfileHandle
}

export function ProfileEditor({ profile, handle }: ProfileEditorProps) {
  const status = shownStatus(profile)
  const canSave = isEditable(status) && !handle.busy
  const gaps = missingForSubmit(handle.form)
  const actions = (
    <ProfileActions
      canSave={canSave}
      canSubmit={canSave && gaps.length === 0}
      onSave={() => void handle.save()}
      onSubmit={() => void handle.submit()}
    />
  )
  const title = 'Профиль поставщика'
  return (
    <FormCard title={title} sub={STATUS_NOTE[status]} testId="supplier-profile-form" nav={actions}>
      <ProfileStatusNotes profile={profile} notice={handle.notice} />
      <CoverPicker
        coverUrl={profile.pending_cover_url ?? profile.cover_url ?? null}
        pending={Boolean(profile.pending_cover_url)}
      />
      <ProfileFields form={handle.form} disabled={!isEditable(status)} onField={handle.setField} />
      <ProfileMessages gaps={gaps} error={handle.error} />
    </FormCard>
  )
}
