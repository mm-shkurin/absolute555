// Подписка на медиазапрос из React. Нужна там, где разметка на телефоне не просто
// перестраивается стилями, а становится другой: список диалогов и переписка — два экрана
// на телефоне и один на планшете, и `display: none` этого не выражает.
import { useSyncExternalStore } from 'react'
import { browserWindow } from './browser'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (listener) => {
      const media = browserWindow()?.matchMedia(query)
      media?.addEventListener('change', listener)
      return () => media?.removeEventListener('change', listener)
    },
    () => browserWindow()?.matchMedia(query).matches ?? false,
    // На сервере медиазапросов нет: считаем экран широким, чтобы разметка не мигала
    // после гидратации на десктопе, где её видит большинство.
    () => false,
  )
}

export const PHONE = '(max-width: 767px)'
