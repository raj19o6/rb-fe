import { useState } from 'react'
// Watermelon UI components
import { Spinner } from '@/components/watermelon-ui/spinner'
import { FlipClock } from '@/components/watermelon-ui/flip-clock'
import { Marquee } from '@/components/watermelon-ui/marquee'
import { ShimmerButton } from '@/components/watermelon-ui/shimmer-button'
import { MorphingButton } from '@/components/watermelon-ui/morphing-button'
import TextGradient from '@/components/watermelon-ui/text-gradient'
import { Dock } from '@/components/watermelon-ui/dock'
import { RippleButton, RippleButtonRipples } from '@/components/watermelon-ui/ripple'
import { Badge as WmBadge } from '@/components/watermelon-ui/badge'
import { Avatar as WmAvatar } from '@/components/watermelon-ui/avatar'
import { Button as WmButton } from '@/components/watermelon-ui/button'
import { Checkbox as WmCheckbox } from '@/components/watermelon-ui/checkbox'
import { Switch as WmSwitch } from '@/components/watermelon-ui/switch'
import { Input as WmInput } from '@/components/watermelon-ui/input'
import { Textarea as WmTextarea } from '@/components/watermelon-ui/textarea'
import { Progress as WmProgress } from '@/components/watermelon-ui/progress'
import { Skeleton as WmSkeleton } from '@/components/watermelon-ui/skeleton'
import { Separator as WmSeparator } from '@/components/watermelon-ui/separator'
import { Toggle as WmToggle } from '@/components/watermelon-ui/toggle'
import { Tooltip as WmTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/watermelon-ui/tooltip'
import { Accordion as WmAccordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/watermelon-ui/accordion'
import { Alert as WmAlert, AlertTitle, AlertDescription } from '@/components/watermelon-ui/alert'
import { Tabs as WmTabs, TabsContent, TabsList, TabsTrigger } from '@/components/watermelon-ui/tabs'
import { Select as WmSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/watermelon-ui/select'
import { Card as WmCard, CardContent, CardHeader, CardTitle } from '@/components/watermelon-ui/card'
import { Table as WmTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/watermelon-ui/table'
import { Label as WmLabel } from '@/components/watermelon-ui/label'
import { RadioGroup as WmRadioGroup, RadioGroupItem } from '@/components/watermelon-ui/radio-group'
import { ToggleGroup as WmToggleGroup, ToggleGroupItem } from '@/components/watermelon-ui/toggle-group'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/watermelon-ui/breadcrumb'
import { AlertCircle, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { toast } from 'sonner'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold">{title}</h2>
    <div className="rounded-xl border border-border bg-card p-6">{children}</div>
    <WmSeparator />
  </div>
)

const tableData = [
  { name: 'Alice', role: 'Designer', status: 'Active' },
  { name: 'Bob', role: 'Engineer', status: 'Inactive' },
  { name: 'Carol', role: 'PM', status: 'Active' },
]

export default function ComponentsPage() {
  const [progress] = useState(65)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Components Showcase</h1>
        <p className="text-sm text-muted-foreground">All Watermelon UI components from the registry.</p>
      </div>

      {/* Text Gradient */}
      <Section title="TextGradient">
        <div className="flex flex-wrap gap-6 items-center">
          <TextGradient className="text-3xl font-bold">Animated Gradient Text</TextGradient>
          <TextGradient className="text-2xl font-semibold" duration={1.5} highlightColor="hsl(var(--primary))">
            Fast Gradient
          </TextGradient>
          <TextGradient className="text-xl" duration={5}>Slow & Smooth</TextGradient>
        </div>
      </Section>

      {/* Spinner */}
      <Section title="Spinner">
        <div className="flex flex-wrap gap-6 items-center">
          <Spinner size="sm" />
          <Spinner size="default" />
          <Spinner size="lg" />
          <Spinner size="xl" />
          <Spinner size="default" speed="slow" />
          <Spinner size="default" speed="fast" />
        </div>
      </Section>

      {/* FlipClock */}
      <Section title="FlipClock">
        <div className="flex flex-wrap gap-10 items-center">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Live clock — sm</p>
            <FlipClock size="sm" />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Live clock — md</p>
            <FlipClock size="md" />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Countdown — lg</p>
            <FlipClock
              size="lg"
              countdown
              targetDate={new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)}
              showDays="always"
            />
          </div>
        </div>
      </Section>

      {/* Marquee */}
      <Section title="Marquee">
        <div className="space-y-4">
          <Marquee pauseOnHover speed="normal">
            {['React 19', 'Tailwind v4', 'Radix UI', 'Framer Motion', 'TypeScript', 'Vite', 'shadcn/ui'].map((t) => (
              <span key={t} className="mx-3 rounded-full border border-border bg-muted px-4 py-1.5 text-sm font-medium">
                {t}
              </span>
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover speed="fast">
            {['Copy-Paste', 'Open Source', 'MIT License', '260+ Components', 'Production Ready'].map((t) => (
              <span key={t} className="mx-3 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                {t}
              </span>
            ))}
          </Marquee>
        </div>
      </Section>

      {/* ShimmerButton */}
      <Section title="ShimmerButton">
        <div className="flex flex-wrap gap-4">
          <ShimmerButton>Default Shimmer</ShimmerButton>
          <ShimmerButton className="bg-violet-600 text-white">Violet</ShimmerButton>
          <ShimmerButton className="bg-emerald-600 text-white">Emerald</ShimmerButton>
          <ShimmerButton onClick={() => toast.success('Shimmer clicked!')}>Click me</ShimmerButton>
        </div>
      </Section>

      {/* MorphingButton */}
      <Section title="MorphingButton">
        <MorphingButton
          buttonText="Get Notified"
          placeholder="your@email.com"
          onSubmit={(email) => toast.success(`Subscribed: ${email}`)}
        />
      </Section>

      {/* RippleButton */}
      <Section title="RippleButton">
        <div className="flex flex-wrap gap-4">
          <RippleButton variant="default">
            Click for Ripple
            <RippleButtonRipples />
          </RippleButton>
          <RippleButton variant="secondary">
            Secondary
            <RippleButtonRipples />
          </RippleButton>
          <RippleButton variant="outline">
            Outline
            <RippleButtonRipples />
          </RippleButton>
          <RippleButton variant="destructive">
            Destructive
            <RippleButtonRipples />
          </RippleButton>
        </div>
      </Section>

      {/* Dock */}
      <Section title="Dock">
        <Dock />
      </Section>

      {/* Buttons */}
      <Section title="Button">
        <div className="flex flex-wrap gap-3">
          <WmButton>Default</WmButton>
          <WmButton variant="secondary">Secondary</WmButton>
          <WmButton variant="outline">Outline</WmButton>
          <WmButton variant="ghost">Ghost</WmButton>
          <WmButton variant="destructive">Destructive</WmButton>
          <WmButton variant="link">Link</WmButton>
          <WmButton size="sm">Small</WmButton>
          <WmButton size="lg">Large</WmButton>
          <WmButton disabled>Disabled</WmButton>
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badge">
        <div className="flex flex-wrap gap-3">
          <WmBadge>Default</WmBadge>
          <WmBadge variant="secondary">Secondary</WmBadge>
          <WmBadge variant="outline">Outline</WmBadge>
          <WmBadge variant="destructive">Destructive</WmBadge>
        </div>
      </Section>

      {/* Avatar */}
      <Section title="Avatar">
        <div className="flex gap-4 items-center">
          <WmAvatar className="h-12 w-12">
            <img src="https://github.com/shadcn.png" alt="avatar" className="rounded-full" />
          </WmAvatar>
          <WmAvatar className="h-10 w-10 bg-primary text-primary-foreground flex items-center justify-center rounded-full text-sm font-bold">
            AB
          </WmAvatar>
          <WmAvatar className="h-8 w-8 bg-muted flex items-center justify-center rounded-full text-xs font-bold">
            XY
          </WmAvatar>
        </div>
      </Section>

      {/* Inputs */}
      <Section title="Input & Textarea">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-w-xl">
          <div className="space-y-2">
            <WmLabel>Text Input</WmLabel>
            <WmInput placeholder="Enter something..." />
          </div>
          <div className="space-y-2">
            <WmLabel>Select</WmLabel>
            <WmSelect>
              <SelectTrigger>
                <SelectValue placeholder="Pick an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Option A</SelectItem>
                <SelectItem value="b">Option B</SelectItem>
                <SelectItem value="c">Option C</SelectItem>
              </SelectContent>
            </WmSelect>
          </div>
          <div className="space-y-2 md:col-span-2">
            <WmLabel>Textarea</WmLabel>
            <WmTextarea placeholder="Write something..." rows={3} />
          </div>
        </div>
      </Section>

      {/* Checkbox & Switch */}
      <Section title="Checkbox & Switch">
        <div className="flex flex-wrap gap-8 items-center">
          <div className="flex items-center gap-3">
            <WmCheckbox id="c1" />
            <WmLabel htmlFor="c1">Checkbox</WmLabel>
          </div>
          <div className="flex items-center gap-3">
            <WmCheckbox id="c2" defaultChecked />
            <WmLabel htmlFor="c2">Checked</WmLabel>
          </div>
          <div className="flex items-center gap-3">
            <WmSwitch id="s1" />
            <WmLabel htmlFor="s1">Switch</WmLabel>
          </div>
          <div className="flex items-center gap-3">
            <WmSwitch id="s2" defaultChecked />
            <WmLabel htmlFor="s2">On</WmLabel>
          </div>
        </div>
      </Section>

      {/* Radio Group */}
      <Section title="RadioGroup">
        <WmRadioGroup defaultValue="opt1" className="flex gap-6">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="opt1" id="r1" />
            <WmLabel htmlFor="r1">Option 1</WmLabel>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="opt2" id="r2" />
            <WmLabel htmlFor="r2">Option 2</WmLabel>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="opt3" id="r3" />
            <WmLabel htmlFor="r3">Option 3</WmLabel>
          </div>
        </WmRadioGroup>
      </Section>

      {/* Toggle & ToggleGroup */}
      <Section title="Toggle & ToggleGroup">
        <div className="flex flex-wrap gap-6 items-center">
          <WmToggle aria-label="Bold"><Bold size={16} /></WmToggle>
          <WmToggleGroup type="multiple">
            <ToggleGroupItem value="bold"><Bold size={16} /></ToggleGroupItem>
            <ToggleGroupItem value="italic"><Italic size={16} /></ToggleGroupItem>
            <ToggleGroupItem value="underline"><Underline size={16} /></ToggleGroupItem>
          </WmToggleGroup>
          <WmToggleGroup type="single" defaultValue="left">
            <ToggleGroupItem value="left"><AlignLeft size={16} /></ToggleGroupItem>
            <ToggleGroupItem value="center"><AlignCenter size={16} /></ToggleGroupItem>
            <ToggleGroupItem value="right"><AlignRight size={16} /></ToggleGroupItem>
          </WmToggleGroup>
        </div>
      </Section>

      {/* Progress */}
      <Section title="Progress">
        <div className="space-y-3 max-w-md">
          <WmProgress value={progress} />
          <WmProgress value={30} />
          <WmProgress value={80} />
        </div>
      </Section>

      {/* Skeleton */}
      <Section title="Skeleton">
        <div className="flex items-center gap-4">
          <WmSkeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <WmSkeleton className="h-4 w-48" />
            <WmSkeleton className="h-4 w-32" />
          </div>
        </div>
      </Section>

      {/* Separator */}
      <Section title="Separator">
        <div className="space-y-4">
          <WmSeparator />
          <WmSeparator orientation="vertical" className="h-8 inline-block mx-4" />
          <WmSeparator className="bg-primary/30" />
        </div>
      </Section>

      {/* Tooltip */}
      <Section title="Tooltip">
        <TooltipProvider>
          <div className="flex gap-4">
            <WmTooltip>
              <TooltipTrigger asChild>
                <WmButton variant="outline">Hover me</WmButton>
              </TooltipTrigger>
              <TooltipContent>This is a tooltip!</TooltipContent>
            </WmTooltip>
            <WmTooltip>
              <TooltipTrigger asChild>
                <WmButton variant="secondary">Right side</WmButton>
              </TooltipTrigger>
              <TooltipContent side="right">Tooltip on the right</TooltipContent>
            </WmTooltip>
          </div>
        </TooltipProvider>
      </Section>

      {/* Accordion */}
      <Section title="Accordion">
        <WmAccordion type="single" collapsible className="max-w-lg">
          <AccordionItem value="i1">
            <AccordionTrigger>What is Watermelon UI?</AccordionTrigger>
            <AccordionContent>
              A collection of 260+ copy-pasteable React components built with Tailwind CSS and Radix UI.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="i2">
            <AccordionTrigger>How do I install a component?</AccordionTrigger>
            <AccordionContent>
              Use the shadcn CLI: <code>npx shadcn@latest add "https://registry.watermelon.sh/button.json"</code>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="i3">
            <AccordionTrigger>Is it free?</AccordionTrigger>
            <AccordionContent>Yes! Watermelon UI is open-source under the MIT license.</AccordionContent>
          </AccordionItem>
        </WmAccordion>
      </Section>

      {/* Alert */}
      <Section title="Alert">
        <div className="space-y-3 max-w-lg">
          <WmAlert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>This is a default alert with some information.</AlertDescription>
          </WmAlert>
          <WmAlert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Something went wrong. Please try again.</AlertDescription>
          </WmAlert>
        </div>
      </Section>

      {/* Breadcrumb */}
      <Section title="Breadcrumb">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="/components">Components</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Showcase</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Section>

      {/* Tabs */}
      <Section title="Tabs">
        <WmTabs defaultValue="tab1" className="max-w-md">
          <TabsList>
            <TabsTrigger value="tab1">Account</TabsTrigger>
            <TabsTrigger value="tab2">Password</TabsTrigger>
            <TabsTrigger value="tab3">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="pt-4 text-sm text-muted-foreground">Manage your account details here.</TabsContent>
          <TabsContent value="tab2" className="pt-4 text-sm text-muted-foreground">Change your password securely.</TabsContent>
          <TabsContent value="tab3" className="pt-4 text-sm text-muted-foreground">Configure your preferences.</TabsContent>
        </WmTabs>
      </Section>

      {/* Table */}
      <Section title="Table">
        <WmTable>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.role}</TableCell>
                <TableCell>
                  <WmBadge variant={row.status === 'Active' ? 'default' : 'secondary'}>{row.status}</WmBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </WmTable>
      </Section>

      {/* Cards */}
      <Section title="Card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {['Design', 'Engineering', 'Product'].map((team) => (
            <WmCard key={team}>
              <CardHeader>
                <CardTitle className="text-base">{team} Team</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Collaborate and ship faster with the {team.toLowerCase()} team.
              </CardContent>
            </WmCard>
          ))}
        </div>
      </Section>
    </div>
  )
}
