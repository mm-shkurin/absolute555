// Четыре входа в личные разделы. Ссылки, а не кнопки: их открывают в новой вкладке так же
// часто, как переходят.
import { Link } from 'react-router-dom'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { ROUTES } from '../../../shared/navigation/routes'
import type { ShortcutView } from '../logic/profileView'
import styles from '../profile.module.css'

// Отзывы обо мне — это своя публичная страница: там же, где их читают покупатели, а не
// отдельный список, который разошёлся бы с ней.
function targetOf(id: ShortcutView['id'], userId: string): string {
  if (id === 'reviews') return userId ? ROUTES.seller(userId) : ROUTES.profile
  return { listings: ROUTES.myListings, offers: ROUTES.offers, chats: ROUTES.chats }[id]
}

const ICON: Record<ShortcutView['id'], string> = {
  listings: 'спис.',
  offers: 'офф.',
  chats: 'чат',
  reviews: 'отз.',
}

export function Shortcuts({ shortcuts, userId = '' }: { shortcuts: ShortcutView[]; userId?: string }) {
  return (
    <div className={styles.shortcuts} data-testid="profile-shortcuts">
      {shortcuts.map((shortcut) => (
        <Link key={shortcut.id} to={targetOf(shortcut.id, userId)} className={styles.shortcut}>
          <Placeholder className={styles.icon}>{ICON[shortcut.id]}</Placeholder>
          <span>
            <span className={styles.shortcutTitle}>{shortcut.title}</span>
            <span className={styles.shortcutMeta}>{shortcut.meta}</span>
          </span>
        </Link>
      ))}
    </div>
  )
}
