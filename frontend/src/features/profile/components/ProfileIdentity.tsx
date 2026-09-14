// Своё имя и своя фотография. Раньше экран честно писал, что и то и другое пришло от
// провайдера входа и правке не подлежит; с историей 21 это перестало быть правдой.
//
// Форма открывается по кнопке, а не стоит раскрытой: профиль читают чаще, чем правят,
// и поле ввода вместо имени превращает страницу в настройки.
import { useRef } from 'react'
import { Panel } from '../../../shared/ui/Panel'
import { PersonHead } from '../../../shared/ui/Avatar'
import { Button } from '../../../shared/ui/Button'
import { useNameDraft } from '../useNameDraft'
import { IdentityNameForm } from './IdentityNameForm'
import { IdentityButtons } from './IdentityButtons'
import { PhotoPicker } from './PhotoPicker'
import styles from '../identity.module.css'

export interface IdentityActions {
  onRename: (name: string) => void
  onPickPhoto: (file: File) => void
  onDropPhoto: () => void
  onSignOut: () => void
  busy?: boolean
  error?: string | null
}

interface ProfileIdentityProps {
  name: string
  avatarUrl: string | null
  rating: number | null
  line: string
  actions: IdentityActions
}

export function ProfileIdentity({ name, avatarUrl, rating, line, actions }: ProfileIdentityProps) {
  const editor = useNameDraft(name, actions.onRename)
  const picker = useRef<HTMLInputElement>(null)
  const signOut = (
    <Button tone="ghost" onClick={actions.onSignOut} data-testid="profile-sign-out">
      Выйти
    </Button>
  )
  return (
    <Panel first>
      {actions.error ? (
        <p className={styles.identityError} role="alert" data-testid="profile-identity-error">
          {actions.error}
        </p>
      ) : null}
      <PersonHead name={name} avatarUrl={avatarUrl} rating={rating} line={line} action={signOut} />
      {editor.editing ? (
        <IdentityNameForm editor={editor} busy={actions.busy} />
      ) : (
        <IdentityButtons
          hasPhoto={Boolean(avatarUrl)}
          busy={actions.busy}
          onEdit={editor.start}
          onPick={() => picker.current?.click()}
          onDrop={actions.onDropPhoto}
        />
      )}
      <PhotoPicker inputRef={picker} onPick={actions.onPickPhoto} />
    </Panel>
  )
}
