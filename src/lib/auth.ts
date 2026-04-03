import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/lib/api'

type User = {
  username: string
  user_type: string
}

type AuthState = {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  fetchUserType: () => Promise<void>
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
          user: { username, user_type: '' },
        })
        await get().fetchUserType()
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      fetchUserType: async () => {
        try {
          const { data } = await authApi.getUserType()
          set((state) => ({
            user: state.user ? { ...state.user, user_type: data.user_type } : null,
          }))
        } catch {
          // silently fail — user_type stays empty
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
