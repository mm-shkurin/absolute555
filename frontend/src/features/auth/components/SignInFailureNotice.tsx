import { BigNotice } from '../../../shared/ui/BigNotice'
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { ROUTES } from '../../../shared/navigation/routes'
import { beginSignIn } from '../../../shared/session/signIn'

interface SignInFailureNoticeProps {
  failure: string
}

export function SignInFailureNotice({ failure }: SignInFailureNoticeProps) {
  return (
    <BigNotice
      icon="✕"
      tone="bad"
      title="Войти не получилось"
      actions={
        <>
          <Button onClick={beginSignIn}>Попробовать снова</Button>
          <ButtonLink to={ROUTES.feed} tone="ghost">
            Вернуться в ленту
          </ButtonLink>
        </>
      }
      fine="Данные не пострадали: объявление и черновик на месте."
    >
      {failure}
    </BigNotice>
  )
}
