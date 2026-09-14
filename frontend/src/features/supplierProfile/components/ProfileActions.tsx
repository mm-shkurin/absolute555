import { Button } from '../../../shared/ui/Button'
import { NavSpacer } from '../../../shared/ui/FormCard'

interface ProfileActionsProps {
  canSave: boolean
  canSubmit: boolean
  onSave: () => void
  onSubmit: () => void
}

export function ProfileActions({ canSave, canSubmit, onSave, onSubmit }: ProfileActionsProps) {
  return (
    <>
      <Button tone="ghost" disabled={!canSave} onClick={onSave} data-testid="profile-save">
        Сохранить
      </Button>
      <NavSpacer />
      <Button disabled={!canSubmit} onClick={onSubmit} data-testid="profile-submit">
        Отправить на проверку
      </Button>
    </>
  )
}
