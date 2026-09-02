// Чаты. Переписка привязана к объявлению, а не к человеку: один и тот же покупатель может
// торговаться за две машины, и это два разных разговора.
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading } from '../../shared/ui/PageHeading'
import { EmptyNotice, FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { DialogList } from './components/DialogList'
import { Conversation } from './components/Conversation'
import { PHONE, useMediaQuery } from '../../shared/lib/useMediaQuery'
import { useChats, useConversation } from './useChats'
import styles from './chats.module.css'

export function ChatsPage({ onSignIn }: { onSignIn?: () => void }) {
  const now = new Date()
  const { chatId } = useParams()
  const chats = useChats(now)
  const [selected, setSelected] = useState<string | null>(chatId ?? null)
  // На телефоне список и переписка — два экрана, а не две колонки: переписка занимает
  // экран целиком, и вернуться к списку надо кнопкой, а не прокруткой в сторону.
  const phone = useMediaQuery(PHONE)
  const fallback = phone ? null : (chats.chats[0]?.id ?? null)
  const current = chats.chats.find((chat) => chat.id === (selected ?? fallback)) ?? null
  const conversation = useConversation(current, now)

  return (
    <>
      <SiteHeader signedIn onSignIn={onSignIn} />
      <main data-testid="chats">
        <Container>
          <div className={styles.screen}>
            <PageHeading
              title="Чаты"
              sub="Переписка привязана к объявлению. Телефон в чат не подставляется — продавец даёт его сам, если хочет."
            />
            {chats.isLoading ? <ListSkeleton /> : null}
            {!chats.isLoading && chats.error ? (
              <FailureNotice message={chats.error.message} onRetry={chats.retry} />
            ) : null}
            {!chats.isLoading && !chats.error && chats.dialogs.length === 0 ? (
              <EmptyNotice title="Переписок пока нет">
                Чат заводится с карточки объявления — кнопкой «Написать».
              </EmptyNotice>
            ) : null}
            {chats.dialogs.length > 0 ? (
              <div className={styles.chat} data-view={phone && current ? 'conversation' : 'list'}>
                <DialogList
                  dialogs={chats.dialogs}
                  current={current?.id ?? null}
                  onSelect={setSelected}
                />
                {conversation.header ? (
                  <Conversation
                    header={conversation.header}
                    messages={conversation.messages}
                    onSend={conversation.send}
                    onBack={phone ? () => setSelected(null) : undefined}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </Container>
      </main>
    </>
  )
}
