import { Button } from '../../../shared/ui/Button'
import { FormCard, NavSpacer } from '../../../shared/ui/FormCard'
import { PanelNote } from '../../../shared/ui/Panel'
import { failureText } from '../../../shared/api/failureText'
import { useNewRequest } from '../useNewRequest'
import { RequestFormFields } from './RequestFormFields'
import styles from '../request.module.css'

export function NewRequestCard() {
  const form = useNewRequest()
  const nav = (
    <>
      <Button tone="ghost" onClick={form.cancel}>
        Отмена
      </Button>
      <NavSpacer />
      <Button
        disabled={form.gaps.length > 0 || form.open.isPending}
        onClick={() => form.open.mutate()}
        data-testid="publish-request"
      >
        Опубликовать заявку
      </Button>
    </>
  )
  return (
    <FormCard
      title="Опишите, что нужно привезти"
      sub="Заявку увидят одобренные поставщики и ответят ценой под ключ и сроком. Это не покупка — вы ничего не платите и ни к чему не обязаны."
      testId="request-form"
      nav={nav}
    >
      <RequestFormFields form={form} />
      <NewRequestFeedback gaps={form.gaps} error={form.open.error} />
    </FormCard>
  )
}

interface NewRequestFeedbackProps {
  gaps: string[]
  error: Error | null
}

function NewRequestFeedback({ gaps, error }: NewRequestFeedbackProps) {
  return (
    <>
      {gaps.length > 0 ? <p className={styles.gaps}>Не хватает: {gaps.join(', ')}.</p> : null}
      {error ? (
        <p className={styles.refused} role="alert" data-testid="request-error">
          {failureText(error)}
        </p>
      ) : null}
      <PanelNote>
        Открытых заявок может быть не больше трёх. Закрытая заявка откликов не принимает —
        поставщики видят только открытые.
      </PanelNote>
    </>
  )
}
