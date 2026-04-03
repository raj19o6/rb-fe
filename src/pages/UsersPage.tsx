import { useEffect, useState } from 'react'
import { UserPlus, Users, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Badge } from '@/components/watermelon-ui/badge'
import { Skeleton } from '@/components/watermelon-ui/skeleton'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Separator } from '@/components/watermelon-ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/watermelon-ui/table'
import { rolesApi, usersApi, type Role, type AppUser, type ListUser } from '@/lib/api'
import { useAuthStore, useRoleName } from '@/lib/auth'
import { Can } from '@/components/Can'

function getAssignableRoles(allRoles: Role[], roleName: string, userType: string): Role[] {
  if (userType === 'superuser') return allRoles
  return allRoles.filter((r) => r.name.toLowerCase() !== roleName.toLowerCase())
}

const emptyForm = {
  username: '', password: '', email: '',
  first_name: '', last_name: '', contact_no: '',
  groups: [] as number[],
}

export default function UsersPage() {
  const roleName = useRoleName()
  const userType = useAuthStore((s) => s.user?.user_type ?? '')

  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [allUsers, setAllUsers] = useState<ListUser[]>([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')

  const fetchUsers = () => {
    setLoadingUsers(true)
    usersApi.list()
      .then(({ data }) => setAllUsers(data.results ?? []))
      .catch(() => {})
      .finally(() => setLoadingUsers(false))
  }

  useEffect(() => {
    rolesApi.list()
      .then(({ data }) => setAllRoles(data.results))
      .catch(() => setError('Failed to load roles.'))
      .finally(() => setLoadingRoles(false))
    fetchUsers()
  }, [])

  const assignableRoles = getAssignableRoles(allRoles, roleName, userType)

  const field = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const selectGroup = (id: number) =>
    setForm((f) => ({ ...f, groups: f.groups[0] === id ? [] : [id] }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.groups.length) { setError('Select a role for the new user.'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const { data } = await usersApi.create({ ...form, contact_no: Number(form.contact_no) })
      setSuccess(`User "${data.username}" created. ID: ${data.id}`)
      setForm(emptyForm)
      fetchUsers()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setError(msg ? JSON.stringify(msg) : 'Failed to create user.')
    } finally {
      setSaving(false)
    }
  }

  const subtitle = userType === 'superuser'
    ? 'Create any role in the system.'
    : assignableRoles.length > 0
      ? `You can create: ${assignableRoles.map((r) => r.name).join(', ')}.`
      : 'No assignable roles available for your account.'

  const filteredUsers = allUsers.filter((u) =>
    !search.trim() ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {/* Create form + role picker */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus size={18} /> New User</CardTitle>
            <CardDescription>Fill in the details to create a new user.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>First Name</Label>
                  <Input placeholder="First" value={form.first_name} onChange={field('first_name')} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name</Label>
                  <Input placeholder="Last" value={form.last_name} onChange={field('last_name')} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Username</Label>
                <Input placeholder="username" value={form.username} onChange={field('username')} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="user@example.com" value={form.email} onChange={field('email')} required />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" value={form.password} onChange={field('password')} required />
              </div>
              <div className="space-y-1.5">
                <Label>Contact No.</Label>
                <Input type="number" placeholder="9000000001" value={form.contact_no} onChange={field('contact_no')} required />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Assign Role</Label>
                  {form.groups.length > 0 && (
                    <span className="text-xs text-muted-foreground capitalize">
                      {allRoles.find((r) => r.id === form.groups[0])?.name}
                    </span>
                  )}
                </div>
                {loadingRoles ? (
                  <div className="flex gap-2">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-md" />)}
                  </div>
                ) : assignableRoles.length === 0 ? (
                  <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      No assignable roles available{roleName ? ` for ${roleName}` : ''}.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {assignableRoles.map((r) => {
                      const selected = form.groups[0] === r.id
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => selectGroup(r.id)}
                          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors capitalize ${
                            selected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${selected ? 'bg-primary-foreground' : 'bg-muted-foreground'}`} />
                          {r.name}
                          <Badge variant={selected ? 'outline' : 'secondary'} className="text-[10px] px-1 py-0 h-4">
                            {r.permissions.length} perms
                          </Badge>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}
              {success && <p className="text-xs text-green-600">{success}</p>}

              <Can
                codename="add_customuser"
                fallback={
                  <p className="text-xs text-muted-foreground text-center py-2 rounded-md border border-border bg-muted/40">
                    You don't have permission to create users.
                  </p>
                }
              >
                <Button type="submit" className="w-full" disabled={saving || assignableRoles.length === 0}>
                  {saving ? <><Spinner size="sm" /> Creating...</> : 'Create User'}
                </Button>
              </Can>
            </form>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users size={18} /> Overview</CardTitle>
            <CardDescription>Summary of users in the system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingUsers ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">Total Users</span>
                  <span className="text-2xl font-bold">{allUsers.length}</span>
                </div>
                {/* Group by role */}
                {Object.entries(
                  allUsers.reduce<Record<string, number>>((acc, u) => {
                    const role = allRoles.find((r) => u.groups.includes(r.id))?.name ?? (u.is_staff ? 'staff' : 'no role')
                    acc[role] = (acc[role] ?? 0) + 1
                    return acc
                  }, {}),
                ).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                    <Badge variant="secondary" className="capitalize text-xs">{role}</Badge>
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2"><Users size={18} /> All Users</CardTitle>
              <CardDescription>{allUsers.length} user{allUsers.length !== 1 ? 's' : ''} in the system.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search username or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56"
              />
              <Button variant="outline" size="icon" onClick={fetchUsers} disabled={loadingUsers}>
                <RefreshCw size={14} className={loadingUsers ? 'animate-spin' : ''} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users size={36} className="text-muted-foreground opacity-30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? 'No users match your search.' : 'No users found.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {u.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{u.username}</p>
                            <p className="text-[10px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {allRoles.find((r) => u.groups.includes(r.id))?.name ?? (u.is_staff ? 'staff' : '—')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {u.is_active
                            ? <Badge variant="secondary" className="text-[10px]">Active</Badge>
                            : <Badge variant="outline" className="text-[10px] text-muted-foreground">Inactive</Badge>}
                          {u.is_staff && <Badge variant="outline" className="text-[10px]">Staff</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-[10px] text-muted-foreground">{u.id}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
