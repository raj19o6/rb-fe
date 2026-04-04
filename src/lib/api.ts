import axios from 'axios'

const BASE_URL = 'https://api-richbot.btacode.com'

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
  custom_role?: string
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

export type Assignment = MyPermission

export type TeamPermission = {
  permission__id: number
  permission__codename: string
  permission__name: string
}

export type TeamMember = {
  id: string
  username: string
  email: string
  role: string
  permissions_assigned: TeamPermission[]
}

export type CustomRole = {
  id: string
  name: string
  created_by: string
  created_by_username: string
  permissions: number[]
  permission_details: { id: number; codename: string; name: string }[]
  created_at: string
}

export const customRolesApi = {
  list: () => api.get<Paginated<CustomRole>>('/api/v1/customrole/'),
  create: (payload: { name: string; permissions: number[] }) => api.post<CustomRole>('/api/v1/customrole/', payload),
  update: (id: string, payload: { name: string; permissions: number[] }) => api.patch<CustomRole>(`/api/v1/customrole/${id}/`, payload),
  delete: (id: string) => api.delete(`/api/v1/customrole/${id}/`),
}

export type BotAllotment = {
  id: string
  bot: string
  bot_name: string
  user: string
  username: string
  allotted_by: string | null
  allotted_at: string
}

export const botAllotmentsApi = {
  list: () => api.get<Paginated<BotAllotment>>('/api/v1/botallotments/'),
  create: (payload: { bot: string; user: string }) => api.post<BotAllotment>('/api/v1/botallotments/', payload),
  delete: (id: string) => api.delete(`/api/v1/botallotments/${id}/`),
}

// ── Bot ─────────────────────────────────────────────────────────
export type Bot = {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'maintenance'
  created_by: string
  created_by_username: string
  created_at: string
  updated_at: string
}

export const botsApi = {
  list: () => api.get<Paginated<Bot>>('/api/v1/bot/'),
  get: (id: string) => api.get<Bot>(`/api/v1/bot/${id}/`),
  getByUser: (userId: string) => api.get<BotAllotment[]>(`/api/v1/getBotAllotmentsByUser/${userId}/`),
  create: (payload: { name: string; description: string; status: string; created_by: string }) => api.post<Bot>('/api/v1/bot/', payload),
  update: (id: string, payload: Partial<{ name: string; description: string; status: string }>) => api.patch<Bot>(`/api/v1/bot/${id}/`, payload),
  delete: (id: string) => api.delete(`/api/v1/bot/${id}/`),
}

// ── Budget ───────────────────────────────────────────────────────
export type Budget = {
  id: string
  user: string
  username: string
  bot: string
  bot_name: string
  allocated_amount: string
  consumed_amount: string
  remaining_amount: string | number
  period_start: string
  period_end: string
  created_at: string
  updated_at: string
}

export const budgetApi = {
  list: () => api.get<Paginated<Budget>>('/api/v1/budget/'),
  getMy: (bot_id?: string) => api.get<Budget[]>(`/api/v1/getBudget/${bot_id ? `?bot_id=${bot_id}` : ''}`),
  create: (payload: { user: string; bot: string; allocated_amount: string; period_start: string; period_end: string }) =>
    api.post<Budget>('/api/v1/budget/', payload),
  update: (id: string, payload: Partial<{ allocated_amount: string; period_start: string; period_end: string }>) =>
    api.patch<Budget>(`/api/v1/budget/${id}/`, payload),
  delete: (id: string) => api.delete(`/api/v1/budget/${id}/`),
}

// ── Billing ──────────────────────────────────────────────────────
export type Billing = {
  id: string
  user: string
  username: string
  bot: string
  bot_name: string
  amount: string
  price_per_action: string
  status: 'unpaid' | 'paid' | 'overdue'
  billing_date: string
  created_at: string
}

export const billingApi = {
  list: () => api.get<Billing[]>('/api/v1/billing/'),
  create: (payload: { user: string; bot: string; amount: string; price_per_action: string; status: string; billing_date: string }) =>
    api.post<Billing>('/api/v1/billing/', payload),
  update: (id: string, payload: Partial<{ amount: string; price_per_action: string; status: string }>) =>
    api.patch<Billing>(`/api/v1/billing/${id}/`, payload),
  delete: (id: string) => api.delete(`/api/v1/billing/${id}/`),
}

// ── Payment ──────────────────────────────────────────────────────
export type Payment = {
  id: string
  billing: string
  billing_status: string
  paid_by: string
  paid_by_username: string
  amount: string
  transaction_id: string
  method: 'card' | 'bank_transfer' | 'cash' | 'online'
  status: 'completed' | 'pending' | 'failed'
  paid_at: string
  created_at: string
}

export const paymentApi = {
  list: () => api.get<Payment[]>('/api/v1/payment/'),
  create: (payload: { billing: string; paid_by: string; amount: string; method: string; status: string }) =>
    api.post<Payment>('/api/v1/payment/', payload),
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



export type ListUser = {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  groups: number[]
  is_staff: boolean
  is_active: boolean
  contact_no: number | null
}

// ── Users endpoints ──────────────────────────────────────────────
export const usersApi = {
  list: () => api.get<Paginated<ListUser>>('/api/v1/user/'),
  create: (payload: UserPayload) => api.post<AppUser>('/api/v1/createUser/', payload),
  update: (id: string, payload: Partial<UserPayload>) => api.patch<AppUser>(`/api/v1/user/${id}/`, payload),
  delete: (id: string) => api.delete(`/api/v1/user/${id}/`),
}

// ── Permission assignment endpoints ──────────────────────────────
export type MyPermission = {
  id: string
  assigned_by: string
  assigned_by_username: string
  assigned_to: string
  assigned_to_username: string
  permission: number
  permission_codename: string
  permission_name: string
  created_at: string
}

export const assignApi = {
  assign: (assigned_to: string, permissions: number[]) =>
    api.post('/api/v1/assignPermission/', { assigned_to, permissions }),
  revoke: (assigned_to: string, permissions: number[]) =>
    api.post('/api/v1/revokePermission/', { assigned_to, permissions }),
  myPermissions: () =>
    api.get<MyPermission[]>('/api/v1/myPermissions/'),
  assignments: () =>
    api.get<Assignment[]>('/api/v1/assignments/'),
  myTeam: () =>
    api.get<TeamMember[]>('/api/v1/myTeam/'),
}

// ── Profile ─────────────────────────────────────────────────────
export type UserProfile = {
  id: string
  user: {
    id: string
    username: string
    email: string
    first_name: string
    last_name: string
    is_staff: boolean
    is_active: boolean
    groups: { id: number; name: string }[]
  }
  contact_no: number | null
}

export const profileApi = {
  get: () => api.get<Paginated<UserProfile>>('/api/v1/userprofile/'),
  update: (id: string, payload: { first_name?: string; last_name?: string; contact_no?: number | null }) =>
    api.patch<UserProfile>(`/api/v1/userprofile/${id}/`, payload),
}

// ── Workflows ────────────────────────────────────────────────────
export type Workflow = {
  id: string
  name: string
  username: string
  session_id: string
  actions: { url: string; type: string; selector: string; value?: string; text?: string; timestamp: number }[]
  action_count: number
  status: string
  success_rate: number | null
  last_executed: string | null
  recorded_at: string
  created_at: string
}

export const workflowsApi = {
  list: () => api.get<{ workflows: Workflow[] }>('/api/v1/workflows/'),
  download: (id: string) => api.get(`/api/v1/workflows/${id}/download/`),
  execute: (id: string) => api.post(`/api/v1/workflows/${id}/execute/`),
  report: (id: string) => api.get(`/api/v1/workflows/${id}/report/`),
  delete: (id: string) => api.delete(`/api/v1/workflows/${id}/`),
}

// ── Executions ───────────────────────────────────────────────────
export type Execution = {
  id: string
  workflow_id: string
  workflow_name: string
  status: 'completed' | 'failed' | 'running' | 'queued' | 'cancelled'
  execution_id: string
  triggered_at: string
  completed_at: string | null
  created_at: string
}

export type ExecutionReport = {
  id: string
  workflow_id: string
  workflow_name: string
  status: string
  execution_time?: number
  report?: {
    template: string
    url: string
    timestamp: string
    summary: {
      total: number
      passed: number
      failed: number
      security_issues: number
    }
  }
  html_report?: string
  json_report?: { workflow: string; total: number; passed: number; failed: number }
  // legacy fields
  executed_at?: string
  summary?: {
    total: number
    passed: number
    failed: number
    security_issues: number
    success_rate?: number
  }
  html_report_url?: string
}

export const executionsApi = {
  list: () => api.get<Execution[]>('/api/v1/executions/'),
  reports: () => api.get<ExecutionReport[]>('/api/v1/executionreports/'),
}

// ── Bot Requests ────────────────────────────────────────────────
export type BotRequest = {
  id: string
  bot: string
  bot_name: string
  title: string
  description: string
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed'
  rejection_reason: string | null
  requested_by: string
  requested_by_username: string
  assigned_to: string | null
  assigned_to_username: string | null
  created_at: string
  updated_at: string
}

export const requestsApi = {
  list: () => api.get<Paginated<BotRequest>>('/api/v1/requests/'),
  create: (payload: { bot: string; title: string; description: string }) =>
    api.post<BotRequest>('/api/v1/requests/', payload),
  approve: (id: string) => api.post(`/api/v1/requests/${id}/approve/`),
  reject: (id: string, reason: string) =>
    api.post(`/api/v1/requests/${id}/reject/`, { reason }),
}

export const availableBotsApi = {
  list: () => api.get<Bot[]>('/api/v1/bot/available/'),
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

  getDashboard: () =>
    api.get<{
      bots: { total: number; active: number; inactive: number; maintenance: number }
      executions: { total: number; success: number; failed: number; running: number; queued: number; cancelled: number }
      budget: { total_allocated: number; total_consumed: number; total_remaining: number }
      billing: { total_amount: number; paid: number; unpaid: number; overdue: number }
      bugs: { open: { low: number; medium: number; high: number; critical: number }; total_open: number }
      requests: { total: number; pending: number; approved: number; in_progress: number; completed: number; rejected: number }
      notifications: { unread_count: number; recent: unknown[] }
      users_roles?: { users: { total: number; active: number; inactive: number; superusers: number }; roles: { system_roles: number; custom_roles: number; total: number } }
    }>('/api/v1/getDashboard/'),

  getUserType: () =>
    api.get<{
      user_type: string
      roles: { id: string; name: string; type: 'custom' | 'system' }[]
      permissions: { id: number; codename: string }[]
    }>('/api/v1/isSuperUser/'),
}
