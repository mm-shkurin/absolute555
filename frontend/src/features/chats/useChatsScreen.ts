import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PHONE, useMediaQuery } from '../../shared/lib/useMediaQuery'
import { useReview } from '../../shared/review/useReview'
import { useChats } from './useChats'
import { useConversation } from './useConversation'

export function useChatsScreen() {
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
  const review = useReview()
  return { chats, current, phone, conversation, review, select: setSelected }
}
