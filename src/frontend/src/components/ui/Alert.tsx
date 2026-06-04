import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  children: ReactNode
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    classes: 'bg-success/10 border-success text-success',
  },
  error: {
    icon: XCircle,
    classes: 'bg-error/10 border-error text-error',
  },
  warning: {
    icon: AlertCircle,
    classes: 'bg-warning/10 border-warning text-warning',
  },
  info: {
    icon: Info,
    classes: 'bg-primary/10 border-primary text-primary',
  },
}

export function Alert({ type = 'info', title, children }: AlertProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div className={`p-4 rounded border ${config.classes}`}>
      <div className="flex gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    </div>
  )
}