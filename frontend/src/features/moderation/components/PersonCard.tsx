import { PageHeading } from '../../../shared/ui/PageHeading'
import type { toPersonCard } from '../logic/peopleView'
import styles from '../people.module.css'

type PersonCardView = ReturnType<typeof toPersonCard>

interface PersonCardProps {
  card: PersonCardView
}

export function PersonCard({ card }: PersonCardProps) {
  return (
    <>
      <PageHeading
        title={card.name}
        sub={`${card.role}${card.platform ? `, ${card.platform}` : ''}`}
      />
      <PersonFacts card={card} />
      {card.departed ? (
        <p className={styles.departedNotice} data-testid="person-departed">
          Человек удалил свою запись. Писать ему некуда, а закрывать доступ нечего — он уже закрыт.
        </p>
      ) : null}
      {card.blocked ? (
        <p className={styles.blockedNotice} data-testid="person-blocked">
          Доступ закрыт{card.blockedReason ? `: ${card.blockedReason}` : ''}
        </p>
      ) : null}
    </>
  )
}

function PersonFacts({ card }: PersonCardProps) {
  return (
    <dl className={styles.facts} data-testid="person-facts">
      <div>
        <dt>Объявлений</dt>
        <dd data-testid="person-listings">{card.listings}</dd>
      </div>
      <div>
        <dt>Жалоб</dt>
        <dd data-testid="person-complaints">{card.complaints}</dd>
      </div>
      <div>
        <dt>С нами с</dt>
        <dd>{card.since}</dd>
      </div>
    </dl>
  )
}
