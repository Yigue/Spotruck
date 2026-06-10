import { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  className?: string
}

export function Input({
  label,
  error,
  helper,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input ${error ? 'border-error focus:ring-error' : ''}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
      {helper && !error && (
        <p className="text-xs text-secondary-500">{helper}</p>
      )}
    </div>
  )
}