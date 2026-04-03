import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/watermelon-ui/alert-dialog'
import { Alert, AlertTitle, AlertDescription } from '@/components/watermelon-ui/alert'
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

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
  open, onOpenChange, title, description, onConfirm, confirmLabel = 'Confirm', variant = 'destructive',
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
type StatusAlertProps = {
  type: 'error' | 'success' | 'info'
  message: string
  title?: string
}

export function StatusAlert({ type, message, title }: StatusAlertProps) {
  if (!message) return null

  const config = {
    error: { variant: 'destructive' as const, icon: XCircle, defaultTitle: 'Error' },
    success: { variant: 'default' as const, icon: CheckCircle, defaultTitle: 'Success' },
    info: { variant: 'default' as const, icon: Info, defaultTitle: 'Info' },
  }[type]

  const Icon = config.icon

  return (
    <Alert variant={config.variant} className={type === 'success' ? 'border-green-200 bg-green-500/10 text-green-700' : type === 'info' ? 'border-blue-200 bg-blue-500/10 text-blue-700' : ''}>
      <Icon size={16} />
      <AlertTitle>{title ?? config.defaultTitle}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
