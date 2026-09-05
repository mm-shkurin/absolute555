// Вход в кабинет модератора из своего профиля.
//
// Ссылка в шапке живёт только на десктопе — там строка уже занята, и шестая ссылка
// выталкивала её за край окна. Профиль открыт с любой ширины, и это единственное место,
// куда модератор заходит и так: своя роль, свои разделы, одна страница.
//
// Показывается по роли из сессии, но ничего не решает: доступ проверяет сервер, а чужому
// человеку маршрут отдаёт «не найдено». Скрытый блок здесь — про то, чтобы не занимать
// экран разделом, которого у большинства нет.
import { Link } from 'react-router-dom'
import { canModerate, currentRole } from '../../../shared/session/authSession'
import { ROUTES } from '../../../shared/navigation/routes'
import styles from '../profile.module.css'

const WHAT_THEY_DO: Record<string, string> = {
  manager: 'Очередь объявлений, жалобы, заявки на роль и учётные записи.',
  admin: 'Очередь и жалобы, учётные записи, роли и журнал действий.',
}

export function ModerationEntry() {
  if (!canModerate()) return null

  return (
    <section className={styles.moderationEntry} data-testid="profile-moderation">
      <div>
        <b>Кабинет модератора</b>
        <p className={styles.shortcutMeta}>
          {WHAT_THEY_DO[currentRole()] ?? WHAT_THEY_DO.manager}
        </p>
      </div>
      <Link to={ROUTES.adminSummary} className={styles.moderationLink}>
        Перейти
      </Link>
    </section>
  )
}
