import { Route, Routes } from 'react-router'
import AppLayout from './components/layout/AppLayout'
import BillingPage from './pages/BillingPage'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import MaintenancePage from './pages/MaintenancePage'
import NotFoundPage from './pages/NotFoundPage'
import OccupanciesPage from './pages/OccupanciesPage'
import PaymentsPage from './pages/PaymentsPage'
import ReportsPage from './pages/ReportsPage'
import RoomDetailsPage from './pages/RoomDetailsPage'
import RoomsPage from './pages/RoomsPage'
import TenantDetailsPage from './pages/TenantDetailsPage'
import TenantsPage from './pages/TenantsPage'

// All 12 pages (CLAUDE.md §7).
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* These pages share the sidebar layout. AppLayout shows them through its <Outlet />. */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/rooms/:id" element={<RoomDetailsPage />} />
        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/tenants/:id" element={<TenantDetailsPage />} />
        <Route path="/occupancies" element={<OccupanciesPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>

      {/* Any URL not matched above */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
