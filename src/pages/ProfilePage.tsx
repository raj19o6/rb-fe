import { useEffect, useState } from 'react'
import { User, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Skeleton } from '@/components/watermelon-ui/skeleton'
import { StatusAlert } from '@/components/ConfirmDialog'
import { profileApi, type UserProfile } from '@/lib/api'

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', contact_no: '', bio: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    profileApi.get()
      .then(({ data }) => {
        setProfile(data)
        setForm({ first_name: data.first_name, last_name: data.last_name, contact_no: data.contact_no ?? '', bio: data.bio ?? '' })
      })
      .catch(() => setAlert({ type: 'error', message: 'Failed to load profile.' }))
      .finally(() => setLoading(false))
  }, [])

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true); setAlert(null)
    try {
      const { data } = await profileApi.update(profile.id, form)
      setProfile(data)
      setAlert({ type: 'success', message: 'Profile updated successfully.' })
    } catch {
      setAlert({ type: 'error', message: 'Failed to update profile.' })
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="space-y-4 max-w-xl">
      <Skeleton className="h-8 w-40" />
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
  )

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground">View and update your account details.</p>
      </div>

      {alert && <StatusAlert type={alert.type} message={alert.message} />}

      {/* Read-only info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User size={18} /> Account Info</CardTitle>
          <CardDescription>These fields are managed by your administrator.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Username</p>
            <p className="text-sm font-medium">{profile?.username ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{profile?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Member Since</p>
            <p className="text-sm font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</p>
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
                <Input value={form.first_name} onChange={f('first_name')} placeholder="First name" />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input value={form.last_name} onChange={f('last_name')} placeholder="Last name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Contact No.</Label>
              <Input value={form.contact_no} onChange={f('contact_no')} placeholder="+1 234 567 8900" />
            </div>
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <textarea
                value={form.bio}
                onChange={f('bio')}
                placeholder="Tell us a little about yourself…"
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
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
