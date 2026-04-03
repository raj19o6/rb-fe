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

type View = 'login' | 'forgot' | 'reset'

export default function LoginPage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const login = useAuthStore((s) => s.login)

  const [view, setView] = useState<View>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Login fields
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Forgot password fields
  const [email, setEmail] = useState('')

  // Reset password fields
  const [tempToken, setTempToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      const { data } = await authApi.forgotPassword(email)
      setSuccess(data.message ?? 'Reset instructions sent. Check your email for the token.')
    } catch {
      setError('No account found with that email.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      await authApi.resetPassword(tempToken.trim(), newPassword)
      setSuccess('Password reset successfully. You can now sign in.')
      setTimeout(() => { setView('login'); setSuccess('') }, 2000)
    } catch {
      setError('Invalid or expired token. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => { setView('login'); setError(''); setSuccess('') }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b border-border">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Bot size={20} />
          <span>RichBot</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
      </header>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <TextGradient className="text-3xl font-bold">
              {view === 'login' ? 'Welcome back' : view === 'forgot' ? 'Forgot Password' : 'Reset Password'}
            </TextGradient>
            <p className="text-sm text-muted-foreground">
              {view === 'login' ? 'Sign in to your account to continue'
                : view === 'forgot' ? 'Enter your email to receive a reset token'
                : 'Enter the token from your email and your new password'}
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                {view !== 'login' && (
                  <Button variant="ghost" size="icon-sm" type="button" onClick={goBack}>
                    <ArrowLeft size={14} />
                  </Button>
                )}
                <div>
                  <CardTitle>
                    {view === 'login' ? 'Sign In' : view === 'forgot' ? 'Forgot Password' : 'Reset Password'}
                  </CardTitle>
                  <CardDescription>
                    {view === 'login' ? 'Enter your credentials below'
                      : view === 'forgot' ? 'We\'ll send a reset token to your email'
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
                    <Input
                      id="username"
                      type="text"
                      placeholder="your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Button
                        variant="link" size="sm" type="button"
                        className="h-auto p-0 text-xs"
                        onClick={() => { setView('forgot'); setError(''); setSuccess('') }}
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <Button
                        type="button" variant="ghost" size="icon-sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowPassword(!showPassword)}
                      >
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
                  <p className="text-center text-xs text-muted-foreground">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </form>
              )}

              {/* ── Forgot Password ── */}
              {view === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  {success && <p className="text-xs text-green-600">{success}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Spinner size="sm" /> Sending...</> : 'Send Reset Token'}
                  </Button>
                  <Button
                    type="button" variant="link" className="w-full text-xs"
                    onClick={() => { setView('reset'); setError(''); setSuccess('') }}
                  >
                    Already have a token? Reset password →
                  </Button>
                </form>
              )}

              {/* ── Reset Password ── */}
              {view === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="token">Reset Token</Label>
                    <Input
                      id="token"
                      type="text"
                      placeholder="Paste token from email"
                      value={tempToken}
                      onChange={(e) => setTempToken(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button" variant="ghost" size="icon-sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
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
