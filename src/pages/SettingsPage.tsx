import { useState } from 'react'
import { Settings, Gift, TrendingUp, CheckCircle2, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Separator } from '@/components/watermelon-ui/separator'
import { Badge } from '@/components/watermelon-ui/badge'
import { StatusAlert } from '@/components/ConfirmDialog'
import { billingApi, usersApi, type ListUser } from '@/lib/api'
import { useEffect } from 'react'

export default function SettingsPage() {
  const [users, setUsers] = useState<ListUser[]>([])

  // Welcome credit state
  const [grantLoading, setGrantLoading] = useState(false)
  const [grantResult, setGrantResult] = useState<{ granted: string[]; skipped: string[]; message: string } | null>(null)
  const [grantAlert, setGrantAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Top up state
  const [topUpUserId, setTopUpUserId] = useState('')
  const [topUpAmount, setTopUpAmount] = useState('')
  const [topUpLoading, setTopUpLoading] = useState(false)
  const [topUpAlert, setTopUpAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    usersApi.list().then(({ data }) => setUsers(data.results ?? []))
  }, [])

  const handleGrantWelcomeCredit = async () => {
    setGrantLoading(true)
    setGrantAlert(null)
    setGrantResult(null)
    try {
      const { data } = await billingApi.grantWelcomeCredit()
      setGrantResult(data)
      setGrantAlert({ type: 'success', message: data.message })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setGrantAlert({ type: 'error', message: msg ?? 'Failed to grant welcome credit.' })
    } finally {
      setGrantLoading(false)
    }
  }

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topUpUserId || !topUpAmount) return
    setTopUpLoading(true)
    setTopUpAlert(null)
    try {
      const { data } = await billingApi.topUp({ user_id: topUpUserId, amount: topUpAmount })
      setTopUpAlert({ type: 'success', message: data.message ?? `₹${topUpAmount} topped up successfully.` })
      setTopUpUserId('')
      setTopUpAmount('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setTopUpAlert({ type: 'error', message: msg ?? 'Failed to top up balance.' })
    } finally {
      setTopUpLoading(false)
    }
  }

  const selectedUser = users.find(u => u.id === topUpUserId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Settings size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Superuser billing controls and credit management.</p>
        </div>
      </div>

      <Separator />

      {/* Grant Welcome Credit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift size={18} className="text-green-600" /> Grant Welcome Credit
          </CardTitle>
          <CardDescription>
            Backfill ₹1000 credit for every existing non-superuser who doesn't already have one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {grantAlert && <StatusAlert type={grantAlert.type} message={grantAlert.message} />}

          {grantResult && (
            <div className="space-y-3">
              {grantResult.granted.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Credited ({grantResult.granted.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {grantResult.granted.map(u => (
                      <Badge key={u} variant="outline" className="text-xs border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200 gap-1">
                        <CheckCircle2 size={10} /> {u}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {grantResult.skipped.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Skipped — already had credit ({grantResult.skipped.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {grantResult.skipped.map(u => (
                      <Badge key={u} variant="secondary" className="text-xs">{u}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleGrantWelcomeCredit}
            disabled={grantLoading}
            className="gap-2"
          >
            {grantLoading ? <><Spinner size="sm" /> Processing…</> : <><Gift size={14} /> Grant ₹1000 Welcome Credit</>}
          </Button>
        </CardContent>
      </Card>

      {/* Top Up */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" /> Top Up User Balance
          </CardTitle>
          <CardDescription>
            Manually top up any specific user's billing balance by a custom amount.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topUpAlert && <StatusAlert type={topUpAlert.type} message={topUpAlert.message} />}
          <form onSubmit={handleTopUp} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Select User</Label>
              <select
                value={topUpUserId}
                onChange={(e) => setTopUpUserId(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a user…</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.username} — {u.email}</option>
                ))}
              </select>
              {selectedUser && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                    {selectedUser.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs text-muted-foreground">{selectedUser.username}</span>
                  <Badge variant={selectedUser.is_active ? 'secondary' : 'outline'} className="text-[10px]">
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="500.00"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="pl-7"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={topUpLoading || !topUpUserId || !topUpAmount} className="gap-2">
              {topUpLoading
                ? <><Spinner size="sm" /> Processing…</>
                : <><TrendingUp size={14} /> Top Up {topUpAmount ? `₹${topUpAmount}` : 'Balance'}</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users size={18} /> User Overview</CardTitle>
          <CardDescription>{users.filter(u => !u.is_staff).length} non-superuser accounts in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md border border-border p-3 text-center">
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Users</p>
            </div>
            <div className="rounded-md border border-border p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{users.filter(u => u.is_active).length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Active</p>
            </div>
            <div className="rounded-md border border-border p-3 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{users.filter(u => !u.is_active).length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Inactive</p>
            </div>
            <div className="rounded-md border border-border p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.is_staff).length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Staff</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
