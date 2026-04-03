import { useEffect, useState } from 'react'
import { Plus, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Badge } from '@/components/watermelon-ui/badge'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/watermelon-ui/dialog'
import { DataTable, type Column } from '@/components/DataTable'
import { paymentApi, billingApi, type Payment, type Billing } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-600 border-green-200',
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
}

function PaymentFormDialog({ open, onClose, onSuccess, billings, userId }: {
  open: boolean; onClose: () => void; onSuccess: () => void
  billings: Billing[]; userId: string
}) {
  const [form, setForm] = useState({
    billing: '', paid_by: userId, amount: '', transaction_id: '',
    method: 'online', status: 'completed', paid_at: new Date().toISOString().slice(0, 16),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setForm({ billing: '', paid_by: userId, amount: '', transaction_id: '', method: 'online', status: 'completed', paid_at: new Date().toISOString().slice(0, 16) })
  }, [open, userId])

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }))

  const handleBillingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const billing = billings.find(b => b.id === e.target.value)
    setForm(p => ({ ...p, billing: e.target.value, amount: billing?.amount ?? '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await paymentApi.create({ ...form, paid_at: new Date(form.paid_at).toISOString() })
      onSuccess(); onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setError(msg ? JSON.stringify(msg) : 'Failed to create payment.')
    } finally { setSaving(false) }
  }

  const unpaidBillings = billings.filter(b => b.status !== 'paid')

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Make Payment</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Billing Record</Label>
            <select value={form.billing} onChange={handleBillingChange} required className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">Select billing…</option>
              {unpaidBillings.map(b => (
                <option key={b.id} value={b.id}>{b.bot_name} — ₹{b.amount} ({b.status})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" step="0.01" value={form.amount} onChange={f('amount')} required />
          </div>
          <div className="space-y-1.5">
            <Label>Transaction ID</Label>
            <Input placeholder="TXN-20250201-001" value={form.transaction_id} onChange={f('transaction_id')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Method</Label>
              <select value={form.method} onChange={f('method')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="online">Online</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select value={form.status} onChange={f('status')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Paid At</Label>
            <Input type="datetime-local" value={form.paid_at} onChange={f('paid_at')} required />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Spinner size="sm" /> Processing…</> : 'Submit Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function PaymentPage() {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const [payments, setPayments] = useState<Payment[]>([])
  const [billings, setBillings] = useState<Billing[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchPayments = () => {
    setLoading(true)
    paymentApi.list().then(({ data }) => setPayments(Array.isArray(data) ? data : [])).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPayments()
    billingApi.list().then(({ data }) => setBillings(Array.isArray(data) ? data : []))
  }, [])

  const columns: Column<Payment>[] = [
    {
      key: 'paid_by_username', label: 'Paid By', sortable: true,
      render: (p) => (
        <div>
          <p className="font-medium text-sm">{p.paid_by_username}</p>
          <p className="text-[10px] font-mono text-muted-foreground">{p.transaction_id}</p>
        </div>
      ),
    },
    { key: 'amount', label: 'Amount', render: (p) => <span className="font-mono text-sm font-semibold">₹{p.amount}</span> },
    {
      key: 'method', label: 'Method',
      render: (p) => <Badge variant="secondary" className="text-xs capitalize">{p.method.replace('_', ' ')}</Badge>,
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (p) => <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[p.status]}`}>{p.status}</Badge>,
    },
    {
      key: 'billing_status', label: 'Billing',
      render: (p) => <Badge variant="outline" className="text-xs capitalize">{p.billing_status}</Badge>,
    },
    { key: 'paid_at', label: 'Paid At', render: (p) => <span className="text-xs text-muted-foreground">{new Date(p.paid_at).toLocaleString()}</span> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground">Track and submit payments for billing records.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={16} /> Make Payment
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total Payments</p><p className="text-2xl font-bold">{payments.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total Paid</p><p className="text-2xl font-bold text-green-600">₹{payments.filter(p => p.status === 'completed').reduce((s, p) => s + parseFloat(p.amount), 0).toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Pending</p><p className="text-2xl font-bold text-yellow-600">{payments.filter(p => p.status === 'pending').length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard size={18} /> Payment History</CardTitle>
          <CardDescription>{payments.length} payment{payments.length !== 1 ? 's' : ''} recorded.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns} data={payments} loading={loading}
            searchPlaceholder="Search by username or transaction…" searchKeys={['paid_by_username', 'transaction_id']}
            onRefresh={fetchPayments}
            emptyMessage="No payments yet."
          />
        </CardContent>
      </Card>

      <PaymentFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={fetchPayments} billings={billings} userId={userId} />
    </div>
  )
}
