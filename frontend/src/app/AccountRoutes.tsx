import { beginSignIn } from '../shared/session/signIn'
import { ROUTES } from '../shared/navigation/routes'
import { ThicknessSellerPage } from '../features/thickness/ThicknessSellerPage'
import { SellingWizardPage } from '../features/selling/SellingWizardPage'
import { OffersPage } from '../features/offers/OffersPage'
import { ChatsPage } from '../features/chats/ChatsPage'
import { MyListingsPage } from '../features/myListings/MyListingsPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { SupplierApplicationPage } from '../features/profile/SupplierApplicationPage'
import { SupplierProfilePage } from '../features/supplierProfile/SupplierProfilePage'
import { NewRequestPage } from '../features/importRequest/NewRequestPage'
import { OAuthCallbackPage } from '../features/auth/OAuthCallbackPage'
import type { RouteEntry } from './BrowseRoutes'

export function accountRoutes(signedIn: boolean): RouteEntry[] {
  return [
    { path: ROUTES.selling, element: <SellingWizardPage onSignIn={beginSignIn} /> },
    { path: ROUTES.sellingDraft(), element: <SellingWizardPage onSignIn={beginSignIn} /> },
    { path: ROUTES.sellingThickness(), element: <ThicknessSellerPage signedIn={signedIn} /> },
    { path: ROUTES.myListings, element: <MyListingsPage onSignIn={beginSignIn} /> },
    { path: ROUTES.offers, element: <OffersPage onSignIn={beginSignIn} /> },
    { path: ROUTES.chats, element: <ChatsPage onSignIn={beginSignIn} /> },
    { path: ROUTES.chat(), element: <ChatsPage onSignIn={beginSignIn} /> },
    { path: ROUTES.profile, element: <ProfilePage /> },
    { path: ROUTES.supplierApplication, element: <SupplierApplicationPage /> },
    { path: ROUTES.supplierProfile, element: <SupplierProfilePage /> },
    { path: ROUTES.newImportRequest, element: <NewRequestPage /> },
    { path: ROUTES.oauthCallback, element: <OAuthCallbackPage /> },
  ]
}
