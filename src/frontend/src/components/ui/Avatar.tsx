interface AvatarProps {
  name?: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : '?'

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-primary text-white flex items-center justify-center font-medium overflow-hidden ${className}`}
    >
      {src ? (
        <img src={src} alt={name || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        initial
      )}
    </div>
  )
}