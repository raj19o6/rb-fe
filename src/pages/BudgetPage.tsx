import { useEffect, useState } from 'react'
import { Plus, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Badge } from '@/components/watermelon-ui/badge'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/watermelon-ui/dialog'
import { DataTable, type Column } from '@/components/DataTable'
import { StatusAlert } from '@/components/ConfirmDialog'
import { budgetApi, botsApi, usersApi, type Budget, type Bot, type ListUser } from '@/lib/api'
import { useAuthStore, useRoleName } from '@/lib/auth'

function BudgetFormDialog({ open, onClose, onSuccess, editBudget, bots, users }: {
  open: boolean; onClose: () => void; onSuccess: () => void
  editBudget: Budget | null; bots: Bot[]; users: ListUser[]
}) {
  const [form, setForm] = useState({ user: '', bot: '', allocated_amount: '', period_start: '', period_end: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setForm(editBudget
      ? { user: editBudget.user, bot: editBudget.bot, allocated_amount: editBudget.allocated_amount, period_start: editBudget.period_start, period_end: editBudget.period_end }
      : { user: '', bot: '', allocated_amount: '', period_start: '', period_end: '' })
  }, [open, editBudget])

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editBudget) await budgetApi.update(editBudget.id, { allocated_amount: form.allocated_amount, period_start: form.period_start, period_end: form.period_end })
      else await budgetApi.create(form)
      onSuccess(); onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setError(msg ? JSON.stringify(msg) : 'Failed to save budget.')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editBudget ? 'Edit Budget' : 'Create Budget'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editBudget && (
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
            <Label>Allocated Amount</Label>
            <Input type="number" step="0.01" placeholder="5000.00" value={form.allocated_amount} onChange={f('allocated_amount')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Period Start</Label>
              <Input type="date" value={form.period_start} onChange={f('period_start')} required />
            </div>
            <div className="space-y-1.5">
              <Label>Period End</Label>
              <Input type="date" value={form.period_end} onChange={f('period_end')} required />
            </div>
          </div>
          {error && <StatusAlert type="error" message={error} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Spinner size="sm" /> Saving…</> : editBudget ? 'Update' : 'Create Budget'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function BudgetPage() {
  const role = useRoleName()
  const isClient = role === 'client'
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [bots, setBots] = useState<Bot[]>([])
  const [users, setUsers] = useState<ListUser[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editBudget, setEditBudget] = useState<Budget | null>(null)
  const [pageAlert, setPageAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [botFilter, setBotFilter] = useState('')

  const fetchBudgets = (bot_id?: string) => {
    setLoading(true)
    const call = isClient ? budgetApi.getMy(bot_id) : budgetApi.list()
    const handler = isClient
      ? call.then(({ data }) => setBudgets(Array.isArray(data) ? data : []))
      : (call as ReturnType<typeof budgetApi.list>).then(({ data }) => setBudgets(data.results ?? []))
    handler.catch(() => setPageAlert({ type: 'error', message: 'Failed to load budgets.' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchBudgets()
    botsApi.list().then(({ data }) => setBots(data.results ?? []))
    if (!isClient) usersApi.list().then(({ data }) => setUsers(data.results ?? []))
  }, [])

  const handleBotFilter = (bot_id: string) => {
    setBotFilter(bot_id)
    fetchBudgets(bot_id || undefined)
  }

  const handleDelete = async (b: Budget) => {
    setDeletingId(b.id)
    try {
      await budgetApi.delete(b.id)
      setBudgets(p => p.filter(x => x.id !== b.id))
      setPageAlert({ type: 'success', message: `Budget for "${b.username}" deleted.` })
    } catch {
      setPageAlert({ type: 'error', message: 'Failed to delete budget.' })
    } finally { setDeletingId(null) }
  }

  const columns: Column<Budget>[] = [
    {
      key: 'username', label: 'Client', sortable: true,
      render: (b) => (
        <div>
          <p className="font-medium text-sm">{b.username}</p>
          <p className="text-[10px] text-muted-foreground">{b.bot_name}</p>
        </div>
      ),
    },
    { key: 'allocated_amount', label: 'Allocated', render: (b) => <span className="font-mono text-sm">₹{b.allocated_amount}</span> },
    { key: 'consumed_amount', label: 'Consumed', render: (b) => <span className="font-mono text-sm text-destructive">₹{b.consumed_amount}</span> },
    { key: 'remaining_amount', label: 'Remaining', render: (b) => <span className="font-mono text-sm text-green-600">₹{b.remaining_amount}</span> },
    {
      key: 'period', label: 'Period',
      render: (b) => <span className="text-xs text-muted-foreground">{b.period_start} → {b.period_end}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budget</h1>
          <p className="text-sm text-muted-foreground">{isClient ? 'Your allocated budgets.' : 'Manage client budgets.'}</p>
        </div>
        {!isClient && (
          <Button onClick={() => { setEditBudget(null); setDialogOpen(true) }} className="gap-2">
            <Plus size={16} /> Allocate Budget
          </Button>
        )}
      </div>

          {isClient && bots.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={botFilter}
                onChange={(e) => handleBotFilter(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              >
                <option value="">All Bots</option>
                {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

      {pageAlert && <StatusAlert type={pageAlert.type} message={pageAlert.message} />}

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total Allocated</p><p className="text-2xl font-bold">₹{budgets.reduce((s, b) => s + parseFloat(b.allocated_amount), 0).toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total Consumed</p><p className="text-2xl font-bold text-destructive">₹{budgets.reduce((s, b) => s + parseFloat(b.consumed_amount), 0).toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total Remaining</p><p className="text-2xl font-bold text-green-600">₹{budgets.reduce((s, b) => s + parseFloat(b.remaining_amount), 0).toFixed(2)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign size={18} /> {isClient ? 'My Budgets' : 'All Budgets'}</CardTitle>
          <CardDescription>{budgets.length} budget record{budgets.length !== 1 ? 's' : ''}.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns} data={budgets} loading={loading}
            searchPlaceholder="Search by client or bot…" searchKeys={['username', 'bot_name']}
            onRefresh={() => fetchBudgets(botFilter || undefined)}
            onEdit={!isClient ? (b) => { setEditBudget(b); setDialogOpen(true) } : undefined}
            onDelete={!isClient ? handleDelete : undefined}
            editPermission="change_customuser"
            deletePermission="delete_customuser"
            deletingId={deletingId}
            deleteConfirmTitle="Delete Budget"
            deleteConfirmDescription={(b) => `Delete budget for "${b.username}" (${b.bot_name})? This cannot be undone.`}
            emptyMessage="No budgets found."
          />
        </CardContent>
      </Card>

      <BudgetFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={fetchBudgets} editBudget={editBudget} bots={bots} users={users} />
    </div>
  )
}
