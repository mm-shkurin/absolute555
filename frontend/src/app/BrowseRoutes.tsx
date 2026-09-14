import type { ReactElement } from 'react'
import { beginSignIn } from '../shared/session/signIn'
import { ROUTES } from '../shared/navigation/routes'
import { LandingPage } from '../features/landing/LandingPage'
import { FeedPage } from '../features/feed/FeedPage'
import { ListingPage } from '../features/listing/ListingPage'
import { ThicknessPage } from '../features/thickness/ThicknessPage'
import { SellerProfilePage } from '../features/sellerProfile/SellerProfilePage'
import { ImportFeedPage } from '../features/importFeed/ImportFeedPage'
import { ImportRequestPage } from '../features/importRequest/ImportRequestPage'
import { SupplierPage } from '../features/supplier/SupplierPage'

export interface RouteEntry {
  path: string
  element: ReactElement
}

export function browseRoutes(signedIn: boolean): RouteEntry[] {
  const home = signedIn ? (
    <FeedPage signedIn onSignIn={beginSignIn} />
  ) : (
    <LandingPage onSignIn={beginSignIn} />
  )
  return [
    { path: ROUTES.home, element: home },
    { path: ROUTES.landing, element: <LandingPage signedIn={signedIn} onSignIn={beginSignIn} /> },
    { path: ROUTES.feed, element: <FeedPage signedIn={signedIn} onSignIn={beginSignIn} /> },
    { path: ROUTES.importFeed, element: <ImportFeedPage signedIn={signedIn} /> },
    { path: ROUTES.listing(), element: <ListingPage signedIn={signedIn} onSignIn={beginSignIn} /> },
    {
      path: ROUTES.thicknessMap(),
      element: <ThicknessPage signedIn={signedIn} onSignIn={beginSignIn} />,
    },
    { path: ROUTES.seller(), element: <SellerProfilePage signedIn={signedIn} /> },
    { path: ROUTES.supplier(), element: <SupplierPage signedIn={signedIn} /> },
    { path: ROUTES.importRequest(), element: <ImportRequestPage signedIn={signedIn} /> },
  ]
}
