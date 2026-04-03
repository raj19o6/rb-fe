import { useEffect, useRef, useState, useCallback } from 'react'
import { KeyRound } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Badge } from '@/components/watermelon-ui/badge'
import { Skeleton } from '@/components/watermelon-ui/skeleton'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Input } from '@/components/watermelon-ui/input'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/watermelon-ui/table'
import { permissionsApi, type Permission } from '@/lib/api'

export default function PermissionsPage() {
  const [items, setItems] = useState<Permission[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const sentinelRef = useRef<HTMLDivElement>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const loadPage = useCallback(async (p: number) => {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const { data } = await permissionsApi.list(p)
      setItems((prev) => p === 1 ? data.results : [...prev, ...data.results])
      setTotal(data.count)
      setHasMore(!!data.next)
    } catch {
      setError('Failed to load permissions.')
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }, [loading])

  // load first page on mount
  useEffect(() => { loadPage(1) }, [])

  // IntersectionObserver on sentinel — fires only when sentinel scrolls into view
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
      { root: tableContainerRef.current, threshold: 0.1 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, page, loadPage])

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
          <p className="text-sm text-muted-foreground">
            {items.length} of {total} permission{total !== 1 ? 's' : ''} loaded.
          </p>
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
              <CardDescription>
                Scroll down to load more. {total} total in the system.
              </CardDescription>
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

          {initialLoad ? (
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
            <div
              ref={tableContainerRef}
              className="max-h-[560px] overflow-y-auto rounded-md border border-border"
            >
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
                        <Badge variant="outline" className="font-mono text-xs">
                          {perm.codename}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          Type {perm.content_type}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* sentinel — triggers next page load when scrolled into view */}
              <div ref={sentinelRef} className="flex items-center justify-center py-4">
                {loading && <Spinner size="sm" />}
                {!hasMore && !loading && (
                  <span className="text-xs text-muted-foreground">
                    All {total} permissions loaded
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
