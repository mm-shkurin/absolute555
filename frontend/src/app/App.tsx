// Сборка приложения: роутер и развилка «гость видит лендинг, вошедший — ленту».
//
// Экранов пока нет — каркас поднят до них намеренно, чтобы первая же фича легла в готовые
// границы, а не наоборот. Каждый маршрут ниже ждёт свой срез из
// `ProductSpecification/frontend-architecture.md`, таблица «Срезы Абсолюта».
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useSession } from './useSession'
import { LandingPage } from '../features/landing/LandingPage'
import { FeedPage } from '../features/feed/FeedPage'
import { ListingPage } from '../features/listing/ListingPage'
import { ThicknessPage } from '../features/thickness/ThicknessPage'
import { SellingWizardPage } from '../features/selling/SellingWizardPage'
import { OffersPage } from '../features/offers/OffersPage'
import { ChatsPage } from '../features/chats/ChatsPage'
import { MyListingsPage } from '../features/myListings/MyListingsPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { SellerProfilePage } from '../features/sellerProfile/SellerProfilePage'
import { ImportFeedPage } from '../features/importFeed/ImportFeedPage'
import { ImportRequestPage } from '../features/importRequest/ImportRequestPage'
import { SupplierPage } from '../features/supplier/SupplierPage'
import { ModerationQueuePage } from '../features/moderation/ModerationQueuePage'
import { ComplaintsPage } from '../features/moderation/ComplaintsPage'
import { RoleApplicationsPage } from '../features/moderation/RoleApplicationsPage'
import { OAuthCallbackPage } from '../features/auth/OAuthCallbackPage'
import { NewRequestPage } from '../features/importRequest/NewRequestPage'
import { SupplierApplicationPage } from '../features/profile/SupplierApplicationPage'
import { ROUTES } from '../shared/navigation/routes'

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
        <Route path={ROUTES.home} element={signedIn ? <FeedPage signedIn /> : <LandingPage />} />
        <Route path={ROUTES.feed} element={<FeedPage signedIn={signedIn} />} />
        <Route path={ROUTES.importFeed} element={<ImportFeedPage signedIn={signedIn} />} />
        <Route path={ROUTES.listing()} element={<ListingPage signedIn={signedIn} />} />
        <Route path={ROUTES.thicknessMap()} element={<ThicknessPage signedIn={signedIn} />} />
        <Route path={ROUTES.seller()} element={<SellerProfilePage signedIn={signedIn} />} />
        <Route path={ROUTES.supplier()} element={<SupplierPage signedIn={signedIn} />} />
        <Route path={ROUTES.importRequest()} element={<ImportRequestPage signedIn={signedIn} />} />

        <Route path={ROUTES.selling} element={<SellingWizardPage />} />
        <Route path={ROUTES.myListings} element={<MyListingsPage />} />
        <Route path={ROUTES.offers} element={<OffersPage />} />
        <Route path={ROUTES.chats} element={<ChatsPage />} />
        <Route path={ROUTES.chat()} element={<ChatsPage />} />
        <Route path={ROUTES.profile} element={<ProfilePage />} />
        <Route path={ROUTES.supplierApplication} element={<SupplierApplicationPage />} />
        <Route path={ROUTES.newImportRequest} element={<NewRequestPage />} />

        <Route path={ROUTES.oauthCallback} element={<OAuthCallbackPage />} />

        <Route path={ROUTES.moderationQueue} element={<ModerationQueuePage />} />
        <Route path={ROUTES.moderationComplaints} element={<ComplaintsPage />} />
        <Route path={ROUTES.moderationRoles} element={<RoleApplicationsPage />} />

        <Route path="*" element={<Pending screen="Страница не найдена" />} />
      </Routes>
    </BrowserRouter>
  )
}
