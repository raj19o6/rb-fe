import { useEffect, useState } from 'react'
import {
  Bot, Zap, DollarSign, Receipt, Bug, Inbox,
  Bell, Users, ShieldCheck, GitBranch, CheckCircle2,
  XCircle, Clock, AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Badge } from '@/components/watermelon-ui/badge'
import { Skeleton } from '@/components/watermelon-ui/skeleton'
import { Separator } from '@/components/watermelon-ui/separator'
import { authApi } from '@/lib/api'
import { useAuthStore, useRoleName } from '@/lib/auth'

// ── Updated type matching actual API response ────────────────────
type DashboardData = {
  bots: { total: number; active: number; inactive: number; maintenance: number }
  executions: {
    total: number
    success?: number
    failed?: number
    running?: number
    queued?: number
    cancelled?: number
    by_status?: { success: number; failed: number; running: number; queued: number; cancelled: number }
    by_bot?: { bot_id: string; bot_name: string; total: number; success: number; failed: number; running: number; queued: number; cancelled: number }[]
    recent?: { id: string; status: string; bot_name: string; request_title: string; executed_by: string; started_at: string | null; ended_at: string | null; created_at: string }[]
  }
  budget: { total_allocated: number; total_consumed: number; total_remaining: number }
  billing: { total_amount: number; paid: number; unpaid: number; overdue: number; total_balance_remaining: number }
  bugs: {
    total: number
    total_open: number
    by_status: { open: number; in_progress: number; resolved: number; closed: number }
    open_by_severity: { low: number; medium: number; high: number; critical: number }
    by_bot: unknown[]
    recent: unknown[]
  }
  requests: { total: number; pending: number; approved: number; in_progress: number; completed: number; rejected: number }
  workflows: {
    total: number
    total_actions_recorded: number
    by_status: { saved: number; queued: number; running: number; completed: number; failed: number }
    by_bot: { bot_id: string; bot_name: string; bot_status: string; client_name: string; workflow_count: number; completed: number; failed: number; total_actions: number }[]
    by_client: { client_id: string; client_name: string; client_email: string; workflow_count: number; completed: number; failed: number; total_actions: number }[]
    recent: { id: string; name: string; status: string; action_count: number; last_executed: string | null; bot_name: string; client_name: string; report_status: string }[]
  }
  notifications: { unread_count: number; recent: unknown[] }
  users_roles?: {
    users: { total: number; active: number; inactive: number; superusers: number }
    roles: { system_roles: number; custom_roles: number; total: number }
  }
}

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, valueClass }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; valueClass?: string
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Icon size={14} className="text-muted-foreground" />
        </div>
        <p className={`text-2xl font-bold ${valueClass ?? ''}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ── Section Header ───────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={16} className="text-muted-foreground" />
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
    </div>
  )
}

// ── Workflow Status Badge ────────────────────────────────────────
const WF_STATUS: Record<string, string> = {
  completed: 'border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200',
  failed:    'bg-destructive/10 text-destructive border-destructive/20',
  running:   'border-blue-500/30 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  queued:    'border-yellow-500/40 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200',
  saved:     'bg-muted text-muted-foreground',
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const roleName = useRoleName()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    authApi.getDashboard()
      .then(({ data }) => setData(data as DashboardData))
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

      {/* ── Header ── */}
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

      {/* ── Bots ── */}
      <div className="space-y-3">
        <SectionHeader icon={Bot} title="Bots" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Bot} label="Total" value={data.bots.total} />
          <StatCard icon={Bot} label="Active" value={data.bots.active} valueClass="text-green-600" />
          <StatCard icon={Bot} label="Inactive" value={data.bots.inactive} valueClass="text-muted-foreground" />
          <StatCard icon={Bot} label="Maintenance" value={data.bots.maintenance} valueClass="text-yellow-600" />
        </div>
      </div>

      <Separator />

      {/* ── Executions ── */}
      <div className="space-y-3">
        <SectionHeader icon={Zap} title="Executions" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(() => {
            const s = data.executions.by_status
            const success = s?.success ?? data.executions.success ?? 0
            const failed  = s?.failed  ?? data.executions.failed  ?? 0
            const running = s?.running ?? data.executions.running ?? 0
            const queued  = s?.queued  ?? data.executions.queued  ?? 0
            const cancelled = s?.cancelled ?? data.executions.cancelled ?? 0
            return (
              <>
                <StatCard icon={Zap}          label="Total"     value={data.executions.total} />
                <StatCard icon={CheckCircle2} label="Success"   value={success}   valueClass="text-green-600" />
                <StatCard icon={XCircle}      label="Failed"    value={failed}    valueClass="text-destructive" />
                <StatCard icon={Zap}          label="Running"   value={running}   valueClass="text-blue-600" />
                <StatCard icon={Clock}        label="Queued"    value={queued}    valueClass="text-yellow-600" />
                <StatCard icon={XCircle}      label="Cancelled" value={cancelled} valueClass="text-muted-foreground" />
              </>
            )
          })()}
        </div>

        {/* Recent executions (client view) */}
        {data.executions.recent && data.executions.recent.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm"><Zap size={15} /> Recent Executions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.executions.recent.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{ex.bot_name}</p>
                    <p className="text-[10px] text-muted-foreground">{ex.request_title} · {ex.executed_by}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Badge variant="outline" className={`text-[10px] capitalize ${WF_STATUS[ex.status] ?? ''}`}>{ex.status}</Badge>
                    <span className="text-[10px] text-muted-foreground hidden sm:block">
                      {ex.ended_at ? new Date(ex.ended_at).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* ── Budget & Billing ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <SectionHeader icon={DollarSign} title="Budget" />
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={DollarSign} label="Allocated" value={`₹${data.budget.total_allocated.toFixed(2)}`} />
            <StatCard icon={DollarSign} label="Consumed" value={`₹${data.budget.total_consumed.toFixed(2)}`} valueClass="text-destructive" />
            <StatCard icon={DollarSign} label="Remaining" value={`₹${data.budget.total_remaining.toFixed(2)}`} valueClass="text-green-600" />
          </div>
        </div>
        <div className="space-y-3">
          <SectionHeader icon={Receipt} title="Billing" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Receipt} label="Total Amount" value={`₹${data.billing.total_amount}`} />
            <StatCard icon={CheckCircle2} label="Paid" value={data.billing.paid} valueClass="text-green-600" />
            <StatCard icon={Clock} label="Unpaid" value={data.billing.unpaid} valueClass="text-yellow-600" />
            <StatCard icon={AlertTriangle} label="Overdue" value={data.billing.overdue} valueClass="text-destructive" />
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Requests & Bugs ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <SectionHeader icon={Inbox} title="Requests" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard icon={Inbox} label="Total" value={data.requests.total} />
            <StatCard icon={Clock} label="Pending" value={data.requests.pending} valueClass="text-yellow-600" />
            <StatCard icon={CheckCircle2} label="Approved" value={data.requests.approved} valueClass="text-green-600" />
            <StatCard icon={Zap} label="In Progress" value={data.requests.in_progress} valueClass="text-blue-600" />
            <StatCard icon={CheckCircle2} label="Completed" value={data.requests.completed} />
            <StatCard icon={XCircle} label="Rejected" value={data.requests.rejected} valueClass="text-destructive" />
          </div>
        </div>
        <div className="space-y-3">
          <SectionHeader icon={Bug} title="Bugs" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Bug} label="Total Open" value={data.bugs.total_open} />
            <StatCard icon={AlertTriangle} label="Critical" value={data.bugs.open_by_severity.critical} valueClass="text-destructive" />
            <StatCard icon={AlertTriangle} label="High" value={data.bugs.open_by_severity.high} valueClass="text-orange-600" />
            <StatCard icon={Bug} label="Medium" value={data.bugs.open_by_severity.medium} sub={`Low: ${data.bugs.open_by_severity.low}`} />
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Workflows ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader icon={GitBranch} title="Workflows" />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{data.workflows.total} total</span>
            <span>{data.workflows.total_actions_recorded} actions recorded</span>
          </div>
        </div>

        {data.workflows.total === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border py-10 text-center">
            <GitBranch size={32} className="text-muted-foreground opacity-30 mb-2" />
            <p className="text-sm text-muted-foreground">No workflows yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {Object.entries(data.workflows.by_status).map(([status, count]) => (
                <Card key={status}>
                  <CardContent className="pt-3 pb-3 text-center">
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{status}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {data.workflows.recent.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm"><GitBranch size={15} /> Recent Workflows</CardTitle>
                  <CardDescription>Latest workflow executions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.workflows.recent.map((wf) => (
                    <div key={wf.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{wf.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {wf.bot_name} · {wf.client_name} · {wf.action_count} actions
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <Badge variant="outline" className={`text-[10px] capitalize ${WF_STATUS[wf.status] ?? ''}`}>
                          {wf.status}
                        </Badge>
                        {wf.last_executed && (
                          <span className="text-[10px] text-muted-foreground hidden sm:block">
                            {new Date(wf.last_executed).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {data.workflows.by_bot.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {data.workflows.by_bot.map((b) => (
                  <Card key={b.bot_id}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                            <Bot size={13} className="text-primary" />
                          </div>
                          <p className="text-sm font-medium truncate">{b.bot_name}</p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${WF_STATUS[b.bot_status] ?? ''}`}>{b.bot_status}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center mt-3">
                        <div><p className="text-lg font-bold">{b.workflow_count}</p><p className="text-[10px] text-muted-foreground">Workflows</p></div>
                        <div><p className="text-lg font-bold text-green-600">{b.completed}</p><p className="text-[10px] text-muted-foreground">Completed</p></div>
                        <div><p className="text-lg font-bold text-destructive">{b.failed}</p><p className="text-[10px] text-muted-foreground">Failed</p></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Users & Roles — superuser/manager only ── */}
      {data.users_roles && (
        <>
          <Separator />
          <div className="space-y-3">
            <SectionHeader icon={Users} title="Users & Roles" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={Users} label="Total Users" value={data.users_roles.users.total} sub={`Active: ${data.users_roles.users.active}`} />
              <StatCard icon={Users} label="Inactive" value={data.users_roles.users.inactive} />
              <StatCard icon={ShieldCheck} label="Total Roles" value={data.users_roles.roles.total} sub={`Custom: ${data.users_roles.roles.custom_roles}`} />
              <StatCard icon={ShieldCheck} label="System Roles" value={data.users_roles.roles.system_roles} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
