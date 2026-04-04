import { useEffect, useState, useCallback } from 'react'
import { Users, ShieldPlus, ShieldMinus, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Badge } from '@/components/watermelon-ui/badge'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/watermelon-ui/dialog'
import { Separator } from '@/components/watermelon-ui/separator'
import { DataTable, type Column } from '@/components/DataTable'
import { StatusAlert } from '@/components/ConfirmDialog'
import { Can } from '@/components/Can'
import { assignApi, permissionsApi, type TeamMember, type Permission, type TeamPermission } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'

// ── Permission Selector ──────────────────────────────────────────
function PermissionSelector({
  available,
  selected,
  onToggle,
}: {
  available: Permission[]
  selected: number[]
  onToggle: (id: number) => void
}) {
  const allSelected = available.length > 0 && available.every((p) => selected.includes(p.id))

  return (
    <div className="space-y-1.5">
      {available.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => available.forEach((p) => { if (allSelected !== selected.includes(p.id)) onToggle(p.id) })}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <span className={`flex h-4 w-4 items-center justify-center rounded border ${allSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
              {allSelected && <Check size={10} />}
            </span>
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-[10px] text-muted-foreground">{selected.length}/{available.length}</span>
        </div>
      )}
      <div className="max-h-52 overflow-y-auto space-y-0.5 rounded-md border border-border p-2">
        {available.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 py-3 text-center">None available.</p>
        ) : available.map((p) => {
          const on = selected.includes(p.id)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggle(p.id)}
              className={`w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-left transition-colors ${on ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                {on && <Check size={10} />}
              </span>
              <span className="flex-1 truncate">{p.name}</span>
              <span className="font-mono text-muted-foreground shrink-0 text-[10px]">{p.codename}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Manage Permissions Dialog ────────────────────────────────────
function ManagePermissionsDialog({
  open,
  onClose,
  member,
  allPermissions,
  onUpdated,
}: {
  open: boolean
  onClose: () => void
  member: TeamMember | null
  allPermissions: Permission[]
  onUpdated: (memberId: string, perms: TeamPermission[]) => void
}) {
  const [assignSel, setAssignSel] = useState<number[]>([])
  const [revokeSel, setRevokeSel] = useState<number[]>([])
  const [currentPerms, setCurrentPerms] = useState<TeamPermission[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!open || !member) return
    setAssignSel([])
    setRevokeSel([])
    setError('')
    setSuccessMsg('')
    setCurrentPerms(member.permissions_assigned)
  }, [open, member])

  const currentIds = currentPerms.map((p) => p.permission__id)
  const assignable = allPermissions.filter((p) => !currentIds.includes(p.id))
  const revokable = allPermissions.filter((p) => currentIds.includes(p.id))

  const toggleAssign = (id: number) =>
    setAssignSel((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const toggleRevoke = (id: number) =>
    setRevokeSel((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const doAssign = async () => {
    if (!member || !assignSel.length) return
    setBusy(true); setError(''); setSuccessMsg('')
    try {
      await assignApi.assign(member.id, assignSel)
      const added = allPermissions
        .filter((p) => assignSel.includes(p.id))
        .map((p): TeamPermission => ({ permission__id: p.id, permission__codename: p.codename, permission__name: p.name }))
      const updated = [...currentPerms, ...added.filter((a) => !currentPerms.find((x) => x.permission__id === a.permission__id))]
      setCurrentPerms(updated)
      onUpdated(member.id, updated)
      setAssignSel([])
      setSuccessMsg('Permissions assigned successfully.')
    } catch {
      setError('Failed to assign permissions.')
    } finally { setBusy(false) }
  }

  const doRevoke = async () => {
    if (!member || !revokeSel.length) return
    setBusy(true); setError(''); setSuccessMsg('')
    try {
      await assignApi.revoke(member.id, revokeSel)
      const updated = currentPerms.filter((x) => !revokeSel.includes(x.permission__id))
      setCurrentPerms(updated)
      onUpdated(member.id, updated)
      setRevokeSel([])
      setSuccessMsg('Permissions revoked successfully.')
    } catch {
      setError('Failed to revoke permissions.')
    } finally { setBusy(false) }
  }

  if (!member) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {member.username.slice(0, 2).toUpperCase()}
            </div>
            {member.username}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && <StatusAlert type="error" message={error} />}
          {successMsg && <StatusAlert type="success" message={successMsg} />}

          <Can codename="add_userpermissionassignment">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assign Permissions</p>
              <PermissionSelector available={assignable} selected={assignSel} onToggle={toggleAssign} />
              <Button size="sm" className="gap-1.5" onClick={doAssign} disabled={busy || !assignSel.length}>
                {busy ? <Spinner size="sm" /> : <ShieldPlus size={13} />}
                Assign {assignSel.length > 0 && `(${assignSel.length})`}
              </Button>
            </div>
          </Can>

          <Separator />

          <Can codename="delete_userpermissionassignment">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revoke Permissions</p>
              <PermissionSelector available={revokable} selected={revokeSel} onToggle={toggleRevoke} />
              <Button size="sm" variant="destructive" className="gap-1.5" onClick={doRevoke} disabled={busy || !revokeSel.length}>
                {busy ? <Spinner size="sm" /> : <ShieldMinus size={13} />}
                Revoke {revokeSel.length > 0 && `(${revokeSel.length})`}
              </Button>
            </div>
          </Can>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Page ─────────────────────────────────────────────────────────
export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [pageAlert, setPageAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)

  const isSuperuser = useAuthStore((s) => s.user?.user_type === 'superuser')

  const fetchTeam = useCallback(() => {
    setLoading(true)
    assignApi.myTeam()
      .then(({ data }) => setTeam(Array.isArray(data) ? data : []))
      .catch(() => setPageAlert({ type: 'error', message: 'Failed to load team.' }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const loadPerms = isSuperuser
      ? permissionsApi.list().then(({ data }) => setAllPermissions(data))
      : assignApi.myPermissions().then(({ data }) => setAllPermissions(
          data.map((p) => ({ id: p.permission, name: p.permission_name, codename: p.permission_codename, content_type: 0 }))
        ))

    Promise.all([fetchTeam(), loadPerms])
      .catch(() => setPageAlert({ type: 'error', message: 'Failed to load team data.' }))
  }, [fetchTeam, isSuperuser])

  const handleManage = (member: TeamMember) => {
    setSelectedMember(member)
    setDialogOpen(true)
  }

  const handleUpdated = (memberId: string, perms: TeamPermission[]) => {
    setTeam((prev) => prev.map((m) => m.id === memberId ? { ...m, permissions_assigned: perms } : m))
  }

  const columns: Column<TeamMember>[] = [
    {
      key: 'username',
      label: 'Member',
      sortable: true,
      render: (m) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {m.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm">{m.username}</p>
            <p className="text-[10px] text-muted-foreground">{m.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (m) => (
        <Badge variant="secondary" className="text-xs capitalize">{m.role || '—'}</Badge>
      ),
    },
    {
      key: 'permissions_assigned',
      label: 'Permissions',
      render: (m) => (
        m.permissions_assigned.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">None assigned</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {m.permissions_assigned.slice(0, 3).map((p) => (
              <Badge key={p.permission__id} variant="outline" className="text-[10px] font-mono">
                {p.permission__codename}
              </Badge>
            ))}
            {m.permissions_assigned.length > 3 && (
              <Badge variant="outline" className="text-[10px]">
                +{m.permissions_assigned.length - 3} more
              </Badge>
            )}
          </div>
        )
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (m) => (
        <Can codename="add_userpermissionassignment">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleManage(m)}>
            <ShieldPlus size={12} /> Manage
          </Button>
        </Can>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Team</h1>
          <p className="text-sm text-muted-foreground">
            {team.length} member{team.length !== 1 ? 's' : ''} under your account.
          </p>
        </div>
      </div>

      {pageAlert && <StatusAlert type={pageAlert.type} message={pageAlert.message} />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users size={18} /> Team Members</CardTitle>
          <CardDescription>Assign or revoke permissions for each member.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={team}
            loading={loading}
            searchPlaceholder="Search by username or email…"
            searchKeys={['username', 'email']}
            onRefresh={fetchTeam}
            emptyMessage="No team members yet. Create users first."
          />
        </CardContent>
      </Card>

      <ManagePermissionsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        member={selectedMember}
        allPermissions={allPermissions}
        onUpdated={handleUpdated}
      />
    </div>
  )
}
