// Сборка приложения: роутер и развилка «гость видит лендинг, вошедший — ленту».
//
// Экранов пока нет — каркас поднят до них намеренно, чтобы первая же фича легла в готовые
// границы, а не наоборот. Каждый маршрут ниже ждёт свой срез из
// `ProductSpecification/frontend-architecture.md`, таблица «Срезы Абсолюта».
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useSession } from './useSession'
import { ROUTES } from './routes'

// Заглушка до появления первой фичи. Ровно одна, названная заглушкой: несколько
// «временных» пустых компонентов расползаются по кодовой базе и переживают всех.
function Pending({ screen }: { screen: string }) {
  return (
    <main style={{ padding: '48px 24px' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
        КАРКАС
      </p>
      <h1 style={{ fontSize: 28, marginTop: 8 }}>{screen}</h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
        Экран ещё не перенесён из мокапа. Разметка — в{' '}
        <code>ProductSpecification/ui/mockups/index.html</code>.
      </p>
    </main>
  )
}

export function App() {
  const session = useSession()
  const signedIn = session !== null

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path={ROUTES.home}
          element={<Pending screen={signedIn ? 'Лента' : 'Лендинг'} />}
        />
        <Route path={ROUTES.feed} element={<Pending screen="Лента" />} />
        <Route path={ROUTES.importFeed} element={<Pending screen="Под заказ" />} />
        <Route path={ROUTES.listing()} element={<Pending screen="Карточка объявления" />} />
        <Route path={ROUTES.thicknessMap()} element={<Pending screen="Карта замеров" />} />
        <Route path={ROUTES.seller()} element={<Pending screen="Профиль продавца" />} />
        <Route path={ROUTES.supplier()} element={<Pending screen="Профиль поставщика" />} />
        <Route path={ROUTES.importRequest()} element={<Pending screen="Заявка на привоз" />} />

        <Route path={ROUTES.selling} element={<Pending screen="Мастер продажи" />} />
        <Route path={ROUTES.myListings} element={<Pending screen="Мои объявления" />} />
        <Route path={ROUTES.offers} element={<Pending screen="Офферы" />} />
        <Route path={ROUTES.chats} element={<Pending screen="Чаты" />} />
        <Route path={ROUTES.chat()} element={<Pending screen="Переписка" />} />
        <Route path={ROUTES.profile} element={<Pending screen="Профиль" />} />

        <Route path={ROUTES.oauthCallback} element={<Pending screen="Возврат из OAuth" />} />

        <Route path={ROUTES.moderationQueue} element={<Pending screen="Очередь модерации" />} />
        <Route path={ROUTES.moderationComplaints} element={<Pending screen="Жалобы" />} />
        <Route path={ROUTES.moderationRoles} element={<Pending screen="Заявки на роль" />} />

        <Route path="*" element={<Pending screen="Страница не найдена" />} />
      </Routes>
    </BrowserRouter>
  )
}
