// Число непрочитанных для бейджа в таб-баре.
//
// Отдельный запрос, а не подсчёт по выдаче диалогов: бейдж рисуется на каждом экране, и
// страница диалогов ради одного числа приезжала бы на каждом переходе. Обновляется тем же
// ключом, что дёргают чат и живой поток.
import { useQuery } from '@tanstack/react-query'
import { fetchUnread } from '../api/backend/chatApi'
import { isSignedIn } from './authSession'

export function useUnreadMessages(): number {
  const result = useQuery({
    queryKey: ['chat-unread'],
    queryFn: ({ signal }) => fetchUnread(signal),
    // Гостю считать нечего: у него нет ни диалогов, ни сессии, чтобы их спросить.
    enabled: isSignedIn(),
  })
  return result.data?.unread ?? 0
}
