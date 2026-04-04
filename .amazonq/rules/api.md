# API Rules

## API Client — Always use `@/lib/api`

All HTTP calls go through the pre-configured `api` axios instance from `@/lib/api`.
It handles auth headers and token refresh automatically.

```ts
// ✅ correct
import { botsApi, type Bot } from '@/lib/api'

// ❌ never
import axios from 'axios'
axios.get('https://...')
fetch('https://...')
```

## API Module Structure

Every resource must have a typed API module in `src/lib/api.ts` following this exact pattern:

```ts
// 1. Type definition
export type Entity = {
  id: string
  name: string
  // ... all fields returned by the API
}

// 2. API module — named [entity]Api
export const entityApi = {
  list:   ()                                    => api.get<Paginated<Entity>>('/api/v1/entity/'),
  get:    (id: string)                          => api.get<Entity>(`/api/v1/entity/${id}/`),
  create: (payload: CreateEntityPayload)        => api.post<Entity>('/api/v1/entity/', payload),
  update: (id: string, payload: Partial<...>)  => api.patch<Entity>(`/api/v1/entity/${id}/`, payload),
  delete: (id: string)                          => api.delete(`/api/v1/entity/${id}/`),
}
```

Rules:
- Always use `api.patch` for updates (not `api.put`) unless the backend explicitly requires PUT
- Always use trailing slash on all endpoint URLs: `/api/v1/entity/` not `/api/v1/entity`
- Always type the response generic: `api.get<Paginated<Entity>>`, never `api.get<any>`
- Payload types must be explicit named types or `Partial<EntityType>` — never inline `{ field: string }`
- `id` is always `string` (UUID) unless it's a Django system model (Role, Permission) which uses `number`

## Paginated Responses

Use the `Paginated<T>` generic for all list endpoints that return Django's paginated format:

```ts
export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Usage
api.get<Paginated<Bot>>('/api/v1/bot/')
// Access: data.results, data.count
```

Non-paginated list endpoints return `T[]` directly:
```ts
api.get<Permission[]>('/api/v1/permission/')
api.get<Billing[]>('/api/v1/billing/')
```

## CRUD in Pages — Required Pattern

Every page that performs CRUD must follow this exact state and handler pattern:

```ts
// State
const [items, setItems] = useState<Entity[]>([])
const [loading, setLoading] = useState(true)
const [deletingId, setDeletingId] = useState<string | null>(null)
const [dialogOpen, setDialogOpen] = useState(false)
const [editItem, setEditItem] = useState<Entity | null>(null)
const [pageAlert, setPageAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

// Fetch — always a named function so it can be passed to DataTable onRefresh
const fetchItems = () => {
  setLoading(true)
  entityApi.list()
    .then(({ data }) => setItems(data.results ?? []))
    .catch(() => setPageAlert({ type: 'error', message: 'Failed to load items.' }))
    .finally(() => setLoading(false))
}

useEffect(() => { fetchItems() }, [])

// Delete — always optimistic UI + deletingId spinner
const handleDelete = async (item: Entity) => {
  setDeletingId(item.id)
  try {
    await entityApi.delete(item.id)
    setItems(prev => prev.filter(x => x.id !== item.id))
    setPageAlert({ type: 'success', message: `"${item.name}" deleted successfully.` })
  } catch {
    setPageAlert({ type: 'error', message: `Failed to delete "${item.name}".` })
  } finally {
    setDeletingId(null)
  }
}
```

## CRUD in Form Dialogs — Required Pattern

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setSaving(true)
  setError('')
  try {
    if (editEntity) {
      await entityApi.update(editEntity.id, payload)
      onSuccess(`"${form.name}" updated successfully.`)
    } else {
      await entityApi.create(payload)
      onSuccess(`"${form.name}" created successfully.`)
    }
    onClose()
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: unknown } })?.response?.data
    setError(msg ? JSON.stringify(msg) : `Failed to ${editEntity ? 'update' : 'create'} item.`)
  } finally {
    setSaving(false)
  }
}
```

Rules:
- Always call `onClose()` AFTER `onSuccess()` on success — never before
- Always extract the backend error message from `err.response.data` before falling back to a generic string
- Never swallow errors silently — always set `error` state or `pageAlert`
- `setSaving(true)` and `setError('')` must be the first two lines of every submit handler
- `setSaving(false)` must always be in `finally` — never in `try` or `catch`

## Error Handling

```ts
// ✅ correct — extract backend validation errors
catch (err: unknown) {
  const msg = (err as { response?: { data?: unknown } })?.response?.data
  setError(msg ? JSON.stringify(msg) : 'Failed to save.')
}

// ❌ never silently swallow
catch { }

// ❌ never use console.error as the only handler
catch (err) { console.error(err) }
```

## Optimistic vs Refetch

- Delete: always optimistic — `setItems(prev => prev.filter(...))` immediately, no refetch
- Create: always refetch — call `fetchItems()` via `onSuccess` callback
- Update: always refetch — call `fetchItems()` via `onSuccess` callback

## Auth Store

```ts
import { useAuthStore, useRoleName, useHasPermission } from '@/lib/auth'

// Get current user
const user = useAuthStore((s) => s.user)

// Get role string: 'superuser' | 'manager' | 'client' | 'agent' | 'custom'
const role = useRoleName()

// Check a single permission (use <Can> in JSX instead when possible)
const canEdit = useHasPermission('change_customuser')

// Check user type
const isSuperuser = useAuthStore((s) => s.user?.user_type === 'superuser')
```

Never access `localStorage` directly for auth — always use `useAuthStore`.

## Existing API Modules (do not duplicate)

| Module | Resource |
|---|---|
| `usersApi` | Users CRUD |
| `rolesApi` | System roles CRUD |
| `customRolesApi` | Custom roles CRUD |
| `permissionsApi` | Permissions list |
| `botsApi` | Bots CRUD + allotments by user |
| `botAllotmentsApi` | Bot allotments CRUD |
| `budgetApi` | Budget CRUD + my budgets |
| `billingApi` | Billing CRUD |
| `paymentApi` | Payments list + create |
| `assignApi` | Permission assignments + my permissions |
| `authApi` | Login, token refresh, user profile |

Before adding a new API module, check this list. Never create a duplicate.
