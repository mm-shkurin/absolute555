// Своё имя и своя фотография. Раньше экран честно писал, что и то и другое пришло от
// провайдера входа и правке не подлежит; с историей 21 это перестало быть правдой.
//
// Форма открывается по кнопке, а не стоит раскрытой: профиль читают чаще, чем правят,
// и поле ввода вместо имени превращает страницу в настройки.
import { useRef, useState } from 'react'
import { Panel } from '../../../shared/ui/Panel'
import { PersonHead } from '../../../shared/ui/Avatar'
import { Button } from '../../../shared/ui/Button'
import { Field, TextInput } from '../../../shared/ui/Form'
import styles from '../profile.module.css'

export interface IdentityActions {
  onRename: (name: string) => void
  onPickPhoto: (file: File) => void
  onDropPhoto: () => void
  onSignOut: () => void
  busy?: boolean
  error?: string | null
}

export function ProfileIdentity({
  name,
  avatarUrl,
  rating,
  line,
  actions,
}: {
  name: string
  avatarUrl: string | null
  rating: number | null
  line: string
  actions: IdentityActions
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const picker = useRef<HTMLInputElement>(null)

  const save = () => {
    actions.onRename(draft.trim())
    setEditing(false)
  }

  return (
    <Panel first>
      {actions.error ? (
        <p className={styles.identityError} role="alert" data-testid="profile-identity-error">
          {actions.error}
        </p>
      ) : null}
      <PersonHead
        name={name}
        avatarUrl={avatarUrl}
        rating={rating}
        line={line}
        action={
          <Button tone="ghost" onClick={actions.onSignOut} data-testid="profile-sign-out">
            Выйти
          </Button>
        }
      />
      {editing ? (
        <div className={styles.identityForm}>
          <Field label="Как вас зовут" full>
            <TextInput
              value={draft}
              onChange={setDraft}
              placeholder="Имя и фамилия"
              testId="profile-name-input"
            />
          </Field>
          <div className={styles.identityActions}>
            <Button onClick={save} disabled={actions.busy} data-testid="profile-name-save">
              Сохранить
            </Button>
            <Button tone="ghost" onClick={() => setEditing(false)}>
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.identityActions}>
          <Button
            tone="ghost"
            onClick={() => {
              setDraft(name)
              setEditing(true)
            }}
            data-testid="profile-name-edit"
          >
            Изменить имя
          </Button>
          <Button
            tone="ghost"
            onClick={() => picker.current?.click()}
            disabled={actions.busy}
            data-testid="profile-photo-pick"
          >
            {avatarUrl ? 'Заменить фото' : 'Добавить фото'}
          </Button>
          {avatarUrl ? (
            <Button tone="ghost" onClick={actions.onDropPhoto} data-testid="profile-photo-drop">
              Убрать фото
            </Button>
          ) : null}
        </div>
      )}
      <input
        ref={picker}
        type="file"
        accept="image/jpeg,image/png"
        className={styles.picker}
        data-testid="profile-photo-file"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) actions.onPickPhoto(file)
          event.target.value = ''
        }}
      />
    </Panel>
  )
}
