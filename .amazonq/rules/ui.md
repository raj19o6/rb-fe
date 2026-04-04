# UI Component Rules

## Component Library — Always use `@/components/watermelon-ui/*`

NEVER import from `@/components/ui/*`. All UI primitives come exclusively from the watermelon-ui layer.

```ts
// ✅ correct
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/watermelon-ui/dialog'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Badge } from '@/components/watermelon-ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Separator } from '@/components/watermelon-ui/separator'
import { Skeleton } from '@/components/watermelon-ui/skeleton'
import { Spinner } from '@/components/watermelon-ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/watermelon-ui/table'

// ❌ never
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
```

## Modals / Dialogs

- All create/edit forms MUST live inside `<Dialog>` from `@/components/watermelon-ui/dialog`
- All destructive confirmations MUST use `<ConfirmDialog>` from `@/components/ConfirmDialog` — never build a custom confirm inline
- `AlertDialog` from `@/components/watermelon-ui/alert-dialog` is only for `ConfirmDialog` internally — do not use it directly in pages
- Dialog structure must always follow this exact shape:

```tsx
<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>...</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* fields */}
      {error && <StatusAlert type="error" message={error} />}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? <><Spinner size="sm" /> Saving…</> : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

## Reusable Shared Components — Always use, never duplicate

| Component | Import path | When to use |
|---|---|---|
| `DataTable` | `@/components/DataTable` | Every list/table view with search, sort, edit, delete |
| `ConfirmDialog` | `@/components/ConfirmDialog` | Every destructive delete confirmation |
| `StatusAlert` | `@/components/ConfirmDialog` | Every inline error/success/warning/info message |
| `Can` | `@/components/Can` | Every permission-gated UI element |
| `UserFormDialog` | `@/components/UserFormDialog` | Create/edit users — never rebuild this |

## DataTable Usage

Always pass these props when the table supports CRUD:

```tsx
<DataTable
  columns={columns}
  data={data}
  loading={loading}
  searchPlaceholder="Search…"
  searchKeys={['field1', 'field2']}
  onRefresh={fetchData}
  onEdit={handleEdit}           // omit if read-only
  onDelete={handleDelete}       // omit if read-only
  editPermission="change_model"
  deletePermission="delete_model"
  viewPermission="view_model"   // omit if no view gate needed
  deletingId={deletingId}
  deleteConfirmTitle="Delete X"
  deleteConfirmDescription={(row) => `Delete "${row.name}"? This cannot be undone.`}
  emptyMessage="No records found."
/>
```

- `deletingId` must always be tracked in state so the row shows a spinner while deleting
- `deleteConfirmDescription` must always be a function `(row) => string`, never a static string
- Never add a custom delete button outside of DataTable — always use `onDelete` prop

## Permission Gating — Always use `<Can>`

```tsx
// ✅ correct
<Can codename="add_customuser">
  <Button onClick={openCreate}>New User</Button>
</Can>

<Can codename="delete_customuser" fallback={<span>No access</span>}>
  <Button variant="destructive">Delete</Button>
</Can>

// ❌ never gate with raw boolean checks in JSX
{isSuperuser && <Button>Delete</Button>}
```

## Page Layout Structure

Every page must follow this exact structure:

```tsx
<div className="space-y-6">
  {/* 1. Header row */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold">Page Title</h1>
      <p className="text-sm text-muted-foreground">Subtitle / count</p>
    </div>
    <Can codename="add_model">
      <Button onClick={openCreate} className="gap-2">
        <Plus size={16} /> New Item
      </Button>
    </Can>
  </div>

  {/* 2. Page-level alert (errors/success from CRUD ops) */}
  {pageAlert && <StatusAlert type={pageAlert.type} message={pageAlert.message} />}

  {/* 3. Stats row (optional) */}
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <Card><CardContent className="pt-4 pb-4">...</CardContent></Card>
  </div>

  {/* 4. Main content card */}
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Icon size={18} /> Title</CardTitle>
      <CardDescription>...</CardDescription>
    </CardHeader>
    <CardContent>
      <DataTable ... />
    </CardContent>
  </Card>

  {/* 5. Dialog (always at bottom) */}
  <XFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} ... />
</div>
```

## Form Dialogs — Placement and Structure

- Form dialogs for a page MUST be defined in the same file as the page, above the page component
- Name pattern: `[Entity]FormDialog` — e.g. `BotFormDialog`, `BudgetFormDialog`
- Props must always include: `open`, `onClose`, `onSuccess`, `edit[Entity]` (nullable)
- Reset form state inside `useEffect` watching `[open, edit[Entity]]`
- `onSuccess` receives a success message string when the entity name is known, otherwise no args

```tsx
function EntityFormDialog({ open, onClose, onSuccess, editEntity }: {
  open: boolean
  onClose: () => void
  onSuccess: (msg?: string) => void
  editEntity: Entity | null
}) {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setForm(editEntity ? { ...editEntity } : empty)
  }, [open, editEntity])
  // ...
}
```

## Styling Rules

- Use `text-destructive` for error states, never hardcode `text-red-500`
- Use `text-muted-foreground` for secondary/helper text
- Use `bg-primary/10 text-primary` for icon containers
- Avatar initials: `h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold`
- Status badges must use `Badge` with `variant="outline"` + semantic color classes, never raw colored divs
- Never use inline `style={{}}` — always use Tailwind classes
- Never hardcode colors like `text-red-500` — use semantic tokens (`text-destructive`, `text-green-600`)

## No Dead Components

- Never create a component that is not imported and used somewhere
- Never leave commented-out JSX blocks in files
- If a component is only used in one place, define it in the same file (above the page), not as a separate file
- Separate files in `src/components/` are only for components used in 2+ pages: `DataTable`, `Can`, `ConfirmDialog`, `UserFormDialog`
