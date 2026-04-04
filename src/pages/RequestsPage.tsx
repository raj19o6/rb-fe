import { useEffect, useState } from 'react'
import { Plus, ClipboardList, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Badge } from '@/components/watermelon-ui/badge'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/watermelon-ui/dialog'
import { DataTable, type Column } from '@/components/DataTable'
import { StatusAlert } from '@/components/ConfirmDialog'
import { requestsApi, availableBotsApi, botsApi, type BotRequest, type Bot } from '@/lib/api'
import { useRoleName } from '@/lib/auth'

const STATUS_COLORS: Record<string, string> = {
  pending:     'border-yellow-500/40 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200',
  approved:    'border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200',
  rejected:    'bg-destructive/10 text-destructive border-destructive/20',
  in_progress: 'border-blue-500/30 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  completed:   'border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200',
}

// ── Submit Request Dialog (client only) ──────────────────────────
function SubmitRequestDialog({ open, onClose, onSuccess, bots }: {
  open: boolean
  onClose: () => void
  onSuccess: (msg: string) => void
  bots: Bot[]
}) {
  const [form, setForm] = useState({ bot: '', title: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setForm({ bot: '', title: '', description: '' })
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await requestsApi.create(form)
      onSuccess(`Request "${form.title}" submitted successfully.`)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setError(msg ? JSON.stringify(msg) : 'Failed to submit request.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request a Bot</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Bot</Label>
            <select
              value={form.bot}
              onChange={(e) => setForm(f => ({ ...f, bot: e.target.value }))}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a bot…</option>
              {bots.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              placeholder="e.g. Request for Invoice Bot"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              placeholder="Why do you need this bot?"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          {error && <StatusAlert type="error" message={error} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Spinner size="sm" /> Submitting…</> : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Reject Dialog (manager/superuser) ────────────────────────────
function RejectDialog({ open, onClose, onConfirm }: {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setReason('')
    setSaving(false)
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onConfirm(reason)
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reject Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Rejection Reason</Label>
            <Input
              placeholder="e.g. Bot not available in your region"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
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

// ── Page ─────────────────────────────────────────────────────────
export default function RequestsPage() {
  const role = useRoleName()
  const isClient = role === 'client'
  const canManage = role === 'superuser' || role === 'manager'

  const [requests, setRequests] = useState<BotRequest[]>([])
  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [actionRow, setActionRow] = useState<BotRequest | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [pageAlert, setPageAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const fetchRequests = () => {
    setLoading(true)
    requestsApi.list()
      .then(({ data }) => setRequests(data.results ?? []))
      .catch(() => setPageAlert({ type: 'error', message: 'Failed to load requests.' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRequests()
    const botsCall = isClient ? availableBotsApi.list().then(({ data }) => setBots(Array.isArray(data) ? data : [])) : botsApi.list().then(({ data }) => setBots(data.results ?? []))
    botsCall.catch(() => {})
  }, [])

  const handleApprove = async (req: BotRequest) => {
    setApprovingId(req.id)
    try {
      await requestsApi.approve(req.id)
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r))
      setPageAlert({ type: 'success', message: `Request "${req.title}" approved.` })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setPageAlert({ type: 'error', message: msg ? JSON.stringify(msg) : 'Failed to approve request.' })
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = async (reason: string) => {
    if (!actionRow) return
    try {
      await requestsApi.reject(actionRow.id, reason)
      setRequests(prev => prev.map(r => r.id === actionRow.id ? { ...r, status: 'rejected', rejection_reason: reason } : r))
      setPageAlert({ type: 'success', message: `Request "${actionRow.title}" rejected.` })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setPageAlert({ type: 'error', message: msg ? JSON.stringify(msg) : 'Failed to reject request.' })
    } finally {
      setRejectDialogOpen(false)
      setActionRow(null)
    }
  }

  const statusCounts = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  const columns: Column<BotRequest>[] = [
    {
      key: 'title',
      label: 'Request',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{r.title}</p>
          <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{r.description || '—'}</p>
        </div>
      ),
    },
    {
      key: 'bot_name',
      label: 'Bot',
      sortable: true,
      render: (r) => <span className="text-sm">{r.bot_name}</span>,
    },
    ...(!isClient ? [{
      key: 'requested_by_username',
      label: 'Client',
      sortable: true,
      render: (r: BotRequest) => (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
            {r.requested_by_username.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-sm">{r.requested_by_username}</span>
        </div>
      ),
    }] as Column<BotRequest>[] : []),
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (r) => (
        <div className="space-y-1">
          <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[r.status]}`}>
            {r.status.replace('_', ' ')}
          </Badge>
          {r.rejection_reason && (
            <p className="text-[10px] text-destructive truncate max-w-[160px]">{r.rejection_reason}</p>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Submitted',
      render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>,
    },
    ...(canManage ? [{
      key: 'id',
      label: 'Actions',
      render: (r: BotRequest) => r.status !== 'pending' ? (
        <span className="text-xs text-muted-foreground capitalize">{r.status.replace('_', ' ')}</span>
      ) : (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-xs text-green-700 border-green-300 hover:bg-green-50"
            onClick={() => handleApprove(r)}
            disabled={approvingId === r.id}
          >
            {approvingId === r.id ? <Spinner size="sm" /> : <CheckCircle2 size={12} />}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => { setActionRow(r); setRejectDialogOpen(true) }}
          >
            <XCircle size={12} /> Reject
          </Button>
        </div>
      ),
    }] as Column<BotRequest>[] : []),
  ]

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
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{requests.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Pending</p><p className="text-2xl font-bold text-yellow-600">{statusCounts['pending'] ?? 0}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Approved</p><p className="text-2xl font-bold text-green-600">{statusCounts['approved'] ?? 0}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Rejected</p><p className="text-2xl font-bold text-destructive">{statusCounts['rejected'] ?? 0}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardList size={18} /> {isClient ? 'My Requests' : 'All Requests'}</CardTitle>
          <CardDescription>{requests.length} request{requests.length !== 1 ? 's' : ''}.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={requests}
            loading={loading}
            searchPlaceholder="Search by title or bot…"
            searchKeys={['title', 'bot_name', 'requested_by_username']}
            onRefresh={fetchRequests}
            emptyMessage={isClient ? 'No requests yet. Submit your first bot request.' : 'No requests found.'}
          />
        </CardContent>
      </Card>

      <SubmitRequestDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={(msg) => { fetchRequests(); setPageAlert({ type: 'success', message: msg }) }}
        bots={bots}
      />

      <RejectDialog
        open={rejectDialogOpen}
        onClose={() => { setRejectDialogOpen(false); setActionRow(null) }}
        onConfirm={handleReject}
      />
    </div>
  )
}
