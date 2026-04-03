import { useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { Sun, Moon, ArrowRight } from 'lucide-react'
import { Button } from '@/components/watermelon-ui/button'
import { MorphingButton } from '@/components/watermelon-ui/morphing-button'
import { Marquee } from '@/components/watermelon-ui/marquee'
import { ShimmerButton } from '@/components/watermelon-ui/shimmer-button'
import TextGradient from '@/components/watermelon-ui/text-gradient'
import { FlipClock } from '@/components/watermelon-ui/flip-clock'
import { Dock } from '@/components/watermelon-ui/dock'
import { Spinner } from '@/components/watermelon-ui/spinner'
import Bento1 from '@/components/watermelon-ui/bento-1'

const marqueeItems = [
  '260+ Components', 'Tailwind CSS v4', 'Radix UI', 'Framer Motion',
  'TypeScript First', 'Copy-Paste Ready', 'shadcn Compatible', 'Open Source',
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-border px-8 py-4">
        <span className="text-lg font-semibold">🍉 Watermelon UI</span>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          <Button onClick={() => navigate('/login')}>Open App</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner size="sm" /> Live components below
        </div>
        <h1 className="text-5xl font-bold leading-tight tracking-tight">
          Beautiful React components,{' '}
          <TextGradient className="text-5xl font-bold" duration={3}>
            ready to ship.
          </TextGradient>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          A showcase of 260+ production-ready UI components built with Tailwind CSS,
          Radix UI, and Framer Motion.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <ShimmerButton onClick={() => navigate('/login')} className="flex items-center gap-2">
            View Dashboard <ArrowRight size={16} />
          </ShimmerButton>
          <Button size="lg" variant="outline" onClick={() => navigate('/components')}>
            Browse Components
          </Button>
        </div>
      </section>

      {/* Marquee */}
      <div className="border-y border-border py-4">
        <Marquee pauseOnHover speed="normal">
          {marqueeItems.map((item) => (
            <span
              key={item}
              className="mx-4 rounded-full border border-border bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </Marquee>
      </div>

      {/* Flip Clock */}
      <section className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-muted-foreground">Current time — powered by FlipClock</p>
        <FlipClock size="md" />
      </section>

      {/* Bento Grid */}
      <section className="py-4">
        <Bento1 />
      </section>

      {/* Morphing Button */}
      <section className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-muted-foreground">MorphingButton — click to expand</p>
        <MorphingButton
          buttonText="Get Notified"
          placeholder="your@email.com"
          onSubmit={(email) => console.log('Submitted:', email)}
        />
      </section>

      {/* Dock */}
      <section className="flex flex-col items-center gap-4 pb-16">
        <p className="text-sm text-muted-foreground">Dock component</p>
        <Dock />
      </section>

      <footer className="border-t border-border px-8 py-6 text-center text-sm text-muted-foreground">
        Made with 🍉 by the Watermelon community
      </footer>
    </div>
  )
}
