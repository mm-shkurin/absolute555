import styles from './ThicknessBadge.module.css'

export function ThicknessBadge({ label }: { label: string | null }) {
  if (!label) return null
  return <span className={styles.badge}>{label}</span>
}
