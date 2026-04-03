import { useEffect, useState, useCallback } from 'react'
import { Users, ShieldPlus, ShieldMinus, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Badge } from '@/components/watermelon-ui/badge'
import { Skeleton } from '@/components/watermelon-ui/skeleton'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { assignApi, permissionsApi, type TeamMember, type Permission } from '@/lib/api'
import { Can } from '@/components/Can'

function PermissionSelector({
  available,
  selected,
  onToggle,
}: {
  available: Permission[]
  selected: number[]
  onToggle: (id: number) => void
}) {
  return (
    <div className="max-h-48 overflow-y-auto space-y-0.5 rounded-md border border-border p-2">
      {available.map((p) => {
        const on = selected.includes(p.id)
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onToggle(p.id)}
            className={`w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-left transition-colors ${
              on ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
            }`}
          >
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
              on ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
            }`}>
              {on && <Check size={10} />}
            </span>
            <span className="flex-1 truncate">{p.name}</span>
            <span className="font-mono text-muted-foreground shrink-0">{p.codename}</span>
          </button>
        )
      })}
    </div>
  )
}

function MemberCard({ member, allPermissions }: { member: TeamMember; allPermissions: Permission[] }) {
  const [expanded, setExpanded] = useState(false)
  const [assignSel, setAssignSel] = useState<number[]>([])
  const [revokeSel, setRevokeSel] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [currentPerms, setCurrentPerms] = useState<number[]>(member.assigned_permissions)

  const toggle = (sel: number[], setSel: React.Dispatch<React.SetStateAction<number[]>>, id: number) =>
    setSel((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const doAssign = async () => {
    if (!assignSel.length) return
    setBusy(true); setMsg('')
    try {
      await assignApi.assign(member.id, assignSel)
      setCurrentPerms((p) => [...new Set([...p, ...assignSel])])
      setAssignSel([])
      setMsg('Permissions assigned.')
    } catch { setMsg('Failed to assign.') }
    finally { setBusy(false) }
  }

  const doRevoke = async () => {
    if (!revokeSel.length) return
    setBusy(true); setMsg('')
    try {
      await assignApi.revoke(member.id, revokeSel)
      setCurrentPerms((p) => p.filter((x) => !revokeSel.includes(x)))
      setRevokeSel([])
      setMsg('Permissions revoked.')
    } catch { setMsg('Failed to revoke.') }
    finally { setBusy(false) }
  }

  const assignable = allPermissions.filter((p) => !currentPerms.includes(p.id))
  const revokable = allPermissions.filter((p) => currentPerms.includes(p.id))

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {member.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-sm">{member.username}</p>
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{currentPerms.length} perms</Badge>
            <Button variant="ghost" size="icon-sm" onClick={() => setExpanded((v) => !v)}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          </div>
        </div>
        {currentPerms.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {currentPerms.slice(0, 5).map((id) => (
              <Badge key={id} variant="outline" className="text-[10px] font-mono">#{id}</Badge>
            ))}
            {currentPerms.length > 5 && (
              <Badge variant="outline" className="text-[10px]">+{currentPerms.length - 5} more</Badge>
            )}
          </div>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Assign */}
          <Can codename="add_userpermissionassignment">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assign Permissions</p>
              {assignable.length === 0 ? (
                <p className="text-xs text-muted-foreground">All available permissions already assigned.</p>
              ) : (
                <>
                  <PermissionSelector
                    available={assignable}
                    selected={assignSel}
                    onToggle={(id) => toggle(assignSel, setAssignSel, id)}
                  />
                  <Button size="sm" className="gap-1.5" onClick={doAssign} disabled={busy || !assignSel.length}>
                    {busy ? <Spinner size="sm" /> : <ShieldPlus size={13} />}
                    Assign {assignSel.length > 0 && `(${assignSel.length})`}
                  </Button>
                </>
              )}
            </div>
          </Can>

          {/* Revoke */}
          <Can codename="delete_userpermissionassignment">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Revoke Permissions</p>
              {revokable.length === 0 ? (
                <p className="text-xs text-muted-foreground">No permissions to revoke.</p>
              ) : (
                <>
                  <PermissionSelector
                    available={revokable}
                    selected={revokeSel}
                    onToggle={(id) => toggle(revokeSel, setRevokeSel, id)}
                  />
                  <Button size="sm" variant="destructive" className="gap-1.5" onClick={doRevoke} disabled={busy || !revokeSel.length}>
                    {busy ? <Spinner size="sm" /> : <ShieldMinus size={13} />}
                    Revoke {revokeSel.length > 0 && `(${revokeSel.length})`}
                  </Button>
                </>
              )}
            </div>
          </Can>

          {msg && <p className="text-xs text-green-600">{msg}</p>}
        </CardContent>
      )}
    </Card>
  )
}

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load all permissions in one call
  const loadAllPermissions = useCallback(async () => {
    const { data } = await permissionsApi.list()
    setAllPermissions(data)
  }, [])

  useEffect(() => {
    Promise.all([
      assignApi.myTeam().then(({ data }) => setTeam(Array.isArray(data) ? data : [])),
      loadAllPermissions(),
    ]).catch(() => setError('Failed to load team data.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Team</h1>
        <p className="text-sm text-muted-foreground">
          Manage permissions for users under your account.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : team.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users size={40} className="text-muted-foreground opacity-30 mb-3" />
          <p className="text-sm text-muted-foreground">No team members yet. Create users first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {team.map((m) => (
            <MemberCard key={m.id} member={m} allPermissions={allPermissions} />
          ))}
        </div>
      )}
    </div>
  )
}
