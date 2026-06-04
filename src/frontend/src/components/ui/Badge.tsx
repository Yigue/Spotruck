import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default' | 'accent'
  children: ReactNode
  className?: string
}

const variantClasses = {
  success: 'badge badge-success',
  warning: 'badge badge-warning',
  error: 'badge badge-error',
  info: 'badge badge-info',
  default: 'badge bg-secondary-500/10 text-secondary-500',
  accent: 'badge bg-accent/10 text-accent',
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}