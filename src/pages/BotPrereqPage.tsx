import { useEffect, useState } from 'react'
import { Plus, Settings2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Badge } from '@/components/watermelon-ui/badge'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/watermelon-ui/dialog'
import { DataTable, type Column } from '@/components/DataTable'
import { StatusAlert } from '@/components/ConfirmDialog'
import { prereqApi, botsApi, type BotPrereq, type Bot } from '@/lib/api'

function PrereqFormDialog({ open, onClose, onSuccess, bots }: {
  open: boolean
  onClose: () => void
  onSuccess: (msg: string) => void
  bots: Bot[]
}) {
  const [form, setForm] = useState({ bot: '', name: '', description: '', is_required: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setForm({ bot: '', name: '', description: '', is_required: true })
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await prereqApi.create(form)
      onSuccess(`Prerequisite "${form.name}" created.`)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setError(msg ? JSON.stringify(msg) : 'Failed to create prerequisite.')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Bot Prerequisite</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Bot</Label>
            <select value={form.bot} onChange={(e) => setForm(f => ({ ...f, bot: e.target.value }))} required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">Select bot…</option>
              {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Field Name</Label>
            <Input placeholder="e.g. target_url" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input placeholder="e.g. Full URL of the website to scan" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, is_required: !f.is_required }))}
              className={`flex h-5 w-9 items-center rounded-full transition-colors ${form.is_required ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform mx-0.5 ${form.is_required ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
            <Label>Required field</Label>
          </div>
          {error && <StatusAlert type="error" message={error} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Spinner size="sm" /> Saving…</> : 'Add Prerequisite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function BotPrereqPage() {
  const [prereqs, setPrereqs] = useState<BotPrereq[]>([])
  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pageAlert, setPageAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const fetchPrereqs = () => {
    setLoading(true)
    // fetch prereqs for all bots by fetching each bot's prereqs
    botsApi.list()
      .then(async ({ data }) => {
        const allBots = data.results ?? []
        setBots(allBots)
        const results = await Promise.all(allBots.map(b => prereqApi.listByBot(b.id).then(r => r.data.prerequisites).catch(() => [])))
        setPrereqs(results.flat())
      })
      .catch(() => setPageAlert({ type: 'error', message: 'Failed to load prerequisites.' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPrereqs() }, [])

  const handleDelete = async (p: BotPrereq) => {
    setDeletingId(p.id)
    try {
      await prereqApi.delete(p.id)
      setPrereqs(prev => prev.filter(x => x.id !== p.id))
      setPageAlert({ type: 'success', message: `Prerequisite "${p.name}" deleted.` })
    } catch {
      setPageAlert({ type: 'error', message: `Failed to delete "${p.name}".` })
    } finally { setDeletingId(null) }
  }

  const columns: Column<BotPrereq>[] = [
    {
      key: 'bot_name', label: 'Bot', sortable: true,
      render: (p) => <span className="text-sm font-medium">{p.bot_name}</span>,
    },
    {
      key: 'name', label: 'Field Name', sortable: true,
      render: (p) => <span className="font-mono text-sm">{p.name}</span>,
    },
    {
      key: 'description', label: 'Description',
      render: (p) => <span className="text-xs text-muted-foreground">{p.description || '—'}</span>,
    },
    {
      key: 'is_required', label: 'Required',
      render: (p) => p.is_required
        ? <Badge variant="outline" className="text-xs border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200">Required</Badge>
        : <Badge variant="outline" className="text-xs text-muted-foreground">Optional</Badge>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bot Prerequisites</h1>
          <p className="text-sm text-muted-foreground">Define what fields clients must fill when requesting a bot.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={16} /> Add Prerequisite
        </Button>
      </div>

      {pageAlert && <StatusAlert type={pageAlert.type} message={pageAlert.message} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{prereqs.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Required</p><p className="text-2xl font-bold text-green-600">{prereqs.filter(p => p.is_required).length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Optional</p><p className="text-2xl font-bold text-muted-foreground">{prereqs.filter(p => !p.is_required).length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings2 size={18} /> All Prerequisites</CardTitle>
          <CardDescription>Fields clients must provide when submitting a bot request.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={prereqs}
            loading={loading}
            searchPlaceholder="Search by bot or field name…"
            searchKeys={['bot_name', 'name']}
            onRefresh={fetchPrereqs}
            onDelete={handleDelete}
            deletePermission="delete_customuser"
            deletingId={deletingId}
            deleteConfirmTitle="Delete Prerequisite"
            deleteConfirmDescription={(p) => `Delete field "${p.name}" from ${p.bot_name}?`}
            emptyMessage="No prerequisites yet. Add fields for your bots."
          />
        </CardContent>
      </Card>

      <PrereqFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={(msg) => { fetchPrereqs(); setPageAlert({ type: 'success', message: msg }) }}
        bots={bots}
      />
    </div>
  )
}
