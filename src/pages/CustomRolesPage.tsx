import { useEffect, useState, useCallback } from 'react'
import { Plus, Check, X, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Badge } from '@/components/watermelon-ui/badge'
import { Separator } from '@/components/watermelon-ui/separator'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/watermelon-ui/dialog'
import { DataTable, type Column } from '@/components/DataTable'
import { StatusAlert } from '@/components/ConfirmDialog'
import { customRolesApi, assignApi, type CustomRole, type MyPermission } from '@/lib/api'

// ── Permission picker (only from user's own permissions) ─────────
function PermissionPicker({
  available,
  selected,
  onChange,
}: {
  available: MyPermission[]
  selected: number[]
  onChange: (ids: number[]) => void
}) {
  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  const allSelected = available.length > 0 && available.every((p) => selected.includes(p.permission))

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => onChange(allSelected ? [] : available.map((p) => p.permission))}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <span className={`flex h-4 w-4 items-center justify-center rounded border ${
            allSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
          }`}>
            {allSelected && <Check size={10} />}
          </span>
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
        <span className="text-[10px] text-muted-foreground">{selected.length}/{available.length}</span>
      </div>
      <div className="max-h-52 overflow-y-auto space-y-0.5 rounded-md border border-border p-2">
        {available.map((p) => {
          const on = selected.includes(p.permission)
          return (
            <button
              key={p.permission}
              type="button"
              onClick={() => toggle(p.permission)}
              className={`w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-left transition-colors ${
                on ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              }`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                on ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
              }`}>
                {on && <Check size={10} />}
              </span>
              <span className="flex-1 truncate">{p.permission_name}</span>
              <span className="font-mono text-muted-foreground shrink-0 text-[10px]">{p.permission_codename}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Form Dialog ──────────────────────────────────────────────────
function RoleFormDialog({
  open,
  onClose,
  onSuccess,
  editRole,
  myPermissions,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editRole: CustomRole | null
  myPermissions: MyPermission[]
}) {
  const [name, setName] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    if (editRole) {
      setName(editRole.name)
      setSelectedPerms(editRole.permissions)
    } else {
      setName('')
      setSelectedPerms([])
    }
  }, [open, editRole])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Role name is required.'); return }
    if (!selectedPerms.length) { setError('Select at least one permission.'); return }
    setSaving(true); setError('')
    try {
      if (editRole) {
        await customRolesApi.update(editRole.id, { name, permissions: selectedPerms })
      } else {
        await customRolesApi.create({ name, permissions: selectedPerms })
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setError(msg ? JSON.stringify(msg) : 'Failed to save role.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editRole ? `Edit — ${editRole.name}` : 'Create Custom Role'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Role Name</Label>
            <Input
              placeholder="e.g. sales_agent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Permissions <span className="text-muted-foreground text-xs">(from your assigned permissions)</span></Label>
            {myPermissions.length === 0 ? (
              <p className="text-xs text-muted-foreground">You have no permissions to assign.</p>
            ) : (
              <PermissionPicker
                available={myPermissions}
                selected={selectedPerms}
                onChange={setSelectedPerms}
              />
            )}
          </div>
          {error && <StatusAlert type="error" message={error} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Spinner size="sm" /> Saving…</> : editRole ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Page ─────────────────────────────────────────────────────────
export default function CustomRolesPage() {
  const [roles, setRoles] = useState<CustomRole[]>([])
  const [myPermissions, setMyPermissions] = useState<MyPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRole, setEditRole] = useState<CustomRole | null>(null)
  const [pageAlert, setPageAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const fetchRoles = useCallback(() => {
    setLoading(true)
    customRolesApi.list()
      .then(({ data }) => setRoles(data.results ?? []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchRoles()
    assignApi.myPermissions().then(({ data }) => setMyPermissions(Array.isArray(data) ? data : []))
  }, [fetchRoles])

  const handleEdit = (role: CustomRole) => {
    setEditRole(role)
    setDialogOpen(true)
  }

  const handleDelete = async (role: CustomRole) => {
    setDeletingId(role.id)
    try {
      await customRolesApi.delete(role.id)
      setRoles((prev) => prev.filter((r) => r.id !== role.id))
      setPageAlert({ type: 'success', message: `Role "${role.name}" deleted successfully.` })
    } catch {
      setPageAlert({ type: 'error', message: `Failed to delete role "${role.name}".` })
    } finally {
      setDeletingId(null)
    }
  }

  const openCreate = () => {
    setEditRole(null)
    setDialogOpen(true)
  }

  const columns: Column<CustomRole>[] = [
    {
      key: 'name',
      label: 'Role Name',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <ShieldCheck size={13} className="text-primary" />
          </div>
          <div>
            <p className="font-medium capitalize">{r.name}</p>
            <p className="text-[10px] text-muted-foreground">by {r.created_by_username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (r) =>
        r.permission_details.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">None</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {r.permission_details.slice(0, 4).map((p) => (
              <Badge key={p.id} variant="secondary" className="text-[10px] font-mono">{p.codename}</Badge>
            ))}
            {r.permission_details.length > 4 && (
              <Badge variant="outline" className="text-[10px]">+{r.permission_details.length - 4}</Badge>
            )}
          </div>
        ),
    },
    {
      key: 'count',
      label: 'Count',
      render: (r) => (
        <Badge variant="outline" className="text-xs">{r.permissions.length}p</Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Custom Roles</h1>
          <p className="text-sm text-muted-foreground">
            Create roles using only your assigned permissions.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> New Role
        </Button>
      </div>

      {pageAlert && <StatusAlert type={pageAlert.type} message={pageAlert.message} />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck size={18} /> My Custom Roles</CardTitle>
          <CardDescription>{roles.length} role{roles.length !== 1 ? 's' : ''} created.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={roles}
            loading={loading}
            searchPlaceholder="Search roles…"
            searchKeys={['name']}
            onRefresh={fetchRoles}
            onEdit={handleEdit}
            onDelete={handleDelete}
            editPermission="change_customuser"
            deletePermission="delete_customuser"
            deletingId={deletingId}
            deleteConfirmTitle="Delete Custom Role"
            deleteConfirmDescription={(r) => `Delete role "${r.name}"? Users assigned this role will lose it.`}
            emptyMessage="No custom roles yet. Create your first one."
          />
        </CardContent>
      </Card>

      <RoleFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => { fetchRoles(); setPageAlert({ type: 'success', message: 'Role saved successfully.' }) }}
        editRole={editRole}
        myPermissions={myPermissions}
      />
    </div>
  )
}
