import { useEffect, useState } from 'react'
import { Zap, FileText, CheckCircle, XCircle, ShieldAlert, Percent } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Badge } from '@/components/watermelon-ui/badge'
import { Button } from '@/components/watermelon-ui/button'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/watermelon-ui/dialog'
import { DataTable, type Column } from '@/components/DataTable'
import { StatusAlert } from '@/components/ConfirmDialog'
import { executionsApi, type Execution, type ExecutionReport } from '@/lib/api'

const BASE_URL = 'http://172.17.84.253:8000'

const STATUS_COLORS: Record<string, string> = {
  completed: 'border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200',
  failed:    'bg-destructive/10 text-destructive border-destructive/20',
  running:   'border-blue-500/30 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  queued:    'border-yellow-500/40 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200',
  cancelled: 'bg-muted text-muted-foreground',
}

type Tab = 'executions' | 'reports'

export default function ExecutionsPage() {
  const [tab, setTab] = useState<Tab>('executions')
  const [executions, setExecutions] = useState<Execution[]>([])
  const [reports, setReports] = useState<ExecutionReport[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [reportDetail, setReportDetail] = useState<ExecutionReport | null>(null)

  const fetchAll = () => {
    setLoading(true)
    Promise.all([executionsApi.list(), executionsApi.reports()])
      .then(([e, r]) => {
        setExecutions(Array.isArray(e.data) ? e.data : [])
        setReports(Array.isArray(r.data) ? r.data : [])
      })
      .catch(() => setAlert({ type: 'error', message: 'Failed to load executions.' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const statusCounts = executions.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1; return acc
  }, {})

  const execColumns: Column<Execution>[] = [
    {
      key: 'workflow_name', label: 'Workflow', sortable: true,
      render: (e) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Zap size={14} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{e.workflow_name}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{e.execution_id?.slice(0, 8)}…</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (e) => (
        <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[e.status] ?? 'bg-muted text-muted-foreground'}`}>
          {e.status}
        </Badge>
      ),
    },
    {
      key: 'triggered_at', label: 'Triggered',
      render: (e) => (
        <span className="text-xs text-muted-foreground">
          {e.triggered_at ? new Date(e.triggered_at).toLocaleString() : e.created_at ? new Date(e.created_at).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'completed_at', label: 'Completed',
      render: (e) => (
        <span className="text-xs text-muted-foreground">
          {e.completed_at ? new Date(e.completed_at).toLocaleString() : '—'}
        </span>
      ),
    },
  ]

  const reportColumns: Column<ExecutionReport>[] = [
    {
      key: 'workflow_name', label: 'Workflow', sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <FileText size={14} className="text-primary" />
          </div>
          <p className="font-medium text-sm">{r.workflow_name}</p>
        </div>
      ),
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (r) => (
        <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[r.status] ?? 'bg-muted text-muted-foreground'}`}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'summary', label: 'Pass / Fail',
      render: (r) => (
        <span className="text-xs">
          <span className="text-green-600 font-medium">{r.summary?.passed ?? '—'}</span>
          <span className="text-muted-foreground"> / </span>
          <span className="text-destructive font-medium">{r.summary?.failed ?? '—'}</span>
        </span>
      ),
    },
    {
      key: 'success_rate', label: 'Rate',
      render: (r) => (
        <span className={`text-sm font-semibold ${
          r.summary?.success_rate >= 80 ? 'text-green-600'
          : r.summary?.success_rate >= 50 ? 'text-yellow-600'
          : 'text-destructive'
        }`}>
          {r.summary?.success_rate != null ? `${r.summary.success_rate}%` : '—'}
        </span>
      ),
    },
    {
      key: 'executed_at', label: 'Date',
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.executed_at ? new Date(r.executed_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'detail', label: '',
      render: (r) => (
        <Button variant="ghost" size="icon-sm" title="View Report" onClick={() => setReportDetail(r)}>
          <FileText size={14} />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Executions</h1>
        <p className="text-sm text-muted-foreground">Track your workflow execution history and reports.</p>
      </div>

      {alert && <StatusAlert type={alert.type} message={alert.message} />}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{executions.length}</p></CardContent></Card>
        {(['completed', 'failed', 'running', 'queued'] as const).map(s => (
          <Card key={s}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground capitalize">{s}</p>
              <p className={`text-2xl font-bold ${s === 'completed' ? 'text-green-600' : s === 'failed' ? 'text-destructive' : s === 'running' ? 'text-blue-600' : 'text-yellow-600'}`}>
                {statusCounts[s] ?? 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['executions', 'reports'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
            {t === 'executions' && executions.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{executions.length}</span>
            )}
            {t === 'reports' && reports.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{reports.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'executions' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap size={18} /> Execution History</CardTitle>
            <CardDescription>{executions.length} execution{executions.length !== 1 ? 's' : ''} recorded.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={execColumns} data={executions} loading={loading}
              searchPlaceholder="Search by workflow…" searchKeys={['workflow_name']}
              onRefresh={fetchAll}
              emptyMessage="No executions yet. Run a workflow to see history here."
            />
          </CardContent>
        </Card>
      )}

      {tab === 'reports' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText size={18} /> Execution Reports</CardTitle>
            <CardDescription>{reports.length} report{reports.length !== 1 ? 's' : ''} available.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={reportColumns} data={reports} loading={loading}
              searchPlaceholder="Search by workflow…" searchKeys={['workflow_name']}
              onRefresh={fetchAll}
              emptyMessage="No reports available yet."
            />
          </CardContent>
        </Card>
      )}

      {/* ── Report Detail Dialog ── */}
      <Dialog open={!!reportDetail} onOpenChange={(v) => !v && setReportDetail(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={16} /> {reportDetail?.workflow_name} — Report
            </DialogTitle>
          </DialogHeader>

          {reportDetail && (
            <div className="space-y-4">
              {/* Status + date */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`capitalize ${STATUS_COLORS[reportDetail.status] ?? ''}`}>
                  {reportDetail.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {reportDetail.executed_at ? new Date(reportDetail.executed_at).toLocaleString() : '—'}
                </span>
              </div>

              {/* Summary stat cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border p-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Passed</p>
                    <p className="text-lg font-bold text-green-600">{reportDetail.summary?.passed ?? '—'}</p>
                  </div>
                </div>
                <div className="rounded-md border border-border p-3 flex items-center gap-2">
                  <XCircle size={16} className="text-destructive shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Failed</p>
                    <p className="text-lg font-bold text-destructive">{reportDetail.summary?.failed ?? '—'}</p>
                  </div>
                </div>
                <div className="rounded-md border border-border p-3 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-yellow-600 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Security Issues</p>
                    <p className="text-lg font-bold text-yellow-600">{reportDetail.summary?.security_issues ?? '—'}</p>
                  </div>
                </div>
                <div className="rounded-md border border-border p-3 flex items-center gap-2">
                  <Percent size={16} className="text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                    <p className="text-lg font-bold text-primary">
                      {reportDetail.summary?.success_rate != null ? `${reportDetail.summary.success_rate}%` : '—'}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Total steps: <span className="font-medium text-foreground">{reportDetail.summary?.total ?? '—'}</span>
              </p>

              {/* HTML report link */}
              {reportDetail.html_report_url && (
                <a
                  href={`${BASE_URL}${reportDetail.html_report_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary underline"
                >
                  <FileText size={14} /> View Full HTML Report
                </a>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDetail(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
