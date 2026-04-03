import { useHasPermission } from '@/lib/auth'

/**
 * Renders children only if the current user has the given permission codename.
 * Superusers always pass through.
 *
 * Usage:
 *   <Can codename="add_customuser">
 *     <Button>Create</Button>
 *   </Can>
 *
 *   <Can codename="delete_customuser" fallback={<span>No access</span>}>
 *     <Button variant="destructive">Delete</Button>
 *   </Can>
 */
export function Can({
  codename,
  fallback = null,
  children,
}: {
  codename: string
  fallback?: React.ReactNode
  children: React.ReactNode
}) {
  const allowed = useHasPermission(codename)
  return allowed ? <>{children}</> : <>{fallback}</>
}
