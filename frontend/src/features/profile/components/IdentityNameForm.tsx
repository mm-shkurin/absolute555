import { Button } from '../../../shared/ui/Button'
import { Field, TextInput } from '../../../shared/ui/Form'
import type { NameDraft } from '../useNameDraft'
import styles from '../identity.module.css'

interface IdentityNameFormProps {
  editor: NameDraft
  busy: boolean | undefined
}

export function IdentityNameForm({ editor, busy }: IdentityNameFormProps) {
  return (
    <div className={styles.identityForm}>
      <Field label="Как вас зовут" full>
        <TextInput
          value={editor.draft}
          onChange={editor.setDraft}
          placeholder="Имя и фамилия"
          testId="profile-name-input"
        />
      </Field>
      <div className={styles.identityActions}>
        <Button onClick={editor.save} disabled={busy} data-testid="profile-name-save">
          Сохранить
        </Button>
        <Button tone="ghost" onClick={editor.cancel}>
          Отмена
        </Button>
      </div>
    </div>
  )
}
