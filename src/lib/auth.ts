import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/lib/api'

export type UserRole = { id: string; name: string; type: 'custom' | 'system' }
export type UserPermission = { id: number; codename: string }

export type User = {
  username: string
  user_type: string
  roles: UserRole[]
  permissions: UserPermission[]
}

type AuthState = {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  fetchUserProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (username, password) => {
        const { data } = await authApi.login(username, password)
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        set({
          accessToken: data.access,
          refreshToken: data.refresh,
          isAuthenticated: true,
          user: { username, user_type: '', roles: [], permissions: [] },
        })
        await get().fetchUserProfile()
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      fetchUserProfile: async () => {
        try {
          const { data } = await authApi.getUserType()
          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  user_type: data.user_type,
                  roles: data.roles ?? [],
                  permissions: data.permissions ?? [],
                }
              : null,
          }))
        } catch {
          // silently fail
        }
      },
    }),
    {
      name: 'richbot-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

// ── Derived helpers ──────────────────────────────────────────────

/**
 * Returns the effective role key used for nav/routing:
 * - "superuser"  → user_type === 'superuser'
 * - "manager"    → system role named "manager"
 * - "client"     → system role named "client"
 * - "agent"      → system role named "agent"
 * - "custom"     → has a custom role (type === 'custom')
 */
export function getEffectiveRole(user: User | null): string {
  if (!user) return ''
  if (user.user_type === 'superuser') return 'superuser'
  const role = user.roles?.[0]
  if (!role) return ''
  if (role.type === 'custom') return 'custom'
  return role.name // "manager" | "client" | "agent"
}

export function useRoleName(): string {
  return useAuthStore((s) => getEffectiveRole(s.user))
}

/** Check if the current user has a specific permission codename */
export function useHasPermission(codename: string): boolean {
  return useAuthStore((s) =>
    s.user?.user_type === 'superuser' ||
    (s.user?.permissions ?? []).some((p) => p.codename === codename),
  )
}
