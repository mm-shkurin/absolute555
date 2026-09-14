import styles from '../supplierProfile.module.css'

interface ProfileMessagesProps {
  gaps: string[]
  error: string | null
}

export function ProfileMessages({ gaps, error }: ProfileMessagesProps) {
  return (
    <>
      {gaps.length > 0 ? (
        <p className={styles.gaps} data-testid="profile-gaps">
          Для отправки не хватает: {gaps.join(', ')}.
        </p>
      ) : null}
      {error ? (
        <p className={styles.refused} role="alert" data-testid="profile-error">
          {error}
        </p>
      ) : null}
    </>
  )
}
