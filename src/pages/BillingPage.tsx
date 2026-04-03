import { useEffect, useState } from 'react'
import { Plus, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Badge } from '@/components/watermelon-ui/badge'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/watermelon-ui/dialog'
import { DataTable, type Column } from '@/components/DataTable'
import { billingApi, botsApi, usersApi, type Billing, type Bot, type ListUser } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-500/10 text-green-600 border-green-200',
  unpaid: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
}

function BillingFormDialog({ open, onClose, onSuccess, editBilling, bots, users }: {
  open: boolean; onClose: () => void; onSuccess: () => void
  editBilling: Billing | null; bots: Bot[]; users: ListUser[]
}) {
  const [form, setForm] = useState({ user: '', bot: '', amount: '', status: 'unpaid', billing_date: '', due_date: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setForm(editBilling
      ? { user: editBilling.user, bot: editBilling.bot, amount: editBilling.amount, status: editBilling.status, billing_date: editBilling.billing_date, due_date: editBilling.due_date }
      : { user: '', bot: '', amount: '', status: 'unpaid', billing_date: '', due_date: '' })
  }, [open, editBilling])

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editBilling) await billingApi.update(editBilling.id, { amount: form.amount, status: form.status, due_date: form.due_date })
      else await billingApi.create(form)
      onSuccess(); onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setError(msg ? JSON.stringify(msg) : 'Failed to save billing.')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editBilling ? 'Edit Billing' : 'Create Billing'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editBilling && (
            <>
              <div className="space-y-1.5">
                <Label>Client</Label>
                <select value={form.user} onChange={f('user')} required className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">Select client…</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Bot</Label>
                <select value={form.bot} onChange={f('bot')} required className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">Select bot…</option>
                  {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" step="0.01" placeholder="1200.00" value={form.amount} onChange={f('amount')} required />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <select value={form.status} onChange={f('status')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Billing Date</Label>
              <Input type="date" value={form.billing_date} onChange={f('billing_date')} required={!editBilling} />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={f('due_date')} required={!editBilling} />
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Spinner size="sm" /> Saving…</> : editBilling ? 'Update' : 'Create Billing'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function BillingPage() {
  const [billings, setBillings] = useState<Billing[]>([])
  const [bots, setBots] = useState<Bot[]>([])
  const [users, setUsers] = useState<ListUser[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editBilling, setEditBilling] = useState<Billing | null>(null)

  const fetchBillings = () => {
    setLoading(true)
    billingApi.list().then(({ data }) => setBillings(Array.isArray(data) ? data : [])).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchBillings()
    botsApi.list().then(({ data }) => setBots(data.results ?? []))
    usersApi.list().then(({ data }) => setUsers(data.results ?? []))
  }, [])

  const handleDelete = async (b: Billing) => {
    if (!confirm(`Delete billing for "${b.username}"?`)) return
    setDeletingId(b.id)
    try { await billingApi.delete(b.id); setBillings(p => p.filter(x => x.id !== b.id)) }
    finally { setDeletingId(null) }
  }

  const columns: Column<Billing>[] = [
    {
      key: 'username', label: 'Client', sortable: true,
      render: (b) => (
        <div>
          <p className="font-medium text-sm">{b.username}</p>
          <p className="text-[10px] text-muted-foreground">{b.bot_name}</p>
        </div>
      ),
    },
    { key: 'amount', label: 'Amount', render: (b) => <span className="font-mono text-sm font-semibold">₹{b.amount}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (b) => <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[b.status]}`}>{b.status}</Badge>,
    },
    { key: 'billing_date', label: 'Billing Date', render: (b) => <span className="text-xs text-muted-foreground">{b.billing_date}</span> },
    { key: 'due_date', label: 'Due Date', render: (b) => <span className="text-xs text-muted-foreground">{b.due_date}</span> },
  ]

  const statusCounts = billings.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1; return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-sm text-muted-foreground">Manage billing records for clients.</p>
        </div>
        <Button onClick={() => { setEditBilling(null); setDialogOpen(true) }} className="gap-2">
          <Plus size={16} /> New Billing
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{billings.length}</p></CardContent></Card>
        {Object.entries(statusCounts).map(([s, c]) => (
          <Card key={s}><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground capitalize">{s}</p><p className="text-2xl font-bold">{c}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Receipt size={18} /> All Billing Records</CardTitle>
          <CardDescription>{billings.length} record{billings.length !== 1 ? 's' : ''}.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns} data={billings} loading={loading}
            searchPlaceholder="Search by client or bot…" searchKeys={['username', 'bot_name']}
            onRefresh={fetchBillings}
            onEdit={(b) => { setEditBilling(b); setDialogOpen(true) }}
            onDelete={handleDelete}
            editPermission="change_customuser"
            deletePermission="delete_customuser"
            deletingId={deletingId}
            emptyMessage="No billing records found."
          />
        </CardContent>
      </Card>

      <BillingFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={fetchBillings} editBilling={editBilling} bots={bots} users={users} />
    </div>
  )
}
