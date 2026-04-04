import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from 'next-themes'
import {
  Sun, Moon, LayoutDashboard, LogOut, Bot,
  ChevronRight, ShieldCheck, ShieldPlus,
  UserPlus, Users, MoreHorizontal, DollarSign, Receipt, CreditCard, Link,
  GitBranch, Zap, UserCircle, ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/watermelon-ui/button'
import { Avatar, AvatarFallback } from '@/components/watermelon-ui/avatar'
import { Badge } from '@/components/watermelon-ui/badge'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/watermelon-ui/dropdown-menu'
import { useAuthStore, useRoleName } from '@/lib/auth'

type NavEntry = { to: string; icon: React.ElementType; label: string }

const NAV_BY_ROLE: Record<string, NavEntry[]> = {
  superuser: [
    { to: '/dashboard/admin',   icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/roles',             icon: ShieldCheck,     label: 'Roles' },
    { to: '/users',             icon: UserPlus,        label: 'Users' },
    { to: '/team',              icon: Users,           label: 'My Team' },
    { to: '/bots',              icon: Bot,             label: 'Bots' },
    { to: '/bot-allotments',    icon: Link,            label: 'Bot Allotments' },
    { to: '/requests',          icon: ClipboardList,   label: 'Requests' },
    { to: '/budget',            icon: DollarSign,      label: 'Budget' },
    { to: '/billing',           icon: Receipt,         label: 'Billing' },
    { to: '/payments',          icon: CreditCard,      label: 'Payments' },
  ],
  manager: [
    { to: '/dashboard/manager', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/users',             icon: UserPlus,        label: 'Create Client' },
    { to: '/team',              icon: Users,           label: 'My Team' },
    { to: '/custom-roles',      icon: ShieldPlus,      label: 'Custom Roles' },
    { to: '/bots',              icon: Bot,             label: 'Bots' },
    { to: '/requests',          icon: ClipboardList,   label: 'Requests' },
    { to: '/budget',            icon: DollarSign,      label: 'Budget' },
    { to: '/billing',           icon: Receipt,         label: 'Billing' },
    { to: '/payments',          icon: CreditCard,      label: 'Payments' },
  ],
  client: [
    { to: '/dashboard/client',  icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/bots',              icon: Bot,             label: 'Bots' },
    { to: '/requests',          icon: ClipboardList,   label: 'My Requests' },
    { to: '/workflows',         icon: GitBranch,       label: 'Workflows' },
    { to: '/executions',        icon: Zap,             label: 'Executions' },
    { to: '/budget',            icon: DollarSign,      label: 'My Budget' },
    { to: '/billing',           icon: Receipt,         label: 'Billing' },
    { to: '/payments',          icon: CreditCard,      label: 'Payments' },
  ],
}

function NavItem({ to, icon: Icon, label, badge }: NavEntry & { badge?: string }) {
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
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const roleName = useRoleName()

  const navItems = roleName === 'custom'
    ? [{ to: '/dashboard/custom', icon: LayoutDashboard, label: 'Dashboard' }, { to: '/users', icon: UserPlus, label: 'Users' }]
    : NAV_BY_ROLE[roleName] ?? [{ to: '/dashboard/custom', icon: LayoutDashboard, label: 'Dashboard' }]

  // Display label: use role name from roles[0] for custom users
  const displayRole = roleName === 'custom'
    ? (user?.roles?.[0]?.name ?? 'custom')
    : roleName

  const pageLabel = navItems.find((n) => n.to === location.pathname)?.label ?? 'Dashboard'
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? 'RB'

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
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

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <p className="text-[10px] text-muted-foreground text-center w-full">v26.0.1</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border px-6">
          <p className="text-sm font-semibold">{pageLabel}</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="flex items-center gap-2 pb-1">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{user?.username ?? 'User'}</span>
                    <span className="text-[10px] text-muted-foreground capitalize truncate">{displayRole || 'Member'}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut size={14} /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
