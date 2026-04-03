import { useEffect, useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Badge } from '@/components/watermelon-ui/badge'
import { Skeleton } from '@/components/watermelon-ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/watermelon-ui/table'
import { assignApi, type MyPermission } from '@/lib/api'

export default function MyPermissionsPage() {
  const [permissions, setPermissions] = useState<MyPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    assignApi.myPermissions()
      .then(({ data }) => {
        setPermissions(Array.isArray(data) ? data : [])
      })
      .catch(() => setError('Failed to load permissions.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Permissions</h1>
          <p className="text-sm text-muted-foreground">Permissions assigned to you by your manager.</p>
        </div>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
          <KeyRound size={14} /> {permissions.length} assigned
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound size={18} /> Assigned Permissions</CardTitle>
          <CardDescription>These are the permissions you have received.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : permissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <KeyRound size={40} className="text-muted-foreground opacity-30 mb-3" />
              <p className="text-sm text-muted-foreground">No permissions assigned to you yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permission Name</TableHead>
                  <TableHead>Codename</TableHead>
                  <TableHead className="w-32">Assigned By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <KeyRound size={12} className="text-primary" />
                        </div>
                        <span className="font-medium">{p.permission_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{p.permission_codename}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{p.assigned_by_username}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
