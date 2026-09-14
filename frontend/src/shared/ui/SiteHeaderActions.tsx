import { Link } from 'react-router-dom'
import { ROUTES } from '../navigation/routes'
import { canModerate } from '../session/authSession'
import { useCurrentSession } from '../session/useCurrentSession'
import { useUnreadMessages } from '../session/useUnread'
import { Button, ButtonLink } from './Button'
import { Avatar } from './Avatar'
import { ThemeToggle } from './ThemeToggle'
import styles from './SiteHeader.module.css'

interface SiteHeaderActionsProps {
  signedIn: boolean
  onSignIn?: () => void
}

export function SiteHeaderActions({ signedIn, onSignIn }: SiteHeaderActionsProps) {
  // Число непрочитанных читает сама шапка: панель внизу живёт только на телефоне, и на
  // широком экране бейдж иначе не появляется нигде. Прокинуть его пропом через каждый
  // экран значит забыть его ровно там, где новый экран добавят завтра.
  const unread = useUnreadMessages()
  const session = useCurrentSession()
  return (
    <div className={styles.actions}>
      <ThemeToggle />
      {/* Раздел показывается только тому, кто им пользуется. Не «спрятать кнопку от
          чужого» — маршрут и без того отдаёт чужому «не найдено», — а не занимать
          шапку у того, кому она нужна под ленту и объявление. */}
      {signedIn && canModerate() ? <ModerationLink /> : null}
      {signedIn ? <ChatsLink unread={unread} /> : null}
      {signedIn ? (
        <ProfileLink avatarUrl={session?.avatarUrl} />
      ) : (
        <Button tone="ghost" onClick={onSignIn} data-testid="header-sign-in">
          Войти
        </Button>
      )}
      <ButtonLink to={ROUTES.selling} data-testid="header-sell">
        Разместить
      </ButtonLink>
    </div>
  )
}

function ModerationLink() {
  return (
    <Link
      to={ROUTES.adminSummary}
      className={[styles.chats, styles.moderation].join(' ')}
      data-testid="header-moderation"
    >
      Модерация
    </Link>
  )
}

function ChatsLink({ unread }: { unread: number }) {
  return (
    <Link to={ROUTES.chats} className={styles.chats} aria-label="Чаты">
      Чаты
      {unread > 0 ? (
        <span className={styles.unread} data-testid="header-unread">
          {unread > 9 ? '9+' : unread}
        </span>
      ) : null}
    </Link>
  )
}

function ProfileLink({ avatarUrl }: { avatarUrl: string | null | undefined }) {
  return (
    <Link to={ROUTES.profile} className={styles.avatar} aria-label="Профиль">
      <Avatar size={38} url={avatarUrl} />
    </Link>
  )
}
