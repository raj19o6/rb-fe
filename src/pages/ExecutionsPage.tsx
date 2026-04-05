import { useEffect, useState } from 'react'
import {
  Zap, FileText, AlertCircle, Clock, Shield, CheckCircle2,
  XCircle, ChevronDown, ChevronUp, ExternalLink, FlaskConical, Activity,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Badge } from '@/components/watermelon-ui/badge'
import { Button } from '@/components/watermelon-ui/button'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/watermelon-ui/dialog'
import { Separator } from '@/components/watermelon-ui/separator'
import { DataTable, type Column } from '@/components/DataTable'
import { StatusAlert } from '@/components/ConfirmDialog'
import { executionsApi, workflowsApi, type Execution, type ExecutionReport, type WorkflowReport, type SecurityFinding } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  completed: 'border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200',
  failed:    'bg-destructive/10 text-destructive border-destructive/20',
  running:   'border-blue-500/30 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  queued:    'border-yellow-500/40 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200',
  cancelled: 'bg-muted text-muted-foreground',
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

type Tab = 'executions' | 'reports'

// ── Workflow Report Dialog ───────────────────────────────────────
function WorkflowReportDialog({ open, onClose, workflowId, workflowName }: {
  open: boolean
  onClose: () => void
  workflowId: string | null
  workflowName: string
}) {
  const [data, setData] = useState<WorkflowReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [activeSection, setActiveSection] = useState<'steps' | 'security' | 'qa' | 'testcases'>('steps')

  useEffect(() => {
    if (!open || !workflowId) return
    setData(null); setError(''); setLoading(true)
    setActiveSection('steps'); setExpandedStep(null)
    workflowsApi.report(workflowId)
      .then(({ data }) => setData(data))
      .catch(() => setError('Failed to load report.'))
      .finally(() => setLoading(false))
  }, [open, workflowId])

  const allSecurityFindings: SecurityFinding[] = data ? [
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
            <FileText size={16} /> {workflowName} — Full Report
          </DialogTitle>
        </DialogHeader>

        {loading && <div className="flex justify-center py-12"><Spinner size="sm" /></div>}
        {error && <StatusAlert type="error" message={error} />}

        {data && (
          <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">

            {/* Header stats */}
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
                { key: 'steps', icon: Zap, label: 'Steps', count: data.report?.steps?.length },
                { key: 'security', icon: Shield, label: 'Security', count: allSecurityFindings.length },
                { key: 'qa', icon: Activity, label: 'QA', count: data.report?.qa_findings?.length },
                { key: 'testcases', icon: FlaskConical, label: 'Test Cases', count: data.report?.security_testcases?.length },
              ] as const).map(({ key, icon: Icon, label, count }) => (
                <button key={key} onClick={() => setActiveSection(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeSection === key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}>
                  <Icon size={12} /> {label}
                  {count != null && count > 0 && (
                    <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px]">{count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Steps */}
            {activeSection === 'steps' && (
              <div className="space-y-1.5">
                {(data.report?.steps ?? []).map((s, i) => (
                  <div key={i} className={`rounded-md border ${s.status === 'pass' ? 'border-green-500/30' : 'border-destructive/30'} overflow-hidden`}>
                    <button
                      type="button"
                      onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
                    >
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
            {activeSection === 'security' && (
              <div className="space-y-2">
                {allSecurityFindings.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 py-4">
                    <CheckCircle2 size={16} /> No security issues found.
                  </div>
                ) : allSecurityFindings.map((f, i) => (
                  <div key={i} className="rounded-md border border-border p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium capitalize">{f.type.replace(/_/g, ' ')}</p>
                        {f.selector && <p className="text-xs text-muted-foreground font-mono">{f.selector}</p>}
                        {f.header && <p className="text-xs text-muted-foreground font-mono">{f.header}</p>}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 capitalize ${SEV_COLORS[f.severity] ?? ''}`}>
                        {f.severity}
                      </span>
                    </div>
                    {f.reason && <p className="text-xs text-muted-foreground">{f.reason}</p>}
                    {f.payload && <code className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded block text-destructive">{f.payload}</code>}
                    {f.owasp && <p className="text-[10px] text-muted-foreground">{f.owasp}{f.cvss ? ` · CVSS ${f.cvss}` : ''}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* QA Findings */}
            {activeSection === 'qa' && (
              <div className="space-y-2">
                {(data.report?.qa_findings ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No QA findings.</p>
                ) : (data.report?.qa_findings ?? []).map((q, i) => (
                  <div key={i} className="rounded-md border border-border p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium capitalize">{q.type.replace(/_/g, ' ')}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 capitalize ${SEV_COLORS[q.severity] ?? ''}`}>
                        {q.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{q.category}</p>
                    {q.reason && <p className="text-xs text-muted-foreground">{q.reason}</p>}
                    {q.load_time_ms != null && (
                      <p className="text-xs text-muted-foreground">
                        Load: {q.load_time_ms}ms · FCP: {q.fcp_ms}ms
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Test Cases */}
            {activeSection === 'testcases' && (
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 capitalize ${SEV_COLORS[tc.severity.toLowerCase()] ?? ''}`}>
                        {tc.severity}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Steps</p>
                      <ol className="space-y-0.5 list-decimal list-inside">
                        {tc.steps.map((step, i) => (
                          <li key={i} className="text-xs text-muted-foreground">{step}</li>
                        ))}
                      </ol>
                    </div>
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

// ── Simple Report Detail Dialog (for execution reports) ──────────
function ReportDetailDialog({ open, onClose, report }: {
  open: boolean; onClose: () => void; report: ExecutionReport | null
}) {
  if (!report) return null
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText size={16} /> {report.bot_name} — Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Executed By</p><p className="font-medium">{report.executed_by_username}</p></div>
            <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{new Date(report.created_at).toLocaleString()}</p></div>
            {report.total_price && <div><p className="text-xs text-muted-foreground">Cost</p><p className="font-medium">₹{report.total_price}</p></div>}
          </div>
          <Separator />
          {report.summary && <div><p className="text-xs text-muted-foreground mb-1">Summary</p><p className="text-sm rounded-md border border-border bg-muted/40 px-3 py-2">{report.summary}</p></div>}
          {report.error_message && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
              <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{report.error_message}</p>
            </div>
          )}
          {report.logs && <pre className="text-xs font-mono rounded-md border border-border bg-muted/40 px-3 py-2 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">{report.logs}</pre>}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Page ─────────────────────────────────────────────────────────
export default function ExecutionsPage() {
  const [tab, setTab] = useState<Tab>('executions')
  const [executions, setExecutions] = useState<Execution[]>([])
  const [reports, setReports] = useState<ExecutionReport[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [reportDetail, setReportDetail] = useState<ExecutionReport | null>(null)
  const [workflowReport, setWorkflowReport] = useState<{ id: string; name: string } | null>(null)

  const fetchAll = () => {
    setLoading(true)
    Promise.all([executionsApi.list(), executionsApi.reports()])
      .then(([e, r]) => { setExecutions(e.data.results ?? []); setReports(r.data.results ?? []) })
      .catch(() => setAlert({ type: 'error', message: 'Failed to load executions.' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const statusCounts = executions.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1; return acc
  }, {})

  const execColumns: Column<Execution>[] = [
    {
      key: 'bot_name', label: 'Bot', sortable: true,
      render: (e) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10"><Zap size={14} className="text-primary" /></div>
          <div><p className="font-medium text-sm">{e.bot_name}</p><p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{e.request_title}</p></div>
        </div>
      ),
    },
    { key: 'executed_by_username', label: 'Executed By', sortable: true, render: (e) => <span className="text-sm">{e.executed_by_username}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (e) => <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[e.status] ?? ''}`}>{e.status}</Badge>,
    },
    { key: 'started_at', label: 'Started', render: (e) => <span className="text-xs text-muted-foreground">{e.started_at ? new Date(e.started_at).toLocaleString() : '—'}</span> },
    { key: 'ended_at', label: 'Ended', render: (e) => <span className="text-xs text-muted-foreground">{e.ended_at ? new Date(e.ended_at).toLocaleString() : '—'}</span> },
    { key: 'created_at', label: 'Created', render: (e) => <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</span> },
    {
      key: 'id', label: 'Report',
      render: (e) => (
        <Button variant="ghost" size="icon-sm" title="View Workflow Report"
          onClick={() => setWorkflowReport({ id: e.id, name: e.bot_name })}>
          <FileText size={13} />
        </Button>
      ),
    },
  ]

  const reportColumns: Column<ExecutionReport>[] = [
    {
      key: 'bot_name', label: 'Bot', sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10"><FileText size={14} className="text-primary" /></div>
          <p className="font-medium text-sm">{r.bot_name}</p>
        </div>
      ),
    },
    { key: 'executed_by_username', label: 'Executed By', sortable: true, render: (r) => <span className="text-sm">{r.executed_by_username}</span> },
    { key: 'summary', label: 'Summary', render: (r) => <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{r.summary || '—'}</span> },
    {
      key: 'error_message', label: 'Error',
      render: (r) => r.error_message
        ? <span className="text-xs text-destructive truncate max-w-[180px] block">{r.error_message}</span>
        : <span className="text-xs text-green-600">None</span>,
    },
    { key: 'total_price', label: 'Cost', render: (r) => <span className="text-xs font-mono">{r.total_price ? `₹${r.total_price}` : '—'}</span> },
    { key: 'created_at', label: 'Date', render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span> },
    {
      key: 'id', label: 'Report',
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" title="Execution Summary" onClick={() => setReportDetail(r)}>
            <AlertCircle size={13} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Executions</h1>
        <p className="text-sm text-muted-foreground">Track your bot execution history and reports.</p>
      </div>

      {alert && <StatusAlert type={alert.type} message={alert.message} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{executions.length}</p></CardContent></Card>
        {(['completed', 'failed', 'running', 'queued'] as const).map(s => (
          <Card key={s}><CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground capitalize">{s}</p>
            <p className={`text-2xl font-bold ${s === 'completed' ? 'text-green-600' : s === 'failed' ? 'text-destructive' : s === 'running' ? 'text-blue-600' : 'text-yellow-600'}`}>
              {statusCounts[s] ?? 0}
            </p>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['executions', 'reports'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t}
            <span className="ml-1.5 text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
              {t === 'executions' ? executions.length : reports.length}
            </span>
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
            <DataTable columns={execColumns} data={executions} loading={loading}
              searchPlaceholder="Search by bot or request…" searchKeys={['bot_name', 'request_title', 'executed_by_username']}
              onRefresh={fetchAll} emptyMessage="No executions yet." />
          </CardContent>
        </Card>
      )}

      {tab === 'reports' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText size={18} /> Execution Reports</CardTitle>
            <CardDescription>
              {reports.length} report{reports.length !== 1 ? 's' : ''} — click <AlertCircle size={12} className="inline" /> for execution summary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={reportColumns} data={reports} loading={loading}
              searchPlaceholder="Search by bot or user…" searchKeys={['bot_name', 'executed_by_username']}
              onRefresh={fetchAll} emptyMessage="No reports available yet." />
          </CardContent>
        </Card>
      )}

      <ReportDetailDialog open={!!reportDetail} onClose={() => setReportDetail(null)} report={reportDetail} />

      <WorkflowReportDialog
        open={!!workflowReport}
        onClose={() => setWorkflowReport(null)}
        workflowId={workflowReport?.id ?? null}
        workflowName={workflowReport?.name ?? ''}
      />
    </div>
  )
}
