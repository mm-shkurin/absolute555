import { ROUTES } from '../shared/navigation/routes'
import { AccessClosedPage } from '../features/auth/AccessClosedPage'
import { ModerationQueuePage } from '../features/moderation/ModerationQueuePage'
import { ComplaintsPage } from '../features/moderation/ComplaintsPage'
import { SupplierQueuePage } from '../features/moderation/SupplierQueuePage'
import { RoleApplicationsPage } from '../features/moderation/RoleApplicationsPage'
import { AdminSummaryPage } from '../features/moderation/AdminSummaryPage'
import { PeoplePage } from '../features/moderation/PeoplePage'
import { PersonPage } from '../features/moderation/PersonPage'
import type { RouteEntry } from './BrowseRoutes'

export function adminRoutes(): RouteEntry[] {
  return [
    { path: ROUTES.accessClosed, element: <AccessClosedPage /> },
    { path: ROUTES.adminSummary, element: <AdminSummaryPage /> },
    { path: ROUTES.adminPeople, element: <PeoplePage /> },
    { path: ROUTES.adminPerson(), element: <PersonPage /> },
    { path: ROUTES.moderationQueue, element: <ModerationQueuePage /> },
    { path: ROUTES.moderationComplaints, element: <ComplaintsPage /> },
    { path: ROUTES.moderationRoles, element: <RoleApplicationsPage /> },
    { path: ROUTES.moderationSuppliers, element: <SupplierQueuePage /> },
  ]
}
