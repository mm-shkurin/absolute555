// Карточка человека: по чему о нём судят и что с ним можно сделать.
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { Button } from '../../shared/ui/Button'
import { blockUser, fetchUserCard, unblockUser } from '../../shared/api/backend/adminApi'
import { currentRole } from '../../shared/session/authSession'
import { AccessDialog } from './components/AccessDialog'
import { ModerationNav } from './components/ModerationNav'
import { PersonJournal } from './components/PersonJournal'
import { toPersonCard } from './logic/peopleView'
import styles from './people.module.css'

export function PersonPage() {
  const { userId = '' } = useParams()
  const client = useQueryClient()
  const [dialog, setDialog] = useState<'block' | 'unblock' | null>(null)

  const card = useQuery({
    queryKey: ['person', userId],
    queryFn: ({ signal }) => fetchUserCard(userId, signal),
    enabled: userId !== '',
  })

  const change = useMutation({
    mutationFn: ({ mode, reason }: { mode: 'block' | 'unblock'; reason: string }) =>
      mode === 'block' ? blockUser(userId, reason) : unblockUser(userId, reason),
    onSuccess: () => {
      setDialog(null)
      // Обновляются и карточка, и журнал: действие меняет обе выдачи, и человек,
      // закрывший доступ, ждёт увидеть запись о том, что он только что сделал.
      void client.invalidateQueries({ queryKey: ['person', userId] })
      void client.invalidateQueries({ queryKey: ['person-journal', userId] })
      void client.invalidateQueries({ queryKey: ['people'] })
    },
  })

  return (
    <>
      <SiteHeader signedIn />
      <main data-testid="admin-person">
        <Container>
          <ModerationNav />
          <PageSection>
            {card.isPending ? <ListSkeleton rows={4} /> : null}
            {card.isError ? (
              <FailureNotice
                message="Не удалось открыть карточку"
                onRetry={() => void card.refetch()}
              />
            ) : null}
            {card.isSuccess ? <Card card={toPersonCard(card.data)} /> : null}

            {card.isSuccess ? (
              <div className={styles.actions}>
                {dialog === null ? (
                  <Button
                    tone={card.data.is_blocked ? 'ghost' : undefined}
                    onClick={() => setDialog(card.data.is_blocked ? 'unblock' : 'block')}
                    data-testid="access-open"
                  >
                    {card.data.is_blocked ? 'Вернуть доступ' : 'Закрыть доступ'}
                  </Button>
                ) : (
                  <AccessDialog
                    mode={dialog}
                    busy={change.isPending}
                    onCancel={() => setDialog(null)}
                    onConfirm={(reason) => change.mutate({ mode: dialog, reason })}
                  />
                )}
                {change.isError ? (
                  <p className={styles.reasonError} data-testid="access-failed">
                    Сервер отказал. Возможно, эта запись не в вашей власти.
                  </p>
                ) : null}
              </div>
            ) : null}

            {card.isSuccess && currentRole() === 'admin' ? (
              <>
                <PageHeading title="Журнал" sub="Что делали с этой записью" />
                <PersonJournal userId={userId} />
              </>
            ) : null}
          </PageSection>
        </Container>
      </main>
    </>
  )
}

function Card({ card }: { card: ReturnType<typeof toPersonCard> }) {
  return (
    <>
      <PageHeading title={card.name} sub={`${card.role}${card.platform ? `, ${card.platform}` : ''}`} />
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
      {card.departed ? (
        <p className={styles.departedNotice} data-testid="person-departed">
          Человек удалил свою запись. Писать ему некуда, а закрывать доступ нечего — он
          уже закрыт.
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
