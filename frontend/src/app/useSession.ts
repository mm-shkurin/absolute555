// Подписка React на стор сессии.
//
// Через `useSyncExternalStore`, а не через `useState` плюс эффект: стор живёт вне React,
// и пара «состояние + подписка в эффекте» отдаёт устаревшее значение при первом рендере
// после навигации — экран успевает моргнуть кнопками гостя вошедшему человеку.
import { useSyncExternalStore } from 'react'
import { currentSession, subscribeToSession, type Session } from '../shared/session/authSession'

export function useSession(): Session | null {
  return useSyncExternalStore(subscribeToSession, currentSession, serverSnapshot)
}

// На сервере сессии нет по определению. Отдельная функция, а не стрелка по месту:
// новая ссылка на каждый рендер заставляет React считать снимок изменившимся.
function serverSnapshot(): Session | null {
  return null
}
