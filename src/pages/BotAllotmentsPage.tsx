import { useEffect, useState } from 'react'
import { Plus, Link as LinkIcon, Bot as BotIcon, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Label } from '@/components/watermelon-ui/label'
import { Badge } from '@/components/watermelon-ui/badge'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/watermelon-ui/dialog'
import { DataTable, type Column } from '@/components/DataTable'
import { StatusAlert } from '@/components/ConfirmDialog'
import { botAllotmentsApi, botsApi, usersApi, type BotAllotment, type Bot, type ListUser } from '@/lib/api'

function AllotFormDialog({ open, onClose, onSuccess, bots, users }: {
  open: boolean; onClose: () => void; onSuccess: (msg: string) => void
  bots: Bot[]; users: ListUser[]
}) {
  const [form, setForm] = useState({ bot: '', user: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (!open) return; setError(''); setForm({ bot: '', user: '' }) }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await botAllotmentsApi.create(form)
      const botName = bots.find(b => b.id === form.bot)?.name ?? form.bot
      const username = users.find(u => u.id === form.user)?.username ?? form.user
      onSuccess(`Bot "${botName}" allotted to "${username}" successfully.`)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setError(msg ? JSON.stringify(msg) : 'Failed to allot bot.')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon size={16} /> Allot Bot to Client
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Bot</Label>
            <select
              value={form.bot}
              onChange={(e) => setForm(p => ({ ...p, bot: e.target.value }))}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select bot…</option>
              {bots.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.status})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Client</Label>
            <select
              value={form.user}
              onChange={(e) => setForm(p => ({ ...p, user: e.target.value }))}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select client…</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username} — {u.email}</option>
              ))}
            </select>
          </div>
          {error && <StatusAlert type="error" message={error} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.bot || !form.user}>
              {saving ? <><Spinner size="sm" /> Allotting…</> : 'Allot Bot'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function BotAllotmentsPage() {
  const [allotments, setAllotments] = useState<BotAllotment[]>([])
  const [bots, setBots] = useState<Bot[]>([])
  const [users, setUsers] = useState<ListUser[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pageAlert, setPageAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const fetchAllotments = () => {
    setLoading(true)
    botAllotmentsApi.list()
      .then(({ data }) => setAllotments(data.results ?? []))
      .catch(() => setPageAlert({ type: 'error', message: 'Failed to load allotments.' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAllotments()
    botsApi.list().then(({ data }) => setBots(data.results ?? []))
    usersApi.list().then(({ data }) => setUsers(data.results ?? []))
  }, [])

  const handleDelete = async (a: BotAllotment) => {
    setDeletingId(a.id)
    try {
      await botAllotmentsApi.delete(a.id)
      setAllotments(p => p.filter(x => x.id !== a.id))
      setPageAlert({ type: 'success', message: `Allotment for "${a.username}" removed.` })
    } catch {
      setPageAlert({ type: 'error', message: 'Failed to remove allotment.' })
    } finally { setDeletingId(null) }
  }

  const columns: Column<BotAllotment>[] = [
    {
      key: 'bot_name', label: 'Bot', sortable: true,
      render: (a) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <BotIcon size={13} className="text-primary" />
          </div>
          <span className="font-medium text-sm">{a.bot_name}</span>
        </div>
      ),
    },
    {
      key: 'username', label: 'Client', sortable: true,
      render: (a) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            <User size={13} className="text-muted-foreground" />
          </div>
          <span className="text-sm">{a.username}</span>
        </div>
      ),
    },
    {
      key: 'allotted_at', label: 'Allotted At',
      render: (a) => (
        <span className="text-xs text-muted-foreground">
          {a.allotted_at ? new Date(a.allotted_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'bot', label: 'Bot ID',
      render: (a) => <span className="font-mono text-[10px] text-muted-foreground">{a.bot.slice(0, 8)}…</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bot Allotments</h1>
          <p className="text-sm text-muted-foreground">Assign bots to clients.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={16} /> Allot Bot
        </Button>
      </div>

      {pageAlert && <StatusAlert type={pageAlert.type} message={pageAlert.message} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total Allotments</p><p className="text-2xl font-bold">{allotments.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Unique Bots</p><p className="text-2xl font-bold">{new Set(allotments.map(a => a.bot)).size}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Unique Clients</p><p className="text-2xl font-bold">{new Set(allotments.map(a => a.user)).size}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LinkIcon size={18} /> All Allotments</CardTitle>
          <CardDescription>{allotments.length} allotment{allotments.length !== 1 ? 's' : ''} configured.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={allotments}
            loading={loading}
            searchPlaceholder="Search by bot or client…"
            searchKeys={['bot_name', 'username']}
            onRefresh={fetchAllotments}
            onDelete={handleDelete}
            deletePermission="delete_customuser"
            deletingId={deletingId}
            deleteConfirmTitle="Remove Allotment"
            deleteConfirmDescription={(a) => `Remove bot "${a.bot_name}" from client "${a.username}"?`}
            emptyMessage="No allotments yet. Allot a bot to a client."
          />
        </CardContent>
      </Card>

      <AllotFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={(msg) => { fetchAllotments(); setPageAlert({ type: 'success', message: msg }) }}
        bots={bots}
        users={users}
      />
    </div>
  )
}
