import { useEffect, useState } from 'react'
import { Plus, ClipboardList, CheckCircle2, XCircle, ChevronRight, Bot as BotIcon, KeyRound, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Badge } from '@/components/watermelon-ui/badge'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Separator } from '@/components/watermelon-ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/watermelon-ui/dialog'
import { DataTable, type Column } from '@/components/DataTable'
import { StatusAlert } from '@/components/ConfirmDialog'
import {
  requestsApi, availableBotsApi, prereqApi, credentialsApi,
  type BotRequest, type RequestWithCredential, type Bot, type BotPrereqResponse,
} from '@/lib/api'
import { useRoleName } from '@/lib/auth'

const STATUS_COLORS: Record<string, string> = {
  pending:     'border-yellow-500/40 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200',
  approved:    'border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200',
  rejected:    'bg-destructive/10 text-destructive border-destructive/20',
  in_progress: 'border-blue-500/30 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  completed:   'border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200',
}

// ── Credential Detail Dialog (manager view) ──────────────────────
function CredentialDetailDialog({ open, onClose, request }: {
  open: boolean
  onClose: () => void
  request: RequestWithCredential | null
}) {
  if (!request) return null
  const cred = request.credential
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound size={16} /> Credential Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Request</p>
            <p className="text-sm font-medium">{request.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="text-sm font-medium">{request.requested_by_username}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bot</p>
              <p className="text-sm font-medium">{request.bot_name}</p>
            </div>
          </div>
          <Separator />
          {!cred ? (
            <p className="text-sm text-muted-foreground italic">No credentials attached.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Login Username</p>
                <p className="text-sm font-medium font-mono">{cred.username || '—'}</p>
              </div>
              {Object.entries(cred.extra_data ?? {}).map(([key, val]) => (
                <div key={key}>
                  <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                  <p className="text-sm font-medium break-all">{String(val)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Reject Dialog ────────────────────────────────────────────────
function RejectDialog({ open, onClose, onConfirm }: {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (!open) return; setReason(''); setSaving(false) }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onConfirm(reason)
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Reject Request</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Rejection Reason</Label>
            <Input placeholder="e.g. Bot not available in your region" value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={saving}>
              {saving ? <><Spinner size="sm" /> Rejecting…</> : 'Reject'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Submit Request Dialog — 3-step (client only) ─────────────────
type Step = 'bot' | 'credentials' | 'confirm'

function SubmitRequestDialog({ open, onClose, onSuccess }: {
  open: boolean
  onClose: () => void
  onSuccess: (msg: string) => void
}) {
  const [step, setStep] = useState<Step>('bot')
  const [bots, setBots] = useState<Bot[]>([])
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null)
  const [prereqData, setPrereqData] = useState<BotPrereqResponse | null>(null)
  const [loadingBots, setLoadingBots] = useState(true)
  const [loadingPrereq, setLoadingPrereq] = useState(false)
  const [creds, setCreds] = useState({ username: '', password: '', extra_data: {} as Record<string, string> })
  const [form, setForm] = useState({ title: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setStep('bot')
    setSelectedBot(null)
    setPrereqData(null)
    setCreds({ username: '', password: '', extra_data: {} })
    setForm({ title: '', description: '' })
    setError('')
    setLoadingBots(true)
    availableBotsApi.list()
      .then(({ data }) => setBots(Array.isArray(data) ? data : []))
      .finally(() => setLoadingBots(false))
  }, [open])

  const handleSelectBot = async (bot: Bot) => {
    setSelectedBot(bot)
    setLoadingPrereq(true)
    setError('')
    try {
      const { data } = await prereqApi.listByBot(bot.id)
      setPrereqData(data)
      // init extra_data keys from prerequisites
      const extraKeys = Object.keys(data.credential_fields?.extra_data ?? {})
      setCreds({ username: '', password: '', extra_data: Object.fromEntries(extraKeys.map(k => [k, ''])) })
      setStep('credentials')
    } catch {
      setError('Failed to load bot prerequisites.')
    } finally {
      setLoadingPrereq(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      // Step 1: create credential
      const { data: credData } = await credentialsApi.create({
        bot: selectedBot!.id,
        username: creds.username,
        password: creds.password,
        extra_data: creds.extra_data,
      })
      // Step 2: submit request with credential
      await requestsApi.create({
        bot: selectedBot!.id,
        credential: credData.id,
        title: form.title,
        description: form.description,
      })
      onSuccess(`Request "${form.title}" submitted successfully.`)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setError(msg ? JSON.stringify(msg) : 'Failed to submit request.')
    } finally {
      setSaving(false)
    }
  }

  const extraFields = prereqData ? Object.entries(prereqData.credential_fields?.extra_data ?? {}) : []
  const requiredPrereqs = prereqData?.prerequisites.filter(p => p.is_required).map(p => p.name) ?? []

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList size={16} /> New Bot Request
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-1">
            {(['bot', 'credentials', 'confirm'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === s ? 'bg-primary text-primary-foreground' : ((['bot', 'credentials', 'confirm'] as Step[]).indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground')}`}>
                  {i + 1}
                </div>
                <span className={`text-xs ${step === s ? 'font-medium' : 'text-muted-foreground'}`}>
                  {s === 'bot' ? 'Select Bot' : s === 'credentials' ? 'Credentials' : 'Confirm'}
                </span>
                {i < 2 && <ChevronRight size={12} className="text-muted-foreground" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Step 1 — Select Bot */}
        {step === 'bot' && (
          <div className="space-y-3">
            {error && <StatusAlert type="error" message={error} />}
            {loadingBots ? (
              <div className="flex justify-center py-8"><Spinner size="sm" /></div>
            ) : bots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No bots available.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {bots.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBot(b)}
                    disabled={loadingPrereq}
                    className="w-full flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-left hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <BotIcon size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{b.name}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{b.description || '—'}</p>
                    </div>
                    {loadingPrereq && selectedBot?.id === b.id
                      ? <Spinner size="sm" />
                      : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
                  </button>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2 — Credentials */}
        {step === 'credentials' && prereqData && (
          <form onSubmit={(e) => { e.preventDefault(); setStep('confirm') }} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {error && <StatusAlert type="error" message={error} />}
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{selectedBot?.name}</span> — fill in the required fields below.
            </div>

            {/* Login credentials (optional for public sites) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Login Username <span className="text-muted-foreground">(optional)</span></Label>
                <Input placeholder="admin@mysite.com" value={creds.username} onChange={(e) => setCreds(c => ({ ...c, username: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Login Password <span className="text-muted-foreground">(optional)</span></Label>
                <Input type="password" placeholder="••••••••" value={creds.password} onChange={(e) => setCreds(c => ({ ...c, password: e.target.value }))} />
              </div>
            </div>

            <Separator />

            {/* Dynamic extra_data fields from prerequisites */}
            {extraFields.map(([key, hint]) => {
              const isRequired = requiredPrereqs.includes(key)
              return (
                <div key={key} className="space-y-1.5">
                  <Label className="capitalize">
                    {key.replace(/_/g, ' ')}
                    {isRequired && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Input
                    placeholder={hint}
                    value={creds.extra_data[key] ?? ''}
                    onChange={(e) => setCreds(c => ({ ...c, extra_data: { ...c.extra_data, [key]: e.target.value } }))}
                    required={isRequired}
                  />
                </div>
              )
            })}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep('bot')}>Back</Button>
              <Button type="submit">Next</Button>
            </DialogFooter>
          </form>
        )}

        {/* Step 3 — Confirm */}
        {step === 'confirm' && (
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {error && <StatusAlert type="error" message={error} />}
            <div className="space-y-1.5">
              <Label>Request Title</Label>
              <Input
                placeholder={`e.g. Security scan for mysite.com`}
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                placeholder="Any additional notes…"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Summary */}
            <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5 text-xs">
              <p className="font-medium text-sm mb-2">Summary</p>
              <div className="flex justify-between"><span className="text-muted-foreground">Bot</span><span className="font-medium">{selectedBot?.name}</span></div>
              {creds.username && <div className="flex justify-between"><span className="text-muted-foreground">Login</span><span className="font-mono">{creds.username}</span></div>}
              {Object.entries(creds.extra_data).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
                  <span className="font-mono truncate max-w-[180px]">{v}</span>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep('credentials')}>Back</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Spinner size="sm" /> Submitting…</> : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Page ─────────────────────────────────────────────────────────
export default function RequestsPage() {
  const role = useRoleName()
  const isClient = role === 'client'
  const canManage = role === 'superuser' || role === 'manager'

  // Client state
  const [requests, setRequests] = useState<BotRequest[]>([])
  // Manager state
  const [richRequests, setRichRequests] = useState<RequestWithCredential[]>([])

  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [credDialogOpen, setCredDialogOpen] = useState(false)
  const [actionRow, setActionRow] = useState<RequestWithCredential | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [pageAlert, setPageAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const fetchRequests = () => {
    setLoading(true)
    if (isClient) {
      requestsApi.list()
        .then(({ data }) => setRequests(data.results ?? []))
        .catch(() => setPageAlert({ type: 'error', message: 'Failed to load requests.' }))
        .finally(() => setLoading(false))
    } else {
      requestsApi.listWithCredentials()
        .then(({ data }) => setRichRequests(Array.isArray(data) ? data : []))
        .catch(() => setPageAlert({ type: 'error', message: 'Failed to load requests.' }))
        .finally(() => setLoading(false))
    }
  }

  useEffect(() => { fetchRequests() }, [])

  const handleApprove = async (req: RequestWithCredential) => {
    setApprovingId(req.id)
    try {
      await requestsApi.approve(req.id)
      setRichRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r))
      setPageAlert({ type: 'success', message: `Request "${req.title}" approved.` })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setPageAlert({ type: 'error', message: msg ? JSON.stringify(msg) : 'Failed to approve request.' })
    } finally { setApprovingId(null) }
  }

  const handleReject = async (reason: string) => {
    if (!actionRow) return
    try {
      await requestsApi.reject(actionRow.id, reason)
      setRichRequests(prev => prev.map(r => r.id === actionRow.id ? { ...r, status: 'rejected' } : r))
      setPageAlert({ type: 'success', message: `Request "${actionRow.title}" rejected.` })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setPageAlert({ type: 'error', message: msg ? JSON.stringify(msg) : 'Failed to reject request.' })
    } finally { setRejectDialogOpen(false); setActionRow(null) }
  }

  // ── Client columns ───────────────────────────────────────────
  const clientColumns: Column<BotRequest>[] = [
    {
      key: 'title', label: 'Request', sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{r.title}</p>
          <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{r.description || '—'}</p>
        </div>
      ),
    },
    { key: 'bot_name', label: 'Bot', sortable: true, render: (r) => <span className="text-sm">{r.bot_name}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (r) => (
        <div className="space-y-1">
          <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[r.status]}`}>
            {r.status.replace('_', ' ')}
          </Badge>
          {r.rejection_reason && <p className="text-[10px] text-destructive truncate max-w-[160px]">{r.rejection_reason}</p>}
        </div>
      ),
    },
    {
      key: 'created_at', label: 'Submitted',
      render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>,
    },
  ]

  // ── Manager columns ──────────────────────────────────────────
  const managerColumns: Column<RequestWithCredential>[] = [
    {
      key: 'title', label: 'Request', sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{r.title}</p>
          <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{r.description || '—'}</p>
        </div>
      ),
    },
    { key: 'bot_name', label: 'Bot', sortable: true, render: (r) => <span className="text-sm">{r.bot_name}</span> },
    {
      key: 'requested_by_username', label: 'Client', sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
            {r.requested_by_username.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-sm">{r.requested_by_username}</span>
        </div>
      ),
    },
    {
      key: 'credential', label: 'Credentials',
      render: (r) => r.credential ? (
        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => { setActionRow(r); setCredDialogOpen(true) }}>
          <Eye size={12} /> View
        </Button>
      ) : <span className="text-xs text-muted-foreground">None</span>,
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (r) => <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[r.status]}`}>{r.status.replace('_', ' ')}</Badge>,
    },
    {
      key: 'created_at', label: 'Submitted',
      render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>,
    },
    {
      key: 'id', label: 'Actions',
      render: (r) => r.status !== 'pending' ? (
        <span className="text-xs text-muted-foreground capitalize">{r.status.replace('_', ' ')}</span>
      ) : (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" className="gap-1 text-xs text-green-700 border-green-300 hover:bg-green-50"
            onClick={() => handleApprove(r)} disabled={approvingId === r.id}>
            {approvingId === r.id ? <Spinner size="sm" /> : <CheckCircle2 size={12} />} Approve
          </Button>
          <Button size="sm" variant="outline" className="gap-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => { setActionRow(r); setRejectDialogOpen(true) }}>
            <XCircle size={12} /> Reject
          </Button>
        </div>
      ),
    },
  ]

  const displayData = isClient ? requests : richRequests
  const statusCounts = displayData.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1; return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bot Requests</h1>
          <p className="text-sm text-muted-foreground">
            {isClient ? 'Submit and track your bot requests.' : 'Review and manage client bot requests.'}
          </p>
        </div>
        {isClient && (
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus size={16} /> New Request
          </Button>
        )}
      </div>

      {pageAlert && <StatusAlert type={pageAlert.type} message={pageAlert.message} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{displayData.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Pending</p><p className="text-2xl font-bold text-yellow-600">{statusCounts['pending'] ?? 0}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Approved</p><p className="text-2xl font-bold text-green-600">{statusCounts['approved'] ?? 0}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Rejected</p><p className="text-2xl font-bold text-destructive">{statusCounts['rejected'] ?? 0}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardList size={18} /> {isClient ? 'My Requests' : 'All Requests'}</CardTitle>
          <CardDescription>{displayData.length} request{displayData.length !== 1 ? 's' : ''}.</CardDescription>
        </CardHeader>
        <CardContent>
          {isClient ? (
            <DataTable
              columns={clientColumns}
              data={requests}
              loading={loading}
              searchPlaceholder="Search by title or bot…"
              searchKeys={['title', 'bot_name']}
              onRefresh={fetchRequests}
              emptyMessage="No requests yet. Submit your first bot request."
            />
          ) : (
            <DataTable
              columns={managerColumns}
              data={richRequests}
              loading={loading}
              searchPlaceholder="Search by title, bot or client…"
              searchKeys={['title', 'bot_name', 'requested_by_username']}
              onRefresh={fetchRequests}
              emptyMessage="No requests found."
            />
          )}
        </CardContent>
      </Card>

      {/* Client — multi-step submit dialog */}
      <SubmitRequestDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={(msg) => { fetchRequests(); setPageAlert({ type: 'success', message: msg }) }}
      />

      {/* Manager — reject dialog */}
      <RejectDialog
        open={rejectDialogOpen}
        onClose={() => { setRejectDialogOpen(false); setActionRow(null) }}
        onConfirm={handleReject}
      />

      {/* Manager — credential detail dialog */}
      <CredentialDetailDialog
        open={credDialogOpen}
        onClose={() => { setCredDialogOpen(false); setActionRow(null) }}
        request={actionRow}
      />
    </div>
  )
}
