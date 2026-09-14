import { PanelNote } from '../../../shared/ui/Panel'
import type { SupplierProfileWire } from '../../../shared/api/backend/supplierContract'
import { shownStatus } from '../logic/profileRules'
import { STATUS_WORD } from '../logic/profileStatusLabels'
import styles from '../supplierProfile.module.css'

interface ProfileStatusNotesProps {
  profile: SupplierProfileWire
  notice: string | null
}

export function ProfileStatusNotes({ profile, notice }: ProfileStatusNotesProps) {
  const status = shownStatus(profile)
  // Правка опубликованной витрины: покупатели видят прежнюю версию, пока модератор не решит.
  const revising = profile.status === 'published' && status !== 'published'
  return (
    <>
      {notice ? (
        <p className={styles.notice} role="status" data-testid="profile-notice">
          {notice}
        </p>
      ) : null}
      <div className={styles.status} data-testid="profile-status" data-status={status}>
        {revising ? `правка: ${STATUS_WORD[status]}` : STATUS_WORD[status]}
      </div>
      {revising ? (
        <PanelNote>
          Покупатели видят прежнюю версию витрины, пока модератор не одобрит правку.
        </PanelNote>
      ) : null}
      {status === 'rejected' && profile.reject_reason ? (
        <PanelNote>
          Причина отказа: {profile.reject_reason}. Правка вернёт профиль в черновик.
        </PanelNote>
      ) : null}
    </>
  )
}
