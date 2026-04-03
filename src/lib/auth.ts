import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/lib/api'

type UserRole = { id: number; name: string }
type UserPermission = { id: number; codename: string }

type User = {
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

/** Primary role name from roles[0], e.g. "manager", "client", "agent" */
export function useRoleName(): string {
  return useAuthStore((s) => s.user?.roles?.[0]?.name ?? s.user?.user_type ?? '')
}

/** Check if the current user has a specific permission codename */
export function useHasPermission(codename: string): boolean {
  return useAuthStore((s) =>
    s.user?.user_type === 'superuser' ||
    (s.user?.permissions ?? []).some((p) => p.codename === codename),
  )
}
