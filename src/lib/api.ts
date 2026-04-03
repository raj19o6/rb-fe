import axios from 'axios'

const BASE_URL = 'http://192.168.69.58:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let failedQueue: { resolve: (v: string) => void; reject: (e: unknown) => void }[] = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      const refresh = localStorage.getItem('refresh_token')
      if (!refresh) {
        isRefreshing = false
        localStorage.clear()
        window.location.href = '/'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`
        processQueue(null, data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch (err) {
        processQueue(err, null)
        localStorage.clear()
        window.location.href = '/'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

// ── Types ────────────────────────────────────────────────────────
export type Role = { id: number; name: string; permissions: number[] }
export type Permission = { id: number; name: string; codename: string; content_type: number }
export type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] }

export type UserPayload = {
  username: string
  password: string
  email: string
  first_name: string
  last_name: string
  contact_no: number
  groups: number[]
}

export type AppUser = {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  contact_no: number
  groups: number[]
}

export type Assignment = {
  id: number
  assigned_to: string
  assigned_to_username: string
  permissions: number[]
  permission_names?: string[]
  assigned_at?: string
}

export type TeamMember = {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  assigned_permissions: number[]
}

// ── Roles endpoints ─────────────────────────────────────────────
export const rolesApi = {
  list: () => api.get<Paginated<Role>>('/api/v1/role/'),
  get: (id: number) => api.get<Role>(`/api/v1/role/${id}/`),
  create: (payload: { name: string; permissions?: number[] }) => api.post<Role>('/api/v1/role/', payload),
  update: (id: number, payload: { name: string; permissions: number[] }) => api.put<Role>(`/api/v1/role/${id}/`, payload),
  delete: (id: number) => api.delete(`/api/v1/role/${id}/`),
}

export const permissionsApi = {
  list: () => api.get<Permission[]>('/api/v1/permission/'),
}

// ── Users endpoints ──────────────────────────────────────────────
export const usersApi = {
  create: (payload: UserPayload) => api.post<AppUser>('/api/v1/createUser/', payload),
}

// ── Permission assignment endpoints ──────────────────────────────
export const assignApi = {
  assign: (assigned_to: string, permissions: number[]) =>
    api.post('/api/v1/assignPermission/', { assigned_to, permissions }),
  revoke: (assigned_to: string, permissions: number[]) =>
    api.post('/api/v1/revokePermission/', { assigned_to, permissions }),
  myPermissions: () =>
    api.get<{ permissions: number[]; permission_details: Permission[] }>('/api/v1/myPermissions/'),
  assignments: () =>
    api.get<Assignment[]>('/api/v1/assignments/'),
  myTeam: () =>
    api.get<TeamMember[]>('/api/v1/myTeam/'),
}

// ── Auth endpoints ──────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ access: string; refresh: string }>('/auth/token/', { username, password }),

  refreshToken: (refresh: string) =>
    api.post<{ access: string; refresh: string }>('/auth/token/refresh/', { refresh }),

  changePassword: (new_password: string) =>
    api.post('/api/v1/changeMyPassword/', { new_password }),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/api/v1/passwordReset/', { email }),

  resetPassword: (temp_token: string, new_password: string) =>
    api.post(`/auth/pass-reset/${temp_token}/`, { new_password }),

  getUserType: () =>
    api.get<{
      user_type: string
      roles: { id: number; name: string }[]
      permissions: { id: number; codename: string }[]
    }>('/api/v1/isSuperUser/'),
}
