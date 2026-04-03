import { useEffect, useRef, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, ShieldCheck, X, Check, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Badge } from '@/components/watermelon-ui/badge'
import { Separator } from '@/components/watermelon-ui/separator'
import { Skeleton } from '@/components/watermelon-ui/skeleton'
import { Spinner } from '@/components/watermelon-ui/spinner'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/watermelon-ui/table'
import { rolesApi, permissionsApi, type Role, type Permission } from '@/lib/api'

const emptyForm = { name: '', permissions: [] as number[] }

// ── Infinite-scroll permissions list inside the form ─────────────
function PermissionPicker({
  selected,
  onToggle,
}: {
  selected: number[]
  onToggle: (id: number) => void
}) {
  const [items, setItems] = useState<Permission[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const loadPage = useCallback(async (p: number) => {
    if (loading) return
    setLoading(true)
    try {
      const { data } = await permissionsApi.list(p)
      setItems((prev) => p === 1 ? data.results : [...prev, ...data.results])
      setHasMore(!!data.next)
    } finally {
      setLoading(false)
    }
  }, [loading])

  // initial load
  useEffect(() => { loadPage(1) }, [])

  // observe sentinel — only fetch next page when sentinel is visible
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const next = page + 1
          setPage(next)
          loadPage(next)
        }
      },
      { root: containerRef.current, threshold: 0.1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, page, loadPage])

  return (
    <div
      ref={containerRef}
      className="max-h-60 overflow-y-auto space-y-0.5 rounded-md border border-border p-2"
    >
      {items.map((perm) => {
        const isSelected = selected.includes(perm.id)
        return (
          <button
            key={perm.id}
            type="button"
            onClick={() => onToggle(perm.id)}
            className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
              isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
            }`}
          >
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
              isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
            }`}>
              {isSelected && <Check size={10} />}
            </span>
            <span className="truncate flex-1">{perm.name}</span>
            <span className="text-muted-foreground font-mono shrink-0">{perm.codename}</span>
          </button>
        )
      })}

      {/* sentinel div — triggers next page load when scrolled into view */}
      <div ref={sentinelRef} className="py-1 flex justify-center">
        {loading && <Spinner size="sm" />}
        {!hasMore && items.length > 0 && (
          <span className="text-[10px] text-muted-foreground">All permissions loaded</span>
        )}
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────
export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [form, setForm] = useState(emptyForm)

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const { data } = await rolesApi.list()
      setRoles(data.results)
      setTotal(data.count)
    } catch {
      setError('Failed to load roles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRoles() }, [])

  const openCreate = () => {
    setEditingRole(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  const openEdit = (role: Role) => {
    setEditingRole(role)
    setForm({ name: role.name, permissions: role.permissions })
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingRole(null)
    setForm(emptyForm)
    setError('')
  }

  const togglePermission = (id: number) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(id)
        ? f.permissions.filter((p) => p !== id)
        : [...f.permissions, id],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Role name is required.'); return }
    setSaving(true)
    setError('')
    try {
      if (editingRole) {
        await rolesApi.update(editingRole.id, form)
      } else {
        await rolesApi.create(form)
      }
      await fetchRoles()
      closeForm()
    } catch {
      setError('Failed to save role. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await rolesApi.delete(id)
      setRoles((prev) => prev.filter((r) => r.id !== id))
      setTotal((t) => t - 1)
    } catch {
      setError('Failed to delete role.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Roles</h1>
          <p className="text-sm text-muted-foreground">
            {total} role{total !== 1 ? 's' : ''} configured in the system.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> New Role
        </Button>
      </div>

      {error && !showForm && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Table */}
        <div className={showForm ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck size={18} /> All Roles
              </CardTitle>
              <CardDescription>{total} role{total !== 1 ? 's' : ''} total</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : roles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShieldCheck size={40} className="text-muted-foreground mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">No roles yet. Create your first role.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead className="text-right w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                              <ShieldCheck size={13} className="text-primary" />
                            </div>
                            <span className="font-medium capitalize">{role.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {role.permissions.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">No permissions</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {role.permissions.slice(0, 3).map((pid) => (
                                <Badge key={pid} variant="secondary" className="text-xs">
                                  #{pid}
                                </Badge>
                              ))}
                              {role.permissions.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{role.permissions.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(role)}>
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(role.id)}
                              disabled={deletingId === role.id}
                            >
                              {deletingId === role.id
                                ? <Loader2 size={14} className="animate-spin" />
                                : <Trash2 size={14} />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Form Panel */}
        {showForm && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {editingRole ? 'Edit Role' : 'Create Role'}
                  </CardTitle>
                  <Button variant="ghost" size="icon-sm" onClick={closeForm}>
                    <X size={14} />
                  </Button>
                </div>
                <CardDescription>
                  {editingRole ? `Editing "${editingRole.name}"` : 'Fill in the details below'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="role-name">Role Name</Label>
                    <Input
                      id="role-name"
                      placeholder="e.g. agent, manager"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Permissions</Label>
                      <span className="text-xs text-muted-foreground">
                        {form.permissions.length} selected
                      </span>
                    </div>
                    <PermissionPicker
                      selected={form.permissions}
                      onToggle={togglePermission}
                    />
                  </div>

                  {error && <p className="text-xs text-destructive">{error}</p>}

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={saving}>
                      {saving
                        ? <><Spinner size="sm" /> Saving...</>
                        : editingRole ? 'Update Role' : 'Create Role'}
                    </Button>
                    <Button type="button" variant="outline" onClick={closeForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
