import { useEffect, useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Badge } from '@/components/watermelon-ui/badge'
import { Skeleton } from '@/components/watermelon-ui/skeleton'
import { Input } from '@/components/watermelon-ui/input'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/watermelon-ui/table'
import { permissionsApi, type Permission } from '@/lib/api'

export default function PermissionsPage() {
  const [items, setItems] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    permissionsApi.list()
      .then(({ data }) => setItems(data))
      .catch(() => setError('Failed to load permissions.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search.trim()
    ? items.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.codename.toLowerCase().includes(search.toLowerCase()),
      )
    : items

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Permissions</h1>
          <p className="text-sm text-muted-foreground">{items.length} permissions in the system.</p>
        </div>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
          <KeyRound size={14} /> Read Only
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <KeyRound size={18} /> System Permissions
              </CardTitle>
              <CardDescription>{items.length} total permissions.</CardDescription>
            </div>
            <Input
              placeholder="Search by name or codename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <KeyRound size={40} className="text-muted-foreground mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">
                {search ? 'No permissions match your search.' : 'No permissions found.'}
              </p>
            </div>
          ) : (
            <div className="max-h-[560px] overflow-y-auto rounded-md border border-border">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead>Permission Name</TableHead>
                    <TableHead>Codename</TableHead>
                    <TableHead className="w-32">Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((perm) => (
                    <TableRow key={perm.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                            <KeyRound size={12} className="text-muted-foreground" />
                          </div>
                          <span className="font-medium">{perm.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">{perm.codename}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">Type {perm.content_type}</Badge>
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
