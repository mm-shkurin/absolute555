import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { initTheme } from './shared/theme/themeStore'
import { browserDocument } from './shared/lib/browser'
import { QueryBoundary } from './shared/query/QueryBoundary'

// Страховка, а не механизм: тему на <html> уже поставил инлайновый скрипт из index.html
// до первой отрисовки. Это повторение закрывает единственный случай, который тот скрипт
// закрыть не может, — политику безопасности, запрещающую инлайновый скрипт. Без него
// приложение осталось бы навсегда светлым и нигде бы про это не сказало.
initTheme()

// Режим фикстур: `npm run dev:mock` и сборка `--mode mock` под браузерные сценарии.
// Импорт динамический и под флагом; сам флаг подставляется только в этом режиме
// (`vite.config.ts`, `define`), поэтому в обычной сборке ветка вырезается вместе с папкой
// `src/dev/`. Проверки на DEV здесь нет намеренно: сценарии гоняют собранное приложение,
// а дев-сервер под ними умирал от необработанного ECONNRESET при закрытии браузера.
if (import.meta.env.VITE_MOCK === '1') {
  const { installMockServer, installMockSession } = await import('./dev/mockServer')
  installMockServer()
  installMockSession()
}

const host = browserDocument()?.getElementById('root')
if (!host) throw new Error('Не найден корневой элемент #root — проверьте index.html.')

createRoot(host).render(
  <StrictMode>
    <QueryBoundary>
      <App />
    </QueryBoundary>
  </StrictMode>,
)
