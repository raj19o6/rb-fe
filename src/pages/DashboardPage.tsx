import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/watermelon-ui/card'
import { Badge } from '@/components/watermelon-ui/badge'
import { Button } from '@/components/watermelon-ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/watermelon-ui/avatar'
import { Progress } from '@/components/watermelon-ui/progress'
import { Separator } from '@/components/watermelon-ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/watermelon-ui/tabs'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { TrendingUp, TrendingDown, Users, DollarSign, ShoppingCart, Activity, Download } from 'lucide-react'
import { useAuthStore, useRoleName } from '@/lib/auth'

const areaData = [
  { month: 'Jan', revenue: 4000, users: 2400 },
  { month: 'Feb', revenue: 3000, users: 1398 },
  { month: 'Mar', revenue: 6000, users: 5800 },
  { month: 'Apr', revenue: 8000, users: 3908 },
  { month: 'May', revenue: 5000, users: 4800 },
  { month: 'Jun', revenue: 9000, users: 3800 },
  { month: 'Jul', revenue: 11000, users: 4300 },
]

const barData = [
  { day: 'Mon', sales: 120 },
  { day: 'Tue', sales: 210 },
  { day: 'Wed', sales: 180 },
  { day: 'Thu', sales: 290 },
  { day: 'Fri', sales: 340 },
  { day: 'Sat', sales: 250 },
  { day: 'Sun', sales: 190 },
]

const pieData = [
  { name: 'Direct', value: 400 },
  { name: 'Social', value: 300 },
  { name: 'Email', value: 200 },
  { name: 'Other', value: 100 },
]

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd']

const stats = [
  { label: 'Total Revenue', value: '$45,231', change: '+20.1%', up: true, icon: DollarSign },
  { label: 'Active Users', value: '2,350', change: '+15.3%', up: true, icon: Users },
  { label: 'New Orders', value: '1,247', change: '-4.2%', up: false, icon: ShoppingCart },
  { label: 'Uptime', value: '99.9%', change: '+0.1%', up: true, icon: Activity },
]

const recentActivity = [
  { name: 'Alice Johnson', action: 'Placed a new order', time: '2m ago', avatar: 'AJ' },
  { name: 'Bob Smith', action: 'Upgraded to Pro plan', time: '15m ago', avatar: 'BS' },
  { name: 'Carol White', action: 'Submitted a support ticket', time: '1h ago', avatar: 'CW' },
  { name: 'David Lee', action: 'Completed onboarding', time: '3h ago', avatar: 'DL' },
]

const projects = [
  { name: 'Website Redesign', progress: 78, status: 'In Progress' },
  { name: 'Mobile App v2', progress: 45, status: 'In Progress' },
  { name: 'API Integration', progress: 92, status: 'Review' },
  { name: 'Analytics Dashboard', progress: 20, status: 'Planning' },
]

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const roleName = useRoleName()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, <span className="font-medium text-foreground">{user?.username ?? 'User'}</span>!
            {roleName && (
              <Badge variant="outline" className="ml-2 text-xs capitalize">{roleName}</Badge>
            )}
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Download size={14} /> Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, change, up, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
              <p className={`mt-1 flex items-center gap-1 text-xs ${up ? 'text-green-600' : 'text-red-500'}`}>
                {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue & Users</TabsTrigger>
          <TabsTrigger value="sales">Weekly Sales</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Users</CardTitle>
              <CardDescription>Monthly overview for the current year</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="users" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revenue)" />
                  <Area type="monotone" dataKey="users" stroke="#8b5cf6" fill="url(#users)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Sales</CardTitle>
              <CardDescription>Sales count per day this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Where your visitors come from</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-8">
              <ResponsiveContainer width="50%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-muted-foreground">{entry.name}</span>
                    <span className="ml-auto font-medium">{entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs">{item.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.action}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                </div>
                {i < recentActivity.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Projects</CardTitle>
            <Button variant="outline" size="sm">View All</Button>
          </CardHeader>
          <CardContent className="space-y-5">
            {projects.map((p) => (
              <div key={p.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{p.name}</span>
                  <Badge variant={p.status === 'Review' ? 'default' : 'secondary'} className="text-xs">
                    {p.status}
                  </Badge>
                </div>
                <Progress value={p.progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{p.progress}% complete</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
