// Карточка человека: по чему о нём судят и что с ним можно сделать.
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { PageHeading } from '../../shared/ui/PageHeading'
import { QueryStates } from '../../shared/ui/QueryStates'
import { fetchUserCard } from '../../shared/api/backend/adminApi'
import { currentRole } from '../../shared/session/authSession'
import { ModerationPage } from './components/ModerationPage'
import { PersonAccess } from './components/PersonAccess'
import { PersonCard } from './components/PersonCard'
import { PersonJournal } from './components/PersonJournal'
import { toPersonCard } from './logic/peopleView'

export function PersonPage() {
  const { userId = '' } = useParams()
  const card = useQuery({
    queryKey: ['person', userId],
    queryFn: ({ signal }) => fetchUserCard(userId, signal),
    enabled: userId !== '',
  })

  return (
    <ModerationPage testId="admin-person">
      <QueryStates query={card} isEmpty={false} failureMessage="Не удалось открыть карточку" />
      {card.isSuccess ? (
        <>
          <PersonCard card={toPersonCard(card.data)} />
          <PersonAccess userId={userId} blocked={card.data.is_blocked} />
        </>
      ) : null}
      {card.isSuccess && currentRole() === 'admin' ? (
        <>
          <PageHeading title="Журнал" sub="Что делали с этой записью" />
          <PersonJournal userId={userId} />
        </>
      ) : null}
    </ModerationPage>
  )
}
