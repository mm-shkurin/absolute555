import { Form, Field, TextArea } from '../../../shared/ui/Form'
import type { emptyRoleRequestDraft } from '../logic/roleRequestDraft'
import styles from '../profile.module.css'

type RoleRequestDraft = typeof emptyRoleRequestDraft

interface ApplicationFieldsProps {
  waiting: boolean
  draft: RoleRequestDraft
  onDraft: (draft: RoleRequestDraft) => void
}

export function ApplicationFields({ waiting, draft, onDraft }: ApplicationFieldsProps) {
  if (waiting) {
    return (
      <p className={styles.gaps} data-testid="request-pending">
        Заявка отправлена и ждёт решения. Вторую подать нельзя — модератор ответит по этой.
      </p>
    )
  }
  return (
    <Form>
      <Field label="Зачем вам эта роль" full>
        <TextArea
          value={draft.reason}
          onChange={(value) => onDraft({ ...draft, reason: value })}
          placeholder="Вожу машины из Японии и Кореи, хочу выставлять позиции сам."
        />
      </Field>
      <Field label="Об опыте: сколько возите, через кого работаете" full>
        <TextArea
          value={draft.about}
          onChange={(value) => onDraft({ ...draft, about: value })}
          placeholder="Что можете показать по прошлым поставкам — модератор судит по этому тексту."
        />
      </Field>
    </Form>
  )
}
