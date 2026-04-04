import { useEffect, useState } from 'react'
import { Plus, Bot as BotIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Badge } from '@/components/watermelon-ui/badge'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/watermelon-ui/dialog'
import { DataTable, type Column } from '@/components/DataTable'
import { StatusAlert } from '@/components/ConfirmDialog'
import { botsApi, type Bot, type BotAllotment } from '@/lib/api'
import { useAuthStore, useRoleName } from '@/lib/auth'

const STATUS_COLORS: Record<string, string> = {
  active: 'border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200',
  inactive: 'bg-muted text-muted-foreground',
  maintenance: 'border-yellow-500/40 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200',
}

type FormState = { name: string; description: string; status: string }
const empty: FormState = { name: '', description: '', status: 'active' }

function BotFormDialog({ open, onClose, onSuccess, editBot }: {
  open: boolean; onClose: () => void; onSuccess: (msg: string) => void; editBot: Bot | null
}) {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setForm(editBot ? { name: editBot.name, description: editBot.description, status: editBot.status } : empty)
  }, [open, editBot])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      if (editBot) {
        await botsApi.update(editBot.id, form)
        onSuccess(`Bot "${form.name}" updated successfully.`)
      } else {
        await botsApi.create({ ...form, created_by: userId })
        onSuccess(`Bot "${form.name}" created successfully.`)
      }
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setError(msg ? JSON.stringify(msg) : 'Failed to save bot.')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editBot ? `Edit — ${editBot.name}` : 'Create New Bot'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder="e.g. InvoiceBot" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input placeholder="What does this bot do?" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <div className="flex gap-2">
              {(['active', 'inactive', 'maintenance'] as const).map((s) => (
                <button key={s} type="button"
                  onClick={() => setForm(f => ({ ...f, status: s }))}
                  className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                    form.status === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
          {error && <StatusAlert type="error" message={error} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Spinner size="sm" /> Saving…</> : editBot ? 'Update Bot' : 'Create Bot'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Client view — allotted bots ──────────────────────────────────
function ClientBotsView() {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const [allotments, setAllotments] = useState<BotAllotment[]>([])
  const [loading, setLoading] = useState(true)
  const [pageAlert, setPageAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const fetchAllotments = () => {
    setLoading(true)
    botsApi.getByUser(userId)
      .then(({ data }) => setAllotments(Array.isArray(data) ? data : []))
      .catch(() => setPageAlert({ type: 'error', message: 'Failed to load your bots.' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAllotments() }, [])

  const columns: Column<BotAllotment>[] = [
    {
      key: 'bot_name', label: 'Bot', sortable: true,
      render: (a) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <BotIcon size={14} className="text-primary" />
          </div>
          <p className="font-medium text-sm">{a.bot_name}</p>
        </div>
      ),
    },
    {
      key: 'allotted_at', label: 'Allotted On',
      render: (a) => <span className="text-xs text-muted-foreground">{a.allotted_at ? new Date(a.allotted_at).toLocaleDateString() : '—'}</span>,
    },
    {
      key: 'bot', label: 'Bot ID',
      render: (a) => <span className="font-mono text-[10px] text-muted-foreground">{a.bot.slice(0, 8)}…</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Bots</h1>
        <p className="text-sm text-muted-foreground">{allotments.length} bot{allotments.length !== 1 ? 's' : ''} allotted to your account.</p>
      </div>
      {pageAlert && <StatusAlert type={pageAlert.type} message={pageAlert.message} />}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BotIcon size={18} /> My Allotted Bots</CardTitle>
          <CardDescription>Bots assigned to you by your manager or admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={allotments}
            loading={loading}
            searchPlaceholder="Search bots…"
            searchKeys={['bot_name']}
            onRefresh={fetchAllotments}
            emptyMessage="No bots allotted to you yet."
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ── Superuser / Manager view — full CRUD ─────────────────────────
export default function BotsPage() {
  const role = useRoleName()
  const isClient = role === 'client'

  if (isClient) return <ClientBotsView />

  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editBot, setEditBot] = useState<Bot | null>(null)
  const [pageAlert, setPageAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const fetchBots = () => {
    setLoading(true)
    botsApi.list()
      .then(({ data }) => setBots(data.results ?? []))
      .catch(() => setPageAlert({ type: 'error', message: 'Failed to load bots.' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBots() }, [])

  const handleDelete = async (bot: Bot) => {
    setDeletingId(bot.id)
    try {
      await botsApi.delete(bot.id)
      setBots(p => p.filter(b => b.id !== bot.id))
      setPageAlert({ type: 'success', message: `Bot "${bot.name}" deleted successfully.` })
    } catch {
      setPageAlert({ type: 'error', message: `Failed to delete bot "${bot.name}".` })
    } finally { setDeletingId(null) }
  }

  const statusCounts = bots.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1; return acc
  }, {})

  const columns: Column<Bot>[] = [
    {
      key: 'name', label: 'Bot', sortable: true,
      render: (b) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <BotIcon size={14} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{b.name}</p>
            <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{b.description || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (b) => (
        <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[b.status]}`}>{b.status}</Badge>
      ),
    },
    {
      key: 'created_at', label: 'Created',
      render: (b) => <span className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bots</h1>
          <p className="text-sm text-muted-foreground">{bots.length} bot{bots.length !== 1 ? 's' : ''} configured.</p>
        </div>
        <Button onClick={() => { setEditBot(null); setDialogOpen(true) }} className="gap-2">
          <Plus size={16} /> New Bot
        </Button>
      </div>

      {pageAlert && <StatusAlert type={pageAlert.type} message={pageAlert.message} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{bots.length}</p></CardContent></Card>
        {Object.entries(statusCounts).map(([s, c]) => (
          <Card key={s}><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground capitalize">{s}</p><p className="text-2xl font-bold">{c}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BotIcon size={18} /> All Bots</CardTitle>
          <CardDescription>Manage your bots — create, update status, or delete.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns} data={bots} loading={loading}
            searchPlaceholder="Search bots…" searchKeys={['name', 'description']}
            onRefresh={fetchBots}
            onEdit={(b) => { setEditBot(b); setDialogOpen(true) }}
            onDelete={handleDelete}
            editPermission="change_customuser"
            deletePermission="delete_customuser"
            deletingId={deletingId}
            deleteConfirmTitle="Delete Bot"
            deleteConfirmDescription={(b) => `Are you sure you want to delete "${b.name}"? This cannot be undone.`}
            emptyMessage="No bots yet. Create your first bot."
          />
        </CardContent>
      </Card>

      <BotFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={(msg) => { fetchBots(); setPageAlert({ type: 'success', message: msg }) }}
        editBot={editBot}
      />
    </div>
  )
}
