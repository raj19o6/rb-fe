import { useEffect, useState } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Badge } from '@/components/watermelon-ui/badge'
import { DataTable, type Column } from '@/components/DataTable'
import { UserFormDialog } from '@/components/UserFormDialog'
import { Can } from '@/components/Can'
import { StatusAlert } from '@/components/ConfirmDialog'
import { usersApi, rolesApi, type ListUser, type Role } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'

export default function UsersPage() {
  const isSuperuser = useAuthStore((s) => s.user?.user_type === 'superuser')

  const [users, setUsers] = useState<ListUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<ListUser | null>(null)
  const [pageAlert, setPageAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const fetchUsers = () => {
    setLoading(true)
    usersApi.list()
      .then(({ data }) => setUsers(data.results ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
    rolesApi.list().then(({ data }) => setRoles(data.results))
  }, [])

  const handleEdit = (user: ListUser) => {
    setEditUser(user)
    setDialogOpen(true)
  }

  const handleDelete = async (user: ListUser) => {
    setDeletingId(user.id)
    try {
      await usersApi.delete(user.id)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      setPageAlert({ type: 'success', message: `User "${user.username}" deleted successfully.` })
    } catch {
      setPageAlert({ type: 'error', message: `Failed to delete user "${user.username}".` })
    } finally {
      setDeletingId(null)
    }
  }

  const openCreate = () => {
    setEditUser(null)
    setDialogOpen(true)
  }

  const getRoleName = (user: ListUser) =>
    roles.find((r) => user.groups.includes(r.id))?.name ?? (user.is_staff ? 'staff' : '—')

  const columns: Column<ListUser>[] = [
    {
      key: 'username',
      label: 'User',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {u.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm">{u.username}</p>
            <p className="text-[10px] text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (u) => (
        <Badge variant="secondary" className="text-xs capitalize">{getRoleName(u)}</Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (u) => (
        <div className="flex items-center gap-1.5">
          {u.is_active
            ? <Badge variant="secondary" className="text-[10px]">Active</Badge>
            : <Badge variant="outline" className="text-[10px] text-muted-foreground">Inactive</Badge>}
          {u.is_staff && <Badge variant="outline" className="text-[10px]">Staff</Badge>}
        </div>
      ),
    },
    {
      key: 'contact_no',
      label: 'Contact',
      render: (u) => (
        <span className="text-sm text-muted-foreground">{u.contact_no ?? '—'}</span>
      ),
    },
    {
      key: 'id',
      label: 'ID',
      render: (u) => (
        <span className="font-mono text-[10px] text-muted-foreground">{u.id.slice(0, 8)}…</span>
      ),
    },
  ]

  // Stats by role
  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    const r = getRoleName(u)
    acc[r] = (acc[r] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">{users.length} user{users.length !== 1 ? 's' : ''} in the system.</p>
        </div>
        <Can codename="add_customuser">
          <Button onClick={openCreate} className="gap-2">
            <UserPlus size={16} /> New User
          </Button>
        </Can>
      </div>

      {pageAlert && <StatusAlert type={pageAlert.type} message={pageAlert.message} />}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        {Object.entries(roleCounts).map(([role, count]) => (
          <Card key={role}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
              <p className="text-2xl font-bold">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users size={18} /> All Users</CardTitle>
          <CardDescription>
            {isSuperuser ? 'Full CRUD access.' : 'Actions based on your permissions.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            searchPlaceholder="Search username or email…"
            searchKeys={['username', 'email']}
            onRefresh={fetchUsers}
            onEdit={handleEdit}
            onDelete={handleDelete}
            editPermission="change_customuser"
            deletePermission="delete_customuser"
            viewPermission="view_customuser"
            deletingId={deletingId}
            deleteConfirmTitle="Delete User"
            deleteConfirmDescription={(u) => `Are you sure you want to delete "${u.username}"? This cannot be undone.`}
            emptyMessage="No users found."
          />
        </CardContent>
      </Card>

      <UserFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => { fetchUsers(); setPageAlert({ type: 'success', message: 'User saved successfully.' }) }}
        editUser={editUser}
      />
    </div>
  )
}
