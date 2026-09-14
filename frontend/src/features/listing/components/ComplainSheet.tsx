// Жалоба на объявление: причина из списка плюс необязательный текст. Список, а не поле:
// свободный текст объясняет одному модератору один случай, но только причина отвечает на
// вопрос «на что жалуются чаще всего».
import { Sheet } from '../../../shared/ui/Sheet'
import type { ComplaintReason } from '../../../shared/api/backend/moderationContract'
import { ComplainForm } from './ComplainForm'
import styles from './ComplainSheet.module.css'

interface ComplainSheetProps {
  busy: boolean
  failure: string | null
  sent: boolean
  onClose: () => void
  onSend: (reason: ComplaintReason, text: string) => void
}

export function ComplainSheet({ sent, onClose, ...form }: ComplainSheetProps) {
  return (
    <Sheet title="Пожаловаться на объявление" onClose={onClose} testId="complain-sheet">
      {sent ? (
        <p className={styles.done} data-testid="complain-done">
          Жалоба отправлена. Модератор посмотрит карточку — решение принимает человек.
        </p>
      ) : (
        <ComplainForm {...form} />
      )}
    </Sheet>
  )
}
