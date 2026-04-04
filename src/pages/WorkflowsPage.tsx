import { useEffect, useState } from 'react'
import { Play, Download, FileText, GitBranch, CheckCircle, XCircle, ShieldAlert, Percent, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Badge } from '@/components/watermelon-ui/badge'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/watermelon-ui/dialog'
import { DataTable, type Column } from '@/components/DataTable'
import { StatusAlert, ConfirmDialog } from '@/components/ConfirmDialog'
import { workflowsApi, type Workflow } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  saved:     'border-blue-500/30 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  completed: 'border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200',
  queued:    'border-yellow-500/40 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200',
  failed:    'bg-destructive/10 text-destructive border-destructive/20',
  running:   'border-blue-500/30 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
}

type ExecuteResult = { status: string; execution_id: string; message: string }
type ReportSummary = {
  workflow_id: string
  workflow_name: string
  status: string
  executed_at: string
  execution_time: number | null
  summary: { total: number; passed: number; failed: number; security_issues: number; success_rate: number }
  html_report_url: string
  report?: {
    summary?: { total: number; passed: number; failed: number; security_issues: number }
  }
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Execute result dialog
  const [execResult, setExecResult] = useState<{ open: boolean; data: ExecuteResult | null }>({ open: false, data: null })

  // Report dialog
  const [reportDialog, setReportDialog] = useState<{ open: boolean; loading: boolean; data: ReportSummary | null; workflowName: string }>({
    open: false, loading: false, data: null, workflowName: '',
  })

  // Steps dialog
  const [stepsDialog, setStepsDialog] = useState<{ open: boolean; workflow: Workflow | null }>({ open: false, workflow: null })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Workflow | null>(null)

  const fetchWorkflows = () => {
    setLoading(true)
    workflowsApi.list()
      .then(({ data }) => setWorkflows(data.workflows ?? []))
      .catch(() => setAlert({ type: 'error', message: 'Failed to load workflows.' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchWorkflows() }, [])

  const handleExecute = async (w: Workflow) => {
    setExecutingId(w.id)
    setAlert(null)
    try {
      const { data } = await workflowsApi.execute(w.id)
      setExecResult({ open: true, data: data as ExecuteResult })
      fetchWorkflows()
    } catch {
      setAlert({ type: 'error', message: `Failed to execute "${w.name}".` })
    } finally { setExecutingId(null) }
  }

  const handleReport = async (w: Workflow) => {
    setReportDialog({ open: true, loading: true, data: null, workflowName: w.name })
    try {
      const { data } = await workflowsApi.report(w.id)
      const report = data as ReportSummary
      setReportDialog({ open: true, loading: false, data: report, workflowName: w.name })
    } catch {
      setReportDialog({ open: false, loading: false, data: null, workflowName: '' })
      setAlert({ type: 'error', message: `No report available for "${w.name}" yet.` })
    }
  }

  const handleDelete = async (w: Workflow) => {
    setConfirmDelete(null)
    setDeletingId(w.id)
    try {
      await workflowsApi.delete(w.id)
      fetchWorkflows()
    } catch {
      setAlert({ type: 'error', message: `Failed to delete "${w.name}".` })
    } finally { setDeletingId(null) }
  }

  const handleDownload = async (w: Workflow) => {
    try {
      const { data } = await workflowsApi.download(w.id)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${w.name}.json`; a.click()
      URL.revokeObjectURL(url)
    } catch {
      setAlert({ type: 'error', message: `Failed to download "${w.name}".` })
    }
  }

  const columns: Column<Workflow>[] = [
    {
      key: 'name', label: 'Workflow', sortable: true,
      render: (w) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <GitBranch size={14} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{w.name}</p>
            <p className="text-[10px] text-muted-foreground">{w.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (w) => (
        <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[w.status] ?? 'bg-muted text-muted-foreground'}`}>
          {w.status}
        </Badge>
      ),
    },
    {
      key: 'action_count', label: 'Steps',
      render: (w) => (
        <button
          className="text-xs text-primary underline cursor-pointer"
          onClick={() => setStepsDialog({ open: true, workflow: w })}
        >
          {w.action_count} step{w.action_count !== 1 ? 's' : ''}
        </button>
      ),
    },
    {
      key: 'success_rate', label: 'Success Rate',
      render: (w) => (
        <span className={`text-sm font-semibold ${w.success_rate != null ? (w.success_rate >= 80 ? 'text-green-600' : w.success_rate >= 50 ? 'text-yellow-600' : 'text-destructive') : 'text-muted-foreground'}`}>
          {w.success_rate != null ? `${w.success_rate}%` : '—'}
        </span>
      ),
    },
    {
      key: 'last_executed', label: 'Last Run',
      render: (w) => (
        <span className="text-xs text-muted-foreground">
          {w.last_executed ? new Date(w.last_executed).toLocaleString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'recorded_at', label: 'Recorded',
      render: (w) => (
        <span className="text-xs text-muted-foreground">{new Date(w.recorded_at).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'actions_col', label: '',
      render: (w) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" title="Execute workflow" onClick={() => handleExecute(w)} disabled={executingId === w.id}>
            {executingId === w.id ? <Spinner size="sm" /> : <Play size={14} className="text-green-600" />}
          </Button>
          <Button variant="ghost" size="icon-sm" title="View report" onClick={() => handleReport(w)}>
            <FileText size={14} />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Download JSON" onClick={() => handleDownload(w)}>
            <Download size={14} />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Delete workflow" onClick={() => setConfirmDelete(w)} disabled={deletingId === w.id}>
            {deletingId === w.id ? <Spinner size="sm" /> : <Trash2 size={14} className="text-destructive" />}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workflows</h1>
        <p className="text-sm text-muted-foreground">{workflows.length} workflow{workflows.length !== 1 ? 's' : ''} recorded.</p>
      </div>

      {alert && <StatusAlert type={alert.type} message={alert.message} />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GitBranch size={18} /> My Workflows</CardTitle>
          <CardDescription>Execute workflows, view reports, or download JSON for Jenkins.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns} data={workflows} loading={loading}
            searchPlaceholder="Search workflows…" searchKeys={['name', 'username']}
            onRefresh={fetchWorkflows}
            emptyMessage="No workflows found."
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
        title="Delete Workflow"
        description={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />

      {/* ── Execute Result Dialog ── */}
      <Dialog open={execResult.open} onOpenChange={(v) => !v && setExecResult({ open: false, data: null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play size={16} className="text-green-600" /> Workflow Queued
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-500/30 p-3 space-y-1">
              <p className="font-medium text-green-800 dark:text-green-200">{execResult.data?.message}</p>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Status: <span className="font-medium text-foreground capitalize">{execResult.data?.status}</span></p>
              <p>Execution ID: <span className="font-mono text-foreground">{execResult.data?.execution_id}</span></p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setExecResult({ open: false, data: null })}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Report Dialog ── */}
      <Dialog open={reportDialog.open} onOpenChange={(v) => !v && setReportDialog(r => ({ ...r, open: false }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={16} /> {reportDialog.workflowName} — Report
            </DialogTitle>
          </DialogHeader>

          {reportDialog.loading ? (
            <div className="flex items-center justify-center py-10"><Spinner /></div>
          ) : reportDialog.data ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`capitalize ${STATUS_COLORS[reportDialog.data.status] ?? ''}`}>
                  {reportDialog.data.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {reportDialog.data.executed_at ? new Date(reportDialog.data.executed_at).toLocaleString() : '—'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border p-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600 shrink-0" />
                  <div><p className="text-xs text-muted-foreground">Passed</p><p className="text-lg font-bold text-green-600">{reportDialog.data.summary.passed}</p></div>
                </div>
                <div className="rounded-md border border-border p-3 flex items-center gap-2">
                  <XCircle size={16} className="text-destructive shrink-0" />
                  <div><p className="text-xs text-muted-foreground">Failed</p><p className="text-lg font-bold text-destructive">{reportDialog.data.summary.failed}</p></div>
                </div>
                <div className="rounded-md border border-border p-3 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-yellow-600 shrink-0" />
                  <div><p className="text-xs text-muted-foreground">Security Issues</p><p className="text-lg font-bold text-yellow-600">{reportDialog.data.summary.security_issues}</p></div>
                </div>
                <div className="rounded-md border border-border p-3 flex items-center gap-2">
                  <Percent size={16} className="text-primary shrink-0" />
                  <div><p className="text-xs text-muted-foreground">Success Rate</p><p className="text-lg font-bold text-primary">{reportDialog.data.summary.success_rate}%</p></div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Total steps: <span className="font-medium text-foreground">{reportDialog.data.summary.total}</span>
              </p>

              {reportDialog.data.html_report_url && (
                <a
                  href={reportDialog.data.html_report_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button className="w-full gap-2">
                    <FileText size={14} /> View Full HTML Report
                  </Button>
                </a>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialog(r => ({ ...r, open: false }))}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Steps Dialog ── */}
      <Dialog open={stepsDialog.open} onOpenChange={(v) => !v && setStepsDialog({ open: false, workflow: null })}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{stepsDialog.workflow?.name} — Steps ({stepsDialog.workflow?.action_count})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {stepsDialog.workflow?.actions.map((a, i) => (
              <div key={i} className="flex items-start gap-3 rounded-md border border-border p-3 text-xs">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-[10px]">{i + 1}</span>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] capitalize">{a.type}</Badge>
                    {a.text && <span className="text-muted-foreground truncate">{a.text}</span>}
                    {a.value && <span className="font-mono text-primary truncate">"{a.value}"</span>}
                  </div>
                  <p className="text-muted-foreground font-mono truncate">{a.selector}</p>
                  <p className="text-muted-foreground truncate">{a.url}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
