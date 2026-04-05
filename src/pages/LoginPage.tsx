import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { Sun, Moon, Eye, EyeOff, Bot, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Button } from '@/components/watermelon-ui/button'
import { Input } from '@/components/watermelon-ui/input'
import { Label } from '@/components/watermelon-ui/label'
import { Checkbox } from '@/components/watermelon-ui/checkbox'
import { Separator } from '@/components/watermelon-ui/separator'
import { Spinner } from '@/components/watermelon-ui/spinner'
import TextGradient from '@/components/watermelon-ui/text-gradient'
import { useAuthStore, getEffectiveRole } from '@/lib/auth'
import { authApi } from '@/lib/api'

type View = 'login' | 'register' | 'forgot' | 'reset'

const VIEW_TITLE: Record<View, string> = {
  login:    'Welcome back',
  register: 'Create an account',
  forgot:   'Forgot Password',
  reset:    'Reset Password',
}

const VIEW_SUBTITLE: Record<View, string> = {
  login:    'Sign in to your account to continue',
  register: 'Register as a client to get started',
  forgot:   'Enter your email to receive a reset token',
  reset:    'Enter the token from your email and your new password',
}

const emptyRegister = { username: '', password: '', email: '', first_name: '', last_name: '', contact_no: '' }

export default function LoginPage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const login = useAuthStore((s) => s.login)

  const [view, setView] = useState<View>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Login
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Register
  const [reg, setReg] = useState(emptyRegister)
  const [showRegPassword, setShowRegPassword] = useState(false)

  // Forgot / Reset
  const [email, setEmail] = useState('')
  const [tempToken, setTempToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  const reset = (v: View) => { setView(v); setError(''); setSuccess('') }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(username, password)
      const role = getEffectiveRole(useAuthStore.getState().user)
      const dest = role === 'superuser' ? '/dashboard/admin'
        : role === 'manager' ? '/dashboard/manager'
        : role === 'client' ? '/dashboard/client'
        : role === 'agent' ? '/dashboard/agent'
        : role === 'custom' ? '/dashboard/custom'
        : '/dashboard/admin'
      navigate(dest)
    } catch {
      setError('Invalid username or password. Please try again.')
    } finally { setLoading(false) }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await authApi.register({
        username: reg.username,
        password: reg.password,
        email: reg.email,
        first_name: reg.first_name,
        last_name: reg.last_name,
        contact_no: Number(reg.contact_no),
      })
      setSuccess('Account created! You can now sign in.')
      setReg(emptyRegister)
      setTimeout(() => reset('login'), 1500)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data
      setError(msg ? JSON.stringify(msg) : 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      const { data } = await authApi.forgotPassword(email)
      setSuccess(data.message ?? 'Reset instructions sent. Check your email for the token.')
    } catch {
      setError('No account found with that email.')
    } finally { setLoading(false) }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      await authApi.resetPassword(tempToken.trim(), newPassword)
      setSuccess('Password reset successfully. You can now sign in.')
      setTimeout(() => reset('login'), 2000)
    } catch {
      setError('Invalid or expired token. Please try again.')
    } finally { setLoading(false) }
  }

  const r = (key: keyof typeof emptyRegister) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setReg(p => ({ ...p, [key]: e.target.value }))

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-base font-semibold hover:opacity-80 transition-opacity">
          <Bot size={20} />
          <span>RichBot</span>
        </button>
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <TextGradient className="text-3xl font-bold" duration={3}>
              {VIEW_TITLE[view]}
            </TextGradient>
            <p className="text-sm text-muted-foreground">{VIEW_SUBTITLE[view]}</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                {view !== 'login' && (
                  <Button variant="ghost" size="icon-sm" type="button" onClick={() => reset('login')}>
                    <ArrowLeft size={14} />
                  </Button>
                )}
                <div>
                  <CardTitle>
                    {view === 'login' ? 'Sign In'
                      : view === 'register' ? 'Register'
                      : view === 'forgot' ? 'Forgot Password'
                      : 'Reset Password'}
                  </CardTitle>
                  <CardDescription>
                    {view === 'login' ? 'Enter your credentials below'
                      : view === 'register' ? 'Fill in your details to create a client account'
                      : view === 'forgot' ? "We'll send a reset token to your email"
                      : 'Enter the token and your new password'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>

              {/* ── Login ── */}
              {view === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" type="text" placeholder="your username"
                      value={username} onChange={(e) => setUsername(e.target.value)}
                      required autoComplete="username" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Button variant="link" size="sm" type="button" className="h-auto p-0 text-xs"
                        onClick={() => reset('forgot')}>
                        Forgot password?
                      </Button>
                    </div>
                    <div className="relative">
                      <Input id="password" type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••" value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required autoComplete="current-password" />
                      <Button type="button" variant="ghost" size="icon-sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                    </div>
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                      Remember me for 30 days
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Spinner size="sm" /> Signing in...</> : 'Sign In'}
                  </Button>
                  <Separator />
                  <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => reset('register')}
                      className="text-primary font-medium hover:underline">
                      Register as Client
                    </button>
                  </p>
                </form>
              )}

              {/* ── Register ── */}
              {view === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>First Name</Label>
                      <Input placeholder="John" value={reg.first_name} onChange={r('first_name')} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Last Name</Label>
                      <Input placeholder="Doe" value={reg.last_name} onChange={r('last_name')} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Username</Label>
                    <Input placeholder="johndoe" value={reg.username} onChange={r('username')} required autoComplete="username" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" placeholder="john@example.com" value={reg.email} onChange={r('email')} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input type={showRegPassword ? 'text' : 'password'} placeholder="••••••••"
                        value={reg.password} onChange={r('password')} required autoComplete="new-password" />
                      <Button type="button" variant="ghost" size="icon-sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowRegPassword(!showRegPassword)}>
                        {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact No.</Label>
                    <Input type="number" placeholder="9999999999" value={reg.contact_no} onChange={r('contact_no')} required />
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  {success && <p className="text-xs text-green-600">{success}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Spinner size="sm" /> Creating account...</> : 'Create Account'}
                  </Button>
                  <Separator />
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <button type="button" onClick={() => reset('login')}
                      className="text-primary font-medium hover:underline">
                      Sign In
                    </button>
                  </p>
                </form>
              )}

              {/* ── Forgot Password ── */}
              {view === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="you@example.com"
                      value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  {success && <p className="text-xs text-green-600">{success}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Spinner size="sm" /> Sending...</> : 'Send Reset Token'}
                  </Button>
                  <Button type="button" variant="link" className="w-full text-xs"
                    onClick={() => reset('reset')}>
                    Already have a token? Reset password →
                  </Button>
                </form>
              )}

              {/* ── Reset Password ── */}
              {view === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="token">Reset Token</Label>
                    <Input id="token" type="text" placeholder="Paste token from email"
                      value={tempToken} onChange={(e) => setTempToken(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input id="new-password" type={showNewPassword ? 'text' : 'password'}
                        placeholder="••••••••" value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)} required />
                      <Button type="button" variant="ghost" size="icon-sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowNewPassword(!showNewPassword)}>
                        {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                    </div>
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  {success && <p className="text-xs text-green-600">{success}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Spinner size="sm" /> Resetting...</> : 'Reset Password'}
                  </Button>
                </form>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
