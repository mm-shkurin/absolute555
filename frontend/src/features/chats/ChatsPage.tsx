// Чаты. Переписка привязана к объявлению, а не к человеку: один и тот же покупатель может
// торговаться за две машины, и это два разных разговора.
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading } from '../../shared/ui/PageHeading'
import { ReviewSheetFor } from '../../shared/review/ReviewSheetFor'
import { ChatsBoard } from './components/ChatsBoard'
import { ChatsStatus } from './components/ChatsStatus'
import { useChatsScreen } from './useChatsScreen'
import styles from './chats.module.css'

export function ChatsPage({ onSignIn }: { onSignIn?: () => void }) {
  const { chats, current, phone, conversation, review, select } = useChatsScreen()
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
            <ChatsStatus chats={chats} />
            {chats.dialogs.length > 0 ? (
              <ChatsBoard
                dialogs={chats.dialogs}
                current={current}
                phone={phone}
                conversation={conversation}
                review={review}
                onSelect={select}
              />
            ) : null}
          </div>
        </Container>
      </main>
      <ReviewSheetFor review={review} newTitle="Отзыв о собеседнике" />
    </>
  )
}
