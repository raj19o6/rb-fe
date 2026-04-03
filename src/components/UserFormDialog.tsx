import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/watermelon-ui/dialog'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Badge } from '@/components/watermelon-ui/badge'
import { Separator } from '@/components/watermelon-ui/separator'
import { Skeleton } from '@/components/watermelon-ui/skeleton'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { usersApi, rolesApi, customRolesApi, type ListUser } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { StatusAlert } from '@/components/ConfirmDialog'

// Unified picker shape
type PickerRole = {
  id: number        // used for groups[] (system roles only)
  uuid: string      // custom role UUID (non-superuser only)
  name: string
  permCount: number
}

type FormState = {
  username: string
  password: string
  email: string
  first_name: string
  last_name: string
  contact_no: string
  groups: number[]
  custom_role: string  // UUID of selected custom role
}

const empty: FormState = {
  username: '', password: '', email: '',
  first_name: '', last_name: '', contact_no: '',
  groups: [], custom_role: '',
}

type Props = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editUser?: ListUser | null
}

export function UserFormDialog({ open, onClose, onSuccess, editUser }: Props) {
  const isSuperuser = useAuthStore((s) => s.user?.user_type === 'superuser')

  const [form, setForm] = useState<FormState>(empty)
  const [roles, setRoles] = useState<PickerRole[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!editUser

  useEffect(() => {
    if (!open) return
    setError('')
    setLoadingRoles(true)

    const fetchRoles = isSuperuser
      ? rolesApi.list().then(({ data }) =>
          data.results.map((r): PickerRole => ({ id: r.id, uuid: '', name: r.name, permCount: r.permissions.length }))
        )
      : customRolesApi.list().then(({ data }) =>
          data.results.map((r): PickerRole => ({ id: 0, uuid: r.id, name: r.name, permCount: r.permissions.length }))
        )

    fetchRoles
      .then(setRoles)
      .catch(() => setError('Failed to load roles.'))
      .finally(() => setLoadingRoles(false))

    setForm(editUser ? {
      username: editUser.username,
      password: '',
      email: editUser.email,
      first_name: editUser.first_name,
      last_name: editUser.last_name,
      contact_no: String(editUser.contact_no ?? ''),
      groups: editUser.groups,
      custom_role: '',
    } : empty)
  }, [open, editUser, isSuperuser])

  const field = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const selectRole = (role: PickerRole) => {
    const alreadySelected = isSuperuser
      ? form.groups[0] === role.id
      : form.custom_role === role.uuid

    if (alreadySelected) {
      setForm((f) => ({ ...f, groups: [], custom_role: '' }))
    } else {
      setForm((f) => ({
        ...f,
        groups: isSuperuser ? [role.id] : [],
        custom_role: isSuperuser ? '' : role.uuid,
      }))
    }
  }

  const isSelected = (role: PickerRole) =>
    isSuperuser ? form.groups[0] === role.id : form.custom_role === role.uuid

  const selectedRoleName = roles.find((r) => isSelected(r))?.name

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEdit && !isSuperuser && !form.custom_role) { setError('Select a custom role.'); return }
    if (!isEdit && isSuperuser && !form.groups.length) { setError('Select a role.'); return }
    setSaving(true); setError('')
    try {
      if (isEdit && editUser) {
        const payload: Partial<FormState> & { contact_no?: number } = {
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          contact_no: form.contact_no ? Number(form.contact_no) : undefined,
          groups: form.groups,
        }
        if (form.password) payload.password = form.password
        await usersApi.update(editUser.id, payload)
      } else {
        const payload = {
          username: form.username,
          password: form.password,
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          contact_no: Number(form.contact_no),
          groups: form.groups,
          ...(isSuperuser ? {} : { custom_role: form.custom_role }),
        }
        await usersApi.create(payload)
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setError(msg ? JSON.stringify(msg) : `Failed to ${isEdit ? 'update' : 'create'} user.`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit — ${editUser?.username}` : 'Create New User'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input placeholder="First" value={form.first_name} onChange={field('first_name')} required={!isEdit} />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input placeholder="Last" value={form.last_name} onChange={field('last_name')} required={!isEdit} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Username</Label>
            <Input placeholder="username" value={form.username} onChange={field('username')} required={!isEdit} disabled={isEdit} />
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" placeholder="user@example.com" value={form.email} onChange={field('email')} required={!isEdit} />
          </div>

          <div className="space-y-1.5">
            <Label>{isEdit ? 'New Password (leave blank to keep)' : 'Password'}</Label>
            <Input type="password" placeholder="••••••••" value={form.password} onChange={field('password')} required={!isEdit} />
          </div>

          <div className="space-y-1.5">
            <Label>Contact No.</Label>
            <Input type="number" placeholder="9000000001" value={form.contact_no} onChange={field('contact_no')} required={!isEdit} />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{isSuperuser ? 'Role' : 'Custom Role'}</Label>
              {selectedRoleName && (
                <span className="text-xs text-muted-foreground capitalize">{selectedRoleName}</span>
              )}
            </div>
            {loadingRoles ? (
              <div className="flex gap-2">{[1, 2].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-md" />)}</div>
            ) : roles.length === 0 ? (
              <p className="text-xs text-muted-foreground rounded-md border border-border bg-muted/40 px-3 py-2">
                {isSuperuser ? 'No roles found.' : 'No custom roles yet. Create one from Custom Roles page first.'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => {
                  const selected = isSelected(r)
                  return (
                    <button
                      key={r.uuid || r.id}
                      type="button"
                      onClick={() => selectRole(r)}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors capitalize ${
                        selected ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${selected ? 'bg-primary-foreground' : 'bg-muted-foreground'}`} />
                      {r.name}
                      <Badge variant={selected ? 'outline' : 'secondary'} className="text-[10px] px-1 py-0 h-4">
                        {r.permCount}p
                      </Badge>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {error && <StatusAlert type="error" message={error} />}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Spinner size="sm" /> Saving…</> : isEdit ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
