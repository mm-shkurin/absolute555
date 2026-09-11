// Четыре входа в личные разделы. Ссылки, а не кнопки: их открывают в новой вкладке так же
// часто, как переходят.
import { Link } from 'react-router-dom'
import { IconTile, type IconName } from '../../../shared/ui/Icon'
import { ROUTES } from '../../../shared/navigation/routes'
import type { ShortcutView } from '../logic/profileView'
import styles from '../profile.module.css'

// Отзывы обо мне — это своя публичная страница: там же, где их читают покупатели, а не
// отдельный список, который разошёлся бы с ней.
function targetOf(id: ShortcutView['id'], userId: string): string {
  if (id === 'reviews') return userId ? ROUTES.seller(userId) : ROUTES.profile
  return { listings: ROUTES.myListings, offers: ROUTES.offers, chats: ROUTES.chats }[id]
}

// Те же рисунки, что у разделов в нижней навигации: раздел узнают по значку.
const ICON: Record<ShortcutView['id'], IconName> = {
  listings: 'car',
  offers: 'ruble',
  chats: 'chat',
  reviews: 'star',
}

export function Shortcuts({ shortcuts, userId = '' }: { shortcuts: ShortcutView[]; userId?: string }) {
  return (
    <div className={styles.shortcuts} data-testid="profile-shortcuts">
      {shortcuts.map((shortcut) => (
        <Link key={shortcut.id} to={targetOf(shortcut.id, userId)} className={styles.shortcut}>
          <IconTile name={ICON[shortcut.id]} className={styles.icon} />
          <span>
            <span className={styles.shortcutTitle}>{shortcut.title}</span>
            <span className={styles.shortcutMeta}>{shortcut.meta}</span>
          </span>
        </Link>
      ))}
    </div>
  )
}
