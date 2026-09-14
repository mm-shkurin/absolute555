// Сборка приложения: роутер и развилка «гость видит лендинг, вошедший — ленту».
//
// Каждый маршрут ждёт свой срез из `ProductSpecification/frontend-architecture.md`,
// таблица «Срезы Абсолюта».
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useCurrentSession } from '../shared/session/useCurrentSession'
import { AccessClosedWatch } from '../features/auth/components/AccessClosedWatch'
import { TabBar } from '../shared/ui/TabBar'
import { useUnreadMessages } from '../shared/session/useUnread'
import { accountRoutes } from './AccountRoutes'
import { adminRoutes } from './AdminRoutes'
import { browseRoutes } from './BrowseRoutes'
import { PendingScreen } from './PendingScreen'

export function App() {
  const signedIn = useCurrentSession() !== null
  const unread = useUnreadMessages()
  const routes = [...browseRoutes(signedIn), ...accountRoutes(signedIn), ...adminRoutes()]

  return (
    <BrowserRouter>
      <AccessClosedWatch />
      <Routes>
        {routes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
        <Route path="*" element={<PendingScreen screen="Страница не найдена" />} />
      </Routes>
      <TabBar counts={{ chats: unread }} />
    </BrowserRouter>
  )
}
