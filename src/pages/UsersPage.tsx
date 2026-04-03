import { useEffect, useState } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Badge } from '@/components/watermelon-ui/badge'
import { Skeleton } from '@/components/watermelon-ui/skeleton'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Separator } from '@/components/watermelon-ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/watermelon-ui/table'
import { rolesApi, usersApi, type Role, type AppUser } from '@/lib/api'
import { useAuthStore, useRoleName } from '@/lib/auth'
import { Can } from '@/components/Can'

// A user cannot create someone with the same or higher role.
// Exclude the current user's own role name from the assignable list.
function getAssignableRoles(allRoles: Role[], roleName: string, userType: string): Role[] {
  // superuser can assign any role
  if (userType === 'superuser') return allRoles
  // everyone else: exclude their own role
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
  const [created, setCreated] = useState<AppUser[]>([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch all roles from the paginated API
  useEffect(() => {
    setLoadingRoles(true)
    rolesApi.list()
      .then(({ data }) => setAllRoles(data.results))
      .catch(() => setError('Failed to load roles.'))
      .finally(() => setLoadingRoles(false))
  }, [])

  // Filter: exclude the user's own role (can't create peers), superuser sees all
  const assignableRoles = getAssignableRoles(allRoles, roleName, userType)

  const field = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  // Single-select: only one group at a time
  const selectGroup = (id: number) =>
    setForm((f) => ({ ...f, groups: f.groups[0] === id ? [] : [id] }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.groups.length) { setError('Select a role for the new user.'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const { data } = await usersApi.create({
        ...form,
        contact_no: Number(form.contact_no),
      })
      setCreated((prev) => [data, ...prev])
      setSuccess(`User "${data.username}" created. ID: ${data.id}`)
      setForm(emptyForm)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create User</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
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

              {/* Role selector */}
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
                      No assignable roles available for your account type
                      {roleName ? ` (${roleName})` : ''}.
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
                          <Badge
                            variant={selected ? 'outline' : 'secondary'}
                            className="text-[10px] px-1 py-0 h-4"
                          >
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

        {/* Created this session */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users size={18} /> Created This Session</CardTitle>
            <CardDescription>Users created during this session.</CardDescription>
          </CardHeader>
          <CardContent>
            {created.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users size={36} className="text-muted-foreground opacity-30 mb-3" />
                <p className="text-sm text-muted-foreground">No users created yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {created.map((u) => {
                    const roleBadge = allRoles.find((r) => u.groups.includes(r.id))?.name
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                              {u.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{u.username}</p>
                              <p className="text-[10px] text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {roleBadge && (
                            <Badge variant="secondary" className="text-xs capitalize">{roleBadge}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {String(u.id).slice(0, 8)}…
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
