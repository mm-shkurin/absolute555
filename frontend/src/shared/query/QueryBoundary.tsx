// Один кэш данных на приложение. Возврат в ленту после карточки показывает уже загруженное,
// а не новый запрос — на телефоне в поле это разница между «мгновенно» и «ещё раз ждать».
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { isSessionExpired } from '../session/authorizedRequest'
import { isHttpError } from '../api/httpClient'

const client = new QueryClient({
  defaultOptions: {
    queries: {
      // Минута: лента и карточка меняются со скоростью человека, а не биржи. Более короткое
      // окно означало бы повторный запрос при каждом возврате назад.
      staleTime: 60_000,
      // Перезапрос при фокусе окна выключен намеренно: на мобилке возврат в приложение —
      // обычное дело, и каждый такой возврат перезагружал бы ленту под пальцем.
      refetchOnWindowFocus: false,
      retry: shouldRetry,
    },
    mutations: {
      // Мутации не повторяем никогда. Второй POST оффера — это второй оффер, а второй
      // POST объявления — второе объявление на модерации.
      retry: false,
    },
  },
})

// Повторяем только то, что могло получиться со второго раза. Истёкшая сессия ведёт на
// экран входа, а 4xx — это ответ сервера «так нельзя», и он не изменится от повтора.
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isSessionExpired(error)) return false
  if (isHttpError(error) && error.status < 500) return false
  return failureCount < 2
}

export function QueryBoundary({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
