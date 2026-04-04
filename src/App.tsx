import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import RolesPage from '@/pages/RolesPage'
import PermissionsPage from '@/pages/PermissionsPage'
import UsersPage from '@/pages/UsersPage'
import TeamPage from '@/pages/TeamPage'
import MyPermissionsPage from '@/pages/MyPermissionsPage'
import CustomRolesPage from '@/pages/CustomRolesPage'
import BotsPage from '@/pages/BotsPage'
import BudgetPage from '@/pages/BudgetPage'
import BillingPage from '@/pages/BillingPage'
import PaymentPage from '@/pages/PaymentPage'
import ProfilePage from '@/pages/ProfilePage'
import WorkflowsPage from '@/pages/WorkflowsPage'
import ExecutionsPage from '@/pages/ExecutionsPage'
import BotAllotmentsPage from '@/pages/BotAllotmentsPage'
import Layout from '@/pages/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import RequestsPage from '@/pages/RequestsPage'
import { useAuthStore, useRoleName } from '@/lib/auth'

function RoleRoute({ allowed, children }: { allowed: string[]; children: React.ReactNode }) {
  const role = useRoleName()
  if (!role) return null
  if (!allowed.includes(role)) {
    const dest = role === 'superuser' ? '/dashboard/admin'
      : role === 'manager' ? '/dashboard/manager'
      : role === 'client' ? '/dashboard/client'
      : role === 'agent' ? '/dashboard/agent'
      : '/dashboard/custom'
    return <Navigate to={dest} replace />
  }
  return <>{children}</>
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const role = useRoleName()

  const roleDest = role === 'superuser' ? '/dashboard/admin'
    : role === 'manager' ? '/dashboard/manager'
    : role === 'client' ? '/dashboard/client'
    : role === 'agent' ? '/dashboard/agent'
    : role === 'custom' ? '/dashboard/custom'
    : '/dashboard/admin'

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to={roleDest} replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard/admin"   element={<RoleRoute allowed={['superuser']}><DashboardPage /></RoleRoute>} />
          <Route path="/dashboard/manager" element={<RoleRoute allowed={['manager']}><DashboardPage /></RoleRoute>} />
          <Route path="/dashboard/client"  element={<RoleRoute allowed={['client']}><DashboardPage /></RoleRoute>} />
          <Route path="/dashboard/agent"   element={<RoleRoute allowed={['agent']}><DashboardPage /></RoleRoute>} />
          <Route path="/dashboard/custom"  element={<RoleRoute allowed={['custom']}><DashboardPage /></RoleRoute>} />

          <Route path="/roles"       element={<RoleRoute allowed={['superuser']}><RolesPage /></RoleRoute>} />
          <Route path="/permissions" element={<RoleRoute allowed={['superuser']}><PermissionsPage /></RoleRoute>} />

          <Route path="/users"       element={<RoleRoute allowed={['superuser', 'manager', 'client', 'custom']}><UsersPage /></RoleRoute>} />
          <Route path="/team"        element={<RoleRoute allowed={['superuser', 'manager', 'client', 'custom']}><TeamPage /></RoleRoute>} />
          <Route path="/my-permissions" element={<RoleRoute allowed={['manager', 'client', 'agent', 'custom']}><MyPermissionsPage /></RoleRoute>} />
          <Route path="/custom-roles"   element={<RoleRoute allowed={['manager', 'client']}><CustomRolesPage /></RoleRoute>} />
          <Route path="/bots"           element={<RoleRoute allowed={['superuser', 'manager']}><BotsPage /></RoleRoute>} />
          <Route path="/profile"       element={<ProfilePage />} />
          <Route path="/workflows"      element={<RoleRoute allowed={['client']}><WorkflowsPage /></RoleRoute>} />
          <Route path="/executions"     element={<RoleRoute allowed={['client']}><ExecutionsPage /></RoleRoute>} />
          <Route path="/bot-allotments"  element={<RoleRoute allowed={['superuser']}><BotAllotmentsPage /></RoleRoute>} />
          <Route path="/requests"         element={<RoleRoute allowed={['superuser', 'manager', 'client']}><RequestsPage /></RoleRoute>} />
          <Route path="/budget"         element={<RoleRoute allowed={['superuser', 'manager', 'client']}><BudgetPage /></RoleRoute>} />
          <Route path="/billing"        element={<RoleRoute allowed={['superuser', 'manager']}><BillingPage /></RoleRoute>} />
          <Route path="/payments"       element={<RoleRoute allowed={['superuser', 'manager', 'client']}><PaymentPage /></RoleRoute>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
