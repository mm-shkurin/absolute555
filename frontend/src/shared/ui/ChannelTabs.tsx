import { Link } from 'react-router-dom'
import { ROUTES } from '../navigation/routes'
import styles from './ChannelTabs.module.css'

export type Channel = 'available' | 'import'

// Каналы — разные адреса, поэтому вкладки ссылки: «под заказ» переживает перезагрузку
// страницы и отправляется другому человеку одной ссылкой.
export function ChannelTabs({ current }: { current: Channel }) {
  return (
    <div className={styles.tabs} data-testid="channel-tabs">
      <Link
        to={ROUTES.feed}
        className={styles.tab}
        aria-current={current === 'available' ? 'page' : undefined}
      >
        В наличии
      </Link>
      <Link
        to={ROUTES.importFeed}
        className={styles.tab}
        aria-current={current === 'import' ? 'page' : undefined}
      >
        Под заказ
      </Link>
    </div>
  )
}
