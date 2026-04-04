import { useEffect, useState } from 'react'
import { User, Save, Phone, Mail, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Badge } from '@/components/watermelon-ui/badge'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Skeleton } from '@/components/watermelon-ui/skeleton'
import { StatusAlert } from '@/components/ConfirmDialog'
import { profileApi, type UserProfile } from '@/lib/api'

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', contact_no: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    profileApi.get()
      .then(({ data }) => {
        const p = data.results?.[0] ?? null
        setProfile(p)
        if (p) {
          setForm({
            first_name: p.user.first_name,
            last_name: p.user.last_name,
            contact_no: p.contact_no != null ? String(p.contact_no) : '',
          })
        }
      })
      .catch(() => setAlert({ type: 'error', message: 'Failed to load profile.' }))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setAlert(null)
    try {
      const { data } = await profileApi.update(profile.id, {
        first_name: form.first_name,
        last_name: form.last_name,
        contact_no: form.contact_no ? Number(form.contact_no) : null,
      })
      setProfile(data)
      setAlert({ type: 'success', message: 'Profile updated successfully.' })
    } catch {
      setAlert({ type: 'error', message: 'Failed to update profile.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="space-y-4 max-w-xl">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )

  const u = profile?.user

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground">View and update your account details.</p>
      </div>

      {alert && <StatusAlert type={alert.type} message={alert.message} />}

      {/* Avatar + identity */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
              {u?.first_name?.[0]?.toUpperCase() ?? u?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold">
                {u?.first_name || u?.last_name ? `${u.first_name} ${u.last_name}`.trim() : u?.username}
              </p>
              <p className="text-sm text-muted-foreground">@{u?.username}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {u?.groups.map(g => (
                  <Badge key={g.id} variant="secondary" className="text-xs capitalize gap-1">
                    <ShieldCheck size={10} /> {g.name}
                  </Badge>
                ))}
                {u?.is_staff && <Badge variant="outline" className="text-xs">Staff</Badge>}
                {u?.is_active
                  ? <Badge variant="outline" className="text-xs border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200">Active</Badge>
                  : <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Read-only info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User size={18} /> Account Info</CardTitle>
          <CardDescription>Managed by your administrator.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">Email</p>
              <p className="text-sm font-medium truncate">{u?.email ?? '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">Contact</p>
              <p className="text-sm font-medium">{profile?.contact_no ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input value={form.first_name} onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name" />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input value={form.last_name} onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Contact No.</Label>
              <Input type="number" value={form.contact_no} onChange={(e) => setForm(f => ({ ...f, contact_no: e.target.value }))} placeholder="9000000001" />
            </div>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <><Spinner size="sm" /> Saving…</> : <><Save size={14} /> Save Changes</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
