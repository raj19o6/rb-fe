import { useEffect, useState } from 'react'
import {
  Play, Download, FileText, GitBranch, Trash2,
  Shield, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  ExternalLink, FlaskConical, Activity, AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Badge } from '@/components/watermelon-ui/badge'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Separator } from '@/components/watermelon-ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/watermelon-ui/dialog'
import { DataTable, type Column } from '@/components/DataTable'
import { StatusAlert, ConfirmDialog } from '@/components/ConfirmDialog'
import { workflowsApi, type Workflow, type WorkflowReport, type SecurityFinding } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  saved:     'border-blue-500/30 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  completed: 'border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200',
  queued:    'border-yellow-500/40 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200',
  failed:    'bg-destructive/10 text-destructive border-destructive/20',
  running:   'border-blue-500/30 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  pass:      'border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200',
  fail:      'bg-destructive/10 text-destructive border-destructive/20',
}

const SEV_COLORS: Record<string, string> = {
  critical: 'bg-purple-600 text-white',
  high:     'bg-destructive text-white',
  medium:   'bg-orange-500 text-white',
  low:      'bg-yellow-500 text-white',
  info:     'bg-muted text-muted-foreground',
}

type ExecuteResult = { status: string; execution_id: string; message: string }
type ReportSection = 'steps' | 'security' | 'qa' | 'testcases'

// ── Full Report Dialog ───────────────────────────────────────────
function WorkflowReportDialog({ open, onClose, workflowId, workflowName }: {
  open: boolean; onClose: () => void; workflowId: string | null; workflowName: string
}) {
  const [data, setData] = useState<WorkflowReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [section, setSection] = useState<ReportSection>('steps')

  useEffect(() => {
    if (!open || !workflowId) return
    setData(null); setError(''); setLoading(true); setSection('steps'); setExpandedStep(null)
    workflowsApi.report(workflowId)
      .then(({ data }) => setData(data))
      .catch(() => setError('Failed to load report.'))
      .finally(() => setLoading(false))
  }, [open, workflowId])

  const allSecurity: SecurityFinding[] = data ? [
    ...(data.report?.security?.critical ?? []),
    ...(data.report?.security?.high ?? []),
    ...(data.report?.security?.medium ?? []),
    ...(data.report?.security?.low ?? []),
  ] : []

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={16} /> {workflowName} — Report
          </DialogTitle>
        </DialogHeader>

        {loading && <div className="flex justify-center py-12"><Spinner size="sm" /></div>}
        {error && <StatusAlert type="error" message={error} />}

        {data && (
          <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                <p className="text-2xl font-bold">{data.report?.summary?.total ?? data.summary?.total ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total Steps</p>
              </div>
              <div className="rounded-lg border border-green-500/30 bg-green-50 dark:bg-green-950/30 p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{data.report?.summary?.passed ?? data.summary?.passed ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Passed</p>
              </div>
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{data.report?.summary?.failed ?? data.summary?.failed ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Failed</p>
              </div>
              <div className="rounded-lg border border-orange-500/30 bg-orange-50 dark:bg-orange-950/30 p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">{data.report?.summary?.security_issues ?? data.summary?.security_issues ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Security Issues</p>
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>By <span className="font-medium text-foreground">{data.username}</span></span>
              <span>{new Date(data.executed_at).toLocaleString()}</span>
              <Badge variant="outline" className={`capitalize ${STATUS_COLORS[data.status] ?? ''}`}>{data.status}</Badge>
              {data.summary?.success_rate != null && (
                <span className={`font-semibold ${data.summary.success_rate >= 80 ? 'text-green-600' : data.summary.success_rate >= 50 ? 'text-yellow-600' : 'text-destructive'}`}>
                  {data.summary.success_rate.toFixed(1)}% success rate
                </span>
              )}
              {data.html_report_url && (
                <a href={data.html_report_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink size={11} /> Full HTML Report
                </a>
              )}
            </div>

            <Separator />

            {/* Section tabs */}
            <div className="flex gap-1 border-b border-border">
              {([
                { key: 'steps' as ReportSection, icon: GitBranch, label: 'Steps', count: data.report?.steps?.length },
                { key: 'security' as ReportSection, icon: Shield, label: 'Security', count: allSecurity.length },
                { key: 'qa' as ReportSection, icon: Activity, label: 'QA', count: data.report?.qa_findings?.length },
                { key: 'testcases' as ReportSection, icon: FlaskConical, label: 'Test Cases', count: data.report?.security_testcases?.length },
              ]).map(({ key, icon: Icon, label, count }) => (
                <button key={key} onClick={() => setSection(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    section === key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}>
                  <Icon size={12} /> {label}
                  {count != null && count > 0 && (
                    <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px]">{count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Steps */}
            {section === 'steps' && (
              <div className="space-y-1.5">
                {(data.report?.steps ?? []).map((s, i) => (
                  <div key={i} className={`rounded-md border ${s.status === 'pass' ? 'border-green-500/30' : 'border-destructive/30'} overflow-hidden`}>
                    <button type="button" onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs text-muted-foreground shrink-0 w-5 text-right">{i + 1}</span>
                        <Badge variant="outline" className={`text-[10px] uppercase shrink-0 ${STATUS_COLORS[s.status]}`}>{s.status}</Badge>
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded shrink-0">{s.step.action}</code>
                        <span className="text-xs text-muted-foreground truncate">{s.step.selector}</span>
                        {s.step.value && <span className="text-xs text-foreground truncate max-w-[100px]">= {s.step.value}</span>}
                      </div>
                      {expandedStep === i ? <ChevronUp size={13} className="shrink-0 text-muted-foreground" /> : <ChevronDown size={13} className="shrink-0 text-muted-foreground" />}
                    </button>
                    {expandedStep === i && (
                      <div className="px-3 pb-3 space-y-1.5 border-t border-border bg-muted/20">
                        {s.step.url && <p className="text-[11px] text-muted-foreground pt-2">URL: <span className="text-foreground">{s.step.url}</span></p>}
                        {s.error && (
                          <div className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/10 px-2 py-1.5 mt-1">
                            <AlertCircle size={12} className="text-destructive shrink-0 mt-0.5" />
                            <p className="text-[11px] text-destructive break-all">{s.error}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Security */}
            {section === 'security' && (
              <div className="space-y-2">
                {allSecurity.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 py-4"><CheckCircle2 size={16} /> No security issues found.</div>
                ) : allSecurity.map((f, i) => (
                  <div key={i} className="rounded-md border border-border p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium capitalize">{f.type.replace(/_/g, ' ')}</p>
                        {f.selector && <p className="text-xs text-muted-foreground font-mono">{f.selector}</p>}
                        {f.header && <p className="text-xs text-muted-foreground font-mono">{f.header}</p>}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 capitalize ${SEV_COLORS[f.severity] ?? ''}`}>{f.severity}</span>
                    </div>
                    {f.reason && <p className="text-xs text-muted-foreground">{f.reason}</p>}
                    {f.payload && <code className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded block text-destructive">{f.payload}</code>}
                    {f.owasp && <p className="text-[10px] text-muted-foreground">{f.owasp}{f.cvss ? ` · CVSS ${f.cvss}` : ''}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* QA */}
            {section === 'qa' && (
              <div className="space-y-2">
                {(data.report?.qa_findings ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No QA findings.</p>
                ) : (data.report?.qa_findings ?? []).map((q, i) => (
                  <div key={i} className="rounded-md border border-border p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium capitalize">{q.type.replace(/_/g, ' ')}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 capitalize ${SEV_COLORS[q.severity] ?? ''}`}>{q.severity}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{q.category}</p>
                    {q.reason && <p className="text-xs text-muted-foreground">{q.reason}</p>}
                    {q.load_time_ms != null && <p className="text-xs text-muted-foreground">Load: {q.load_time_ms}ms · FCP: {q.fcp_ms}ms</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Test Cases */}
            {section === 'testcases' && (
              <div className="space-y-3">
                {(data.report?.security_testcases ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No test cases generated.</p>
                ) : (data.report?.security_testcases ?? []).map((tc) => (
                  <div key={tc.id} className="rounded-md border border-border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-mono">{tc.id}</p>
                        <p className="text-sm font-semibold">{tc.title}</p>
                        <p className="text-xs text-muted-foreground">{tc.objective}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 capitalize ${SEV_COLORS[tc.severity.toLowerCase()] ?? ''}`}>{tc.severity}</span>
                    </div>
                    <ol className="space-y-0.5 list-decimal list-inside">
                      {tc.steps.map((step, i) => <li key={i} className="text-xs text-muted-foreground">{step}</li>)}
                    </ol>
                    <div className="flex flex-wrap gap-4 text-xs">
                      <div><span className="text-muted-foreground">Expected: </span>{tc.expected_result}</div>
                      <div><span className="text-muted-foreground">Risk: </span>{tc.risk}</div>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">{tc.control_mapping}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Page ─────────────────────────────────────────────────────────
export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [execResult, setExecResult] = useState<{ open: boolean; data: ExecuteResult | null }>({ open: false, data: null })
  const [reportDialog, setReportDialog] = useState<{ id: string; name: string } | null>(null)
  const [stepsDialog, setStepsDialog] = useState<{ open: boolean; workflow: Workflow | null }>({ open: false, workflow: null })
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
    setExecutingId(w.id); setAlert(null)
    try {
      const { data } = await workflowsApi.execute(w.id)
      setExecResult({ open: true, data: data as ExecuteResult })
      fetchWorkflows()
    } catch {
      setAlert({ type: 'error', message: `Failed to execute "${w.name}".` })
    } finally { setExecutingId(null) }
  }

  const handleDelete = async (w: Workflow) => {
    setConfirmDelete(null); setDeletingId(w.id)
    try {
      await workflowsApi.delete(w.id)
      setWorkflows(prev => prev.filter(x => x.id !== w.id))
      setAlert({ type: 'success', message: `"${w.name}" deleted.` })
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

  const statusCounts = workflows.reduce<Record<string, number>>((acc, w) => {
    acc[w.status] = (acc[w.status] ?? 0) + 1; return acc
  }, {})

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
      render: (w) => <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[w.status] ?? 'bg-muted text-muted-foreground'}`}>{w.status}</Badge>,
    },
    {
      key: 'action_count', label: 'Steps',
      render: (w) => (
        <button className="text-xs text-primary underline" onClick={() => setStepsDialog({ open: true, workflow: w })}>
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
      render: (w) => <span className="text-xs text-muted-foreground">{w.last_executed ? new Date(w.last_executed).toLocaleString() : 'Never'}</span>,
    },
    {
      key: 'recorded_at', label: 'Recorded',
      render: (w) => <span className="text-xs text-muted-foreground">{new Date(w.recorded_at).toLocaleDateString()}</span>,
    },
    {
      key: 'id', label: '',
      render: (w) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" title="Execute" onClick={() => handleExecute(w)} disabled={executingId === w.id}>
            {executingId === w.id ? <Spinner size="sm" /> : <Play size={14} className="text-green-600" />}
          </Button>
          <Button variant="ghost" size="icon-sm" title="View Report" onClick={() => setReportDialog({ id: w.id, name: w.name })}>
            <FileText size={14} />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Download JSON" onClick={() => handleDownload(w)}>
            <Download size={14} />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Delete" onClick={() => setConfirmDelete(w)} disabled={deletingId === w.id}>
            {deletingId === w.id ? <Spinner size="sm" /> : <Trash2 size={14} className="text-destructive" />}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-sm text-muted-foreground">{workflows.length} workflow{workflows.length !== 1 ? 's' : ''} recorded.</p>
        </div>
        <div className="relative flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 px-3 py-2 group">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
            <GitBranch size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 leading-none">RB-BOT</p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Workflow Recorder</p>
          </div>
          <div className="ml-1 flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] font-bold cursor-pointer">
            i
          </div>
          {/* Hover tooltip */}
          <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg p-3 space-y-2 hidden group-hover:block">
            <p className="text-sm font-semibold">How to use RB-BOT Recorder</p>
            <ol className="space-y-1.5 text-xs text-muted-foreground list-none">
              <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold mt-0.5">1</span>Open Chrome and go to the Extensions page (<span className="font-mono bg-muted px-1 rounded">chrome://extensions</span>)</li>
              <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold mt-0.5">2</span>Enable <span className="font-medium text-foreground">Developer Mode</span> (top right toggle)</li>
              <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold mt-0.5">3</span>Search for <span className="font-medium text-foreground">RB-BOT Workflow Recorder</span> in the Chrome Web Store</li>
              <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold mt-0.5">4</span>Click <span className="font-medium text-foreground">Add to Chrome</span> and pin the extension</li>
              <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold mt-0.5">5</span>Click the RB-BOT icon in your toolbar, log in, and start recording your workflow</li>
              <li className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold mt-0.5">6</span>Your recorded workflows will appear here automatically</li>
            </ol>
          </div>
        </div>
      </div>

      {alert && <StatusAlert type={alert.type} message={alert.message} />}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{workflows.length}</p></CardContent></Card>
        {(['completed', 'failed', 'running', 'queued'] as const).map(s => (
          <Card key={s}><CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground capitalize">{s}</p>
            <p className={`text-2xl font-bold ${s === 'completed' ? 'text-green-600' : s === 'failed' ? 'text-destructive' : s === 'running' ? 'text-blue-600' : 'text-yellow-600'}`}>
              {statusCounts[s] ?? 0}
            </p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GitBranch size={18} /> My Workflows</CardTitle>
          <CardDescription>Execute workflows, view full reports with steps &amp; security findings, or download JSON.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={workflows} loading={loading}
            searchPlaceholder="Search workflows…" searchKeys={['name', 'username']}
            onRefresh={fetchWorkflows} emptyMessage="No workflows found." />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
        title="Delete Workflow"
        description={`Delete "${confirmDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />

      {/* Execute result */}
      <Dialog open={execResult.open} onOpenChange={(v) => !v && setExecResult({ open: false, data: null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Play size={16} className="text-green-600" /> Workflow Queued</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-500/30 p-3">
              <p className="font-medium text-green-800 dark:text-green-200">{execResult.data?.message}</p>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Status: <span className="font-medium text-foreground capitalize">{execResult.data?.status}</span></p>
              <p>Execution ID: <span className="font-mono text-foreground">{execResult.data?.execution_id}</span></p>
            </div>
          </div>
          <DialogFooter><Button onClick={() => setExecResult({ open: false, data: null })}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Steps dialog */}
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

      {/* Full report dialog */}
      <WorkflowReportDialog
        open={!!reportDialog}
        onClose={() => setReportDialog(null)}
        workflowId={reportDialog?.id ?? null}
        workflowName={reportDialog?.name ?? ''}
      />
    </div>
  )
}
