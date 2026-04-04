import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/watermelon-ui/alert-dialog'
import { Alert, AlertTitle, AlertDescription } from '@/components/watermelon-ui/alert'
import { AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react'

export { AlertDialogTrigger }

// ── ConfirmDialog ────────────────────────────────────────────────
type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  confirmLabel?: string
  variant?: 'destructive' | 'default'
}

export function ConfirmDialog({
  open, onOpenChange, title, description,
  onConfirm, confirmLabel = 'Confirm', variant = 'destructive',
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-destructive" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === 'destructive' ? 'bg-destructive text-white hover:bg-destructive/90' : ''}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ── StatusAlert ──────────────────────────────────────────────────
type AlertType = 'error' | 'success' | 'info' | 'warning'

type StatusAlertProps = {
  type: AlertType
  message: string
  title?: string
}

const ALERT_CONFIG: Record<AlertType, {
  icon: React.ElementType
  className: string
  defaultTitle: string
}> = {
  error: {
    icon: XCircle,
    className: 'border-destructive/40 bg-destructive/10 text-destructive dark:bg-destructive/20',
    defaultTitle: 'Error',
  },
  success: {
    icon: CheckCircle2,
    className: 'border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200',
    defaultTitle: 'Success',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-yellow-500/40 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200',
    defaultTitle: 'Warning',
  },
  info: {
    icon: Info,
    className: 'border-blue-500/30 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    defaultTitle: 'Info',
  },
}

export function StatusAlert({ type, message, title }: StatusAlertProps) {
  if (!message) return null
  const { icon: Icon, className, defaultTitle } = ALERT_CONFIG[type]
  return (
    <Alert className={className}>
      <Icon size={16} />
      <AlertTitle>{title ?? defaultTitle}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
