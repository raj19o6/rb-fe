import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from 'next-themes'
import {
  Sun, Moon, LayoutDashboard, LogOut, Bot,
  ChevronRight, ShieldCheck, KeyRound,
  UserPlus, Users, ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/watermelon-ui/button'
import { Avatar, AvatarFallback } from '@/components/watermelon-ui/avatar'
import { Badge } from '@/components/watermelon-ui/badge'
import { useAuthStore, useRoleName } from '@/lib/auth'

// Nav items visible per user_type
const NAV_BY_ROLE: Record<string, { to: string; icon: React.ElementType; label: string }[]> = {
  superuser: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/roles', icon: ShieldCheck, label: 'Roles' },
    { to: '/permissions', icon: KeyRound, label: 'Permissions' },
    { to: '/users', icon: UserPlus, label: 'Create User' },
    { to: '/team', icon: Users, label: 'My Team' },
    { to: '/assignments', icon: ClipboardList, label: 'Assignments' },
  ],
  manager: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/users', icon: UserPlus, label: 'Create Client' },
    { to: '/team', icon: Users, label: 'My Team' },
    { to: '/assignments', icon: ClipboardList, label: 'Assignments' },
    { to: '/my-permissions', icon: KeyRound, label: 'My Permissions' },
  ],
  client: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/users', icon: UserPlus, label: 'Create Agent' },
    { to: '/team', icon: Users, label: 'My Team' },
    { to: '/assignments', icon: ClipboardList, label: 'Assignments' },
    { to: '/my-permissions', icon: KeyRound, label: 'My Permissions' },
  ],
  agent: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/my-permissions', icon: KeyRound, label: 'My Permissions' },
  ],
}

const DEFAULT_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
]

function NavItem({
  to, icon: Icon, label, badge,
}: {
  to: string; icon: React.ElementType; label: string; badge?: string
}) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <NavLink
      to={to}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      }`}
    >
      <Icon size={16} className="shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <Badge
          variant={isActive ? 'outline' : 'secondary'}
          className="text-[10px] h-4 px-1.5 min-w-4 flex items-center justify-center"
        >
          {badge}
        </Badge>
      )}
      {isActive && <ChevronRight size={12} className="shrink-0 opacity-60" />}
    </NavLink>
  )
}

export default function Layout() {
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? 'RB'
  const roleName = useRoleName()
  const navItems = NAV_BY_ROLE[roleName] ?? DEFAULT_NAV
  const pageLabel = navItems.find((n) => n.to === location.pathname)?.label ?? 'Dashboard'

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-border bg-sidebar">

        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none">RichBot</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Bots as a Service</span>
          </div>
        </div>

        {/* Main Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {roleName ? roleName.charAt(0).toUpperCase() + roleName.slice(1) : 'Menu'}
          </p>
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>

        {/* User Profile Footer */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors cursor-pointer">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-none">{user?.username ?? 'User'}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate capitalize">
                {roleName || 'Member'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{pageLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
