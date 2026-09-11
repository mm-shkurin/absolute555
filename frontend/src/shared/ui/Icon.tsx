// Значки в линиях нижней навигации: разделы узнаются по одному рисунку, где бы они ни
// встретились — в таб-баре, в кабинете или в пустой ленте.
import styles from './Icon.module.css'

export type IconName = 'car' | 'ruble' | 'chat' | 'star' | 'document' | 'search'

const PATHS: Record<IconName, React.ReactNode> = {
  car: (
    <>
      <path d="M3 13l2-5a3 3 0 0 1 3-2h8a3 3 0 0 1 3 2l2 5v5h-3M3 18v-5m0 5h3m12 0H6" />
      <circle cx="7.5" cy="15.5" r="1.5" />
      <circle cx="16.5" cy="15.5" r="1.5" />
    </>
  ),
  ruble: <path d="M12 3v18M8 7h6a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h6" />,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" />,
  document: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M10 12h5M10 16h5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
}

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={[styles.icon, className].filter(Boolean).join(' ')} aria-hidden="true">
      {PATHS[name]}
    </svg>
  )
}

/** Значок в плитке: на месте, где в макете стоял серый квадрат с подписью. */
export function IconTile({ name, className }: { name: IconName; className?: string }) {
  return (
    <span className={[styles.tile, className].filter(Boolean).join(' ')}>
      <Icon name={name} />
    </span>
  )
}
