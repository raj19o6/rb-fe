import { useState } from 'react'
import { Pencil, Trash2, Loader2, Search, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/watermelon-ui/table'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Skeleton } from '@/components/watermelon-ui/skeleton'
import { Badge } from '@/components/watermelon-ui/badge'
import { Can } from '@/components/Can'

export type Column<T> = {
  key: string
  label: string
  render: (row: T) => React.ReactNode
  sortable?: boolean
}

type Props<T extends { id: string | number }> = {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  searchPlaceholder?: string
  searchKeys?: (keyof T)[]
  onRefresh?: () => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  editPermission?: string
  deletePermission?: string
  viewPermission?: string
  deletingId?: string | number | null
  emptyMessage?: string
  headerExtra?: React.ReactNode
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading,
  searchPlaceholder = 'Search…',
  searchKeys = [],
  onRefresh,
  onEdit,
  onDelete,
  editPermission,
  deletePermission,
  viewPermission,
  deletingId,
  emptyMessage = 'No records found.',
  headerExtra,
}: Props<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filtered = data.filter((row) => {
    if (!search.trim()) return true
    return searchKeys.some((k) =>
      String(row[k] ?? '').toLowerCase().includes(search.toLowerCase()),
    )
  })

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = String((a as Record<string, unknown>)[sortKey] ?? '')
        const bv = String((b as Record<string, unknown>)[sortKey] ?? '')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      })
    : filtered

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const hasActions = onEdit || onDelete

  const tableContent = (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={col.key}
              onClick={col.sortable ? () => toggleSort(col.key) : undefined}
              className={col.sortable ? 'cursor-pointer select-none' : ''}
            >
              <span className="flex items-center gap-1">
                {col.label}
                {col.sortable && sortKey === col.key && (
                  sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                )}
              </span>
            </TableHead>
          ))}
          {hasActions && <TableHead className="w-24 text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.id}>
            {columns.map((col) => (
              <TableCell key={col.key}>{col.render(row)}</TableCell>
            ))}
            {hasActions && (
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {onEdit && editPermission && (
                    <Can codename={editPermission}>
                      <Button variant="ghost" size="icon-sm" onClick={() => onEdit(row)}>
                        <Pencil size={14} />
                      </Button>
                    </Can>
                  )}
                  {onDelete && deletePermission && (
                    <Can codename={deletePermission}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(row)}
                        disabled={deletingId === row.id}
                      >
                        {deletingId === row.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                      </Button>
                    </Can>
                  )}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          {search && (
            <Badge variant="secondary" className="text-xs">
              {sorted.length} result{sorted.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {headerExtra}
          {onRefresh && (
            <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-md border border-border">
          <p className="text-sm text-muted-foreground">{search ? 'No results match your search.' : emptyMessage}</p>
        </div>
      ) : (
        viewPermission ? (
          <Can codename={viewPermission} fallback={
            <div className="flex items-center justify-center py-16 rounded-md border border-border">
              <p className="text-sm text-muted-foreground">You don't have permission to view this data.</p>
            </div>
          }>
            <div className="rounded-md border border-border overflow-hidden">{tableContent}</div>
          </Can>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">{tableContent}</div>
        )
      )}
    </div>
  )
}
