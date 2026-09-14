// Один кэш данных на приложение. Возврат в ленту после карточки показывает уже загруженное,
// а не новый запрос — на телефоне в поле это разница между «мгновенно» и «ещё раз ждать».
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { shouldRetry } from './retryPolicy'

export function createQueryClient(): QueryClient {
  return new QueryClient({
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
}

interface QueryBoundaryProps {
  client: QueryClient
  children: ReactNode
}

export function QueryBoundary({ client, children }: QueryBoundaryProps) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
