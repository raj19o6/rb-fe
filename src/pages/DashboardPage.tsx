import { useEffect, useState } from 'react'
import { Bot, Zap, DollarSign, Receipt, Bug, Inbox, Bell, Users, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/watermelon-ui/card'
import { Badge } from '@/components/watermelon-ui/badge'
import { Skeleton } from '@/components/watermelon-ui/skeleton'
import { authApi } from '@/lib/api'
import { useAuthStore, useRoleName } from '@/lib/auth'

type Dashboard = Awaited<ReturnType<typeof authApi.getDashboard>>['data']

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon size={16} className="text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function SectionGrid({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-muted-foreground" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {children}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const roleName = useRoleName()
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    authApi.getDashboard()
      .then(({ data }) => setData(data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    </div>
  )

  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!data) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, <span className="font-medium text-foreground">{user?.username ?? 'User'}</span>
            {roleName && <Badge variant="outline" className="ml-2 text-xs capitalize">{roleName}</Badge>}
          </p>
        </div>
        {data.notifications.unread_count > 0 && (
          <Badge variant="destructive" className="gap-1.5">
            <Bell size={12} /> {data.notifications.unread_count} unread
          </Badge>
        )}
      </div>

      {/* Bots */}
      <SectionGrid title="Bots" icon={Bot}>
        <StatCard icon={Bot} label="Total Bots" value={data.bots.total} />
        <StatCard icon={Bot} label="Active" value={data.bots.active} />
        <StatCard icon={Bot} label="Inactive" value={data.bots.inactive} />
        <StatCard icon={Bot} label="Maintenance" value={data.bots.maintenance} />
      </SectionGrid>

      {/* Executions */}
      <SectionGrid title="Executions" icon={Zap}>
        <StatCard icon={Zap} label="Total" value={data.executions.total} />
        <StatCard icon={Zap} label="Success" value={data.executions.success} />
        <StatCard icon={Zap} label="Failed" value={data.executions.failed} />
        <StatCard icon={Zap} label="Running" value={data.executions.running} sub={`Queued: ${data.executions.queued}`} />
      </SectionGrid>

      {/* Budget & Billing */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Budget</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={DollarSign} label="Allocated" value={data.budget.total_allocated} />
            <StatCard icon={DollarSign} label="Consumed" value={data.budget.total_consumed} />
            <StatCard icon={DollarSign} label="Remaining" value={data.budget.total_remaining} />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Billing</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Receipt} label="Total Amount" value={data.billing.total_amount} />
            <StatCard icon={Receipt} label="Paid" value={data.billing.paid} />
            <StatCard icon={Receipt} label="Unpaid" value={data.billing.unpaid} />
            <StatCard icon={Receipt} label="Overdue" value={data.billing.overdue} />
          </div>
        </div>
      </div>

      {/* Bugs & Requests */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bug size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Bugs</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Bug} label="Total Open" value={data.bugs.total_open} />
            <StatCard icon={Bug} label="Critical" value={data.bugs.open.critical} />
            <StatCard icon={Bug} label="High" value={data.bugs.open.high} />
            <StatCard icon={Bug} label="Medium / Low" value={data.bugs.open.medium} sub={`Low: ${data.bugs.open.low}`} />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Inbox size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Requests</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Inbox} label="Total" value={data.requests.total} />
            <StatCard icon={Inbox} label="Pending" value={data.requests.pending} />
            <StatCard icon={Inbox} label="In Progress" value={data.requests.in_progress} />
            <StatCard icon={Inbox} label="Completed" value={data.requests.completed} sub={`Rejected: ${data.requests.rejected}`} />
          </div>
        </div>
      </div>

      {/* Users & Roles — superuser only */}
      {data.users_roles && (
        <SectionGrid title="Users & Roles" icon={Users}>
          <StatCard icon={Users} label="Total Users" value={data.users_roles.users.total} sub={`Active: ${data.users_roles.users.active}`} />
          <StatCard icon={Users} label="Inactive" value={data.users_roles.users.inactive} />
          <StatCard icon={ShieldCheck} label="Total Roles" value={data.users_roles.roles.total} sub={`Custom: ${data.users_roles.roles.custom_roles}`} />
          <StatCard icon={ShieldCheck} label="System Roles" value={data.users_roles.roles.system_roles} />
        </SectionGrid>
      )}
    </div>
  )
}
