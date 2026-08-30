// Четыре входа в личные разделы. Ссылки, а не кнопки: их открывают в новой вкладке так же
// часто, как переходят.
import { Link } from 'react-router-dom'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { ROUTES } from '../../../shared/navigation/routes'
import type { ShortcutView } from '../logic/profileView'
import styles from '../profile.module.css'

const TARGET: Record<ShortcutView['id'], string> = {
  listings: ROUTES.myListings,
  offers: ROUTES.offers,
  chats: ROUTES.chats,
  reviews: ROUTES.profile,
}

const ICON: Record<ShortcutView['id'], string> = {
  listings: 'спис.',
  offers: 'офф.',
  chats: 'чат',
  reviews: 'отз.',
}

export function Shortcuts({ shortcuts }: { shortcuts: ShortcutView[] }) {
  return (
    <div className={styles.shortcuts} data-testid="profile-shortcuts">
      {shortcuts.map((shortcut) => (
        <Link key={shortcut.id} to={TARGET[shortcut.id]} className={styles.shortcut}>
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
