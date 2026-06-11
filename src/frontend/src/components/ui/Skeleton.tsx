// Placeholder de carga con pulso (skeleton), según el design system del SPEC
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-secondary-500/10 rounded ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-1/3" />
    </div>
  )
}
