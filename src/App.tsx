import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import RolesPage from '@/pages/RolesPage'
import PermissionsPage from '@/pages/PermissionsPage'
import UsersPage from '@/pages/UsersPage'
import TeamPage from '@/pages/TeamPage'
import MyPermissionsPage from '@/pages/MyPermissionsPage'
import AssignmentsPage from '@/pages/AssignmentsPage'
import Layout from '@/pages/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/lib/auth'

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/permissions" element={<PermissionsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/my-permissions" element={<MyPermissionsPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
