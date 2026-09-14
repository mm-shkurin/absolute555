import { Link } from 'react-router-dom'
import { Button, buttonClass } from '../../../shared/ui/Button'
import { Cover } from '../../../shared/ui/Cover'
import { ROUTES } from '../../../shared/navigation/routes'
import type { ConversationHeader } from '../logic/conversation'
import styles from './Conversation.module.css'

interface ConversationTopProps {
  header: ConversationHeader
  onBack?: () => void
  onReview?: () => void
}

export function ConversationTop({ header, onBack, onReview }: ConversationTopProps) {
  return (
    <div className={styles.conversationTop}>
      {onBack ? (
        <button type="button" className={styles.back} onClick={onBack} aria-label="К диалогам">
          ‹
        </button>
      ) : null}
      <Cover className={styles.thumb} url={header.photoUrl} caption="фото" />
      <CounterpartTitle header={header} />
      {header.reviewLabel && onReview ? (
        <Button tone="ghost" size="small" onClick={onReview} data-testid="chat-review">
          {header.reviewLabel}
        </Button>
      ) : null}
      {/* У переписки по заявке объявления нет: кнопка вела бы на несуществующую карточку. */}
      {header.listingId ? (
        <Link
          to={ROUTES.listing(header.listingId)}
          className={buttonClass({ tone: 'ghost', size: 'small' })}
        >
          К объявлению
        </Link>
      ) : null}
    </div>
  )
}

interface CounterpartTitleProps {
  header: ConversationHeader
}

function CounterpartTitle({ header }: CounterpartTitleProps) {
  return (
    <div className={styles.headText}>
      <div className={styles.who}>
        {header.counterpartHref ? (
          <Link to={header.counterpartHref} data-testid="counterpart-link">
            {header.name}
          </Link>
        ) : (
          header.name
        )}
      </div>
      <div className={styles.about}>{header.subtitle}</div>
    </div>
  )
}
