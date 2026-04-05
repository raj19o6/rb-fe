import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { motion } from 'motion/react'
import {
  Sun, Moon, ArrowRight, Bot, Shield, Zap, FileCode2,
  Globe, Lock, BarChart3, CheckCircle2, Menu, X,
} from 'lucide-react'
import { Button } from '@/components/watermelon-ui/button'
import { Badge } from '@/components/watermelon-ui/badge'
import { Card, CardContent } from '@/components/watermelon-ui/card'
import { Marquee } from '@/components/watermelon-ui/marquee'
import { ShimmerButton } from '@/components/watermelon-ui/shimmer-button'
import TextGradient from '@/components/watermelon-ui/text-gradient'
import { Separator } from '@/components/watermelon-ui/separator'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', delay: i * 0.09 } }),
}
const fadeIn = {
  hidden: { opacity: 0 },
  show: (i = 0) => ({ opacity: 1, transition: { duration: 0.45, ease: 'easeOut', delay: i * 0.07 } }),
}

const techBadges = [
  'Playwright', 'OpenAI', 'XSS Detection', 'SQLi Scanning',
  'Header Analysis', 'HTML Reports', 'JSON Reports', 'Real-time Cost Tracking',
  'YAML Templates', 'Record & Replay', 'Autonomous Testing', 'REST API',
]

const features = [
  {
    icon: Bot, title: 'Record & Replay',
    description: 'Record browser workflows once and replay them with zero cost. Perfect for regression testing and repetitive QA tasks.',
    badge: 'Zero Cost', badgeClass: 'border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200',
  },
  {
    icon: Shield, title: 'Autonomous Security Scanning',
    description: 'AI-driven site exploration that automatically detects XSS, SQL injection, and missing security headers across your entire application.',
    badge: 'AI Powered', badgeClass: 'border-blue-500/30 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  },
  {
    icon: FileCode2, title: 'Template Mode',
    description: 'Define test suites in YAML. Structured, version-controlled, and shareable test configurations that run consistently every time.',
    badge: 'YAML Based', badgeClass: 'border-yellow-500/40 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200',
  },
  {
    icon: BarChart3, title: 'Rich Reports',
    description: 'Generate detailed HTML and JSON reports with full test results, security findings, and actionable remediation steps.',
    badge: 'HTML + JSON', badgeClass: 'border-purple-500/30 bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
  },
  {
    icon: Globe, title: 'Real-time Cost Tracking',
    description: 'Track AI usage costs in USD and INR in real time. Know exactly what each test run costs before it hits your bill.',
    badge: 'USD / INR', badgeClass: 'border-orange-500/30 bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
  },
  {
    icon: Lock, title: 'Role-Based Access',
    description: 'Full RBAC with superuser, manager, and client roles. Managers approve bot requests, set billing, and manage their client teams.',
    badge: 'RBAC', badgeClass: 'border-red-500/30 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200',
  },
]

const steps = [
  { step: '01', title: 'Request a Bot', desc: 'Browse available bots, fill in your target credentials, and submit a request.' },
  { step: '02', title: 'Manager Approves', desc: 'Your manager reviews the request with credentials and approves it — billing is auto-created.' },
  { step: '03', title: 'Pay & Run', desc: 'Complete payment and trigger the bot. It runs with your credentials and generates a full report.' },
]

const securityChecks = [
  'Cross-Site Scripting (XSS)',
  'SQL Injection (SQLi)',
  'Missing Security Headers',
  'Authentication Bypass',
  'Open Redirect Detection',
  'Sensitive Data Exposure',
]

const terminalLines = [
  { text: '✓ Target: https://mysite.com', color: 'text-green-500' },
  { text: '→ Running XSS probe on 12 endpoints...', color: 'text-muted-foreground' },
  { text: '⚠ XSS found at /search?q= (reflected)', color: 'text-yellow-500' },
  { text: '→ Running SQLi probe...', color: 'text-muted-foreground' },
  { text: '✓ No SQLi vulnerabilities detected', color: 'text-green-500' },
  { text: '→ Checking security headers...', color: 'text-muted-foreground' },
  { text: '✗ Missing: X-Frame-Options, CSP', color: 'text-red-400' },
  { text: '→ Generating report...', color: 'text-muted-foreground' },
  { text: '✓ Report saved: report_20260404.html', color: 'text-green-500' },
  { text: '→ Cost: ₹2.40 (3 AI calls)', color: 'text-muted-foreground' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-x-hidden">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <Bot size={16} />
            </div>
            <span className="text-base font-bold sm:text-lg">RichBot</span>
            <Badge variant="secondary" className="hidden text-[10px] sm:inline-flex">BaaS</Badge>
          </div>

          {/* Desktop nav */}
          <div className="hidden items-center gap-2 sm:flex">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/login')}>Sign In</Button>
            <ShimmerButton onClick={() => navigate('/login')} className="flex items-center gap-1.5 text-sm px-4 h-9">
              Get Started <ArrowRight size={14} />
            </ShimmerButton>
          </div>

          {/* Mobile nav toggle */}
          <div className="flex items-center gap-2 sm:hidden">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(v => !v)}>
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="border-t border-border bg-background px-4 pb-4 sm:hidden"
          >
            <div className="flex flex-col gap-2 pt-3">
              <Button variant="outline" className="w-full" onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}>
                Sign In
              </Button>
              <ShimmerButton
                onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}
                className="flex w-full items-center justify-center gap-2 h-10 text-sm"
              >
                Get Started <ArrowRight size={14} />
              </ShimmerButton>
            </div>
          </motion.div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="w-full bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24 lg:py-32">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
            <Badge variant="outline" className="mb-5 gap-1.5 border-primary/30 bg-primary/5 text-primary px-3 py-1 text-xs sm:text-sm">
              <Zap size={11} /> Web Testing Automation Platform
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
          >
            Automate web testing with{' '}
            <span className="block mt-1 sm:inline">
              <TextGradient
                className="text-3xl font-bold sm:text-5xl lg:text-6xl"
                duration={3}
                highlightColor="hsl(var(--primary))"
                baseColor="hsl(var(--muted-foreground))"
              >
                AI-powered bots
              </TextGradient>
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="mt-5 max-w-xl text-sm text-muted-foreground leading-relaxed sm:text-base lg:text-lg"
          >
            RichBot is a production-ready web testing automation platform. Record workflows,
            run autonomous security scans, and generate rich reports — all managed through
            a role-based dashboard.
          </motion.p>

          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="mt-8 flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center"
          >
            <ShimmerButton
              onClick={() => navigate('/login')}
              className="flex w-full items-center justify-center gap-2 px-6 h-11 text-sm font-medium sm:w-auto"
            >
              Start Testing <ArrowRight size={16} />
            </ShimmerButton>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="w-full h-11 sm:w-auto"
            >
              View Dashboard
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={4}
            className="mt-14 grid w-full max-w-sm grid-cols-3 gap-4 border-t border-border pt-10 sm:max-w-lg sm:gap-8"
          >
            {[
              { value: '3', label: 'Testing Modes' },
              { value: '6+', label: 'Security Checks' },
              { value: '100%', label: 'Report Coverage' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold sm:text-3xl">{value}</p>
                <p className="text-xs text-muted-foreground mt-1 sm:text-sm">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="w-full border-y border-border py-3 bg-muted/30">
        <Marquee pauseOnHover speed="normal" repeat={2}>
          {techBadges.map((item) => (
            <span key={item} className="mx-3 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground whitespace-nowrap">
              {item}
            </span>
          ))}
        </Marquee>
      </div>

      {/* ── Features ── */}
      <section className="w-full py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0}
            className="mb-10 text-center sm:mb-14"
          >
            <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5 text-primary">Features</Badge>
            <h2 className="text-2xl font-bold sm:text-3xl">Everything you need to test at scale</h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto sm:text-base">
              Three powerful testing modes, AI-driven security scanning, and a full billing and access management system.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i * 0.4}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="pt-5 pb-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <f.icon size={18} className="text-primary" />
                      </div>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${f.badgeClass}`}>{f.badge}</Badge>
                    </div>
                    <p className="font-semibold text-sm">{f.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Security ── */}
      <section className="w-full py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 items-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0}>
              <Badge variant="outline" className="mb-4 border-red-500/30 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200">
                Security
              </Badge>
              <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
                Comprehensive security scanning built in
              </h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed sm:text-base">
                Our autonomous testing engine doesn't just check functionality — it actively probes your application for vulnerabilities using AI-powered exploration.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                {securityChecks.map((check, i) => (
                  <motion.div
                    key={check}
                    variants={fadeIn} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i * 0.4}
                    className="flex items-center gap-2.5"
                  >
                    <CheckCircle2 size={15} className="text-green-600 shrink-0" />
                    <span className="text-sm">{check}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
              className="rounded-lg border border-border bg-muted/40 overflow-hidden w-full"
            >
              <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-muted-foreground font-mono truncate">richbot — security scan</span>
              </div>
              <div className="p-4 font-mono text-xs space-y-1.5 overflow-x-auto">
                {terminalLines.map((line, i) => (
                  <motion.p
                    key={i}
                    variants={fadeIn} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i * 0.6}
                    className={`whitespace-nowrap ${line.color}`}
                  >
                    {line.text}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── How it works ── */}
      <section className="w-full py-16 bg-muted/20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0}
            className="mb-10 text-center sm:mb-14"
          >
            <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5 text-primary">How it works</Badge>
            <h2 className="text-2xl font-bold sm:text-3xl">From request to report in 3 steps</h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i * 0.4}
                className="relative flex flex-col items-center text-center px-2"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold mb-4 shadow-md shrink-0">
                  {s.step}
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute top-7 left-[calc(50%+28px)] right-0 hidden h-px bg-border sm:block" />
                )}
                <p className="font-semibold text-sm sm:text-base">{s.title}</p>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed sm:text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* ── CTA ── */}
      <section className="w-full py-20 sm:py-28">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0}
          className="mx-auto max-w-2xl px-4 text-center sm:px-6"
        >
          <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">Ready to automate your testing?</h2>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base lg:text-lg">
            Sign in to your RichBot dashboard and start running bots today.
          </p>
          <div className="mt-8 flex w-full max-w-xs flex-col gap-3 mx-auto sm:max-w-none sm:flex-row sm:justify-center">
            <ShimmerButton
              onClick={() => navigate('/login')}
              className="flex w-full items-center justify-center gap-2 px-8 h-11 text-sm font-medium sm:w-auto"
            >
              Open Dashboard <ArrowRight size={16} />
            </ShimmerButton>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="w-full h-11 sm:w-auto"
            >
              Sign In
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-border bg-muted/20 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
              <Bot size={14} />
            </div>
            <span className="font-semibold text-sm">RichBot</span>
            <span className="text-xs text-muted-foreground">— Bots as a Service</span>
          </div>
          <p className="text-xs text-muted-foreground text-center sm:text-right">
            © {new Date().getFullYear()} RichBot. Web Testing Automation Platform.
          </p>
        </div>
      </footer>
    </div>
  )
}
