import { Link } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuthStore'

export default function NotFoundPage() {
  const token = useAuthStore((s) => s.token)
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">
        <p className="text-5xl mb-2" aria-hidden="true">🛣️</p>
        <h1 className="text-xl font-bold mb-1">Página no encontrada</h1>
        <p className="text-sm text-text-muted mb-6">
          La dirección que buscás no existe o fue movida.
        </p>
        <Link to={token ? '/dashboard' : '/'} className="btn-primary inline-block">
          {token ? 'Ir al panel' : 'Volver al inicio'}
        </Link>
      </div>
    </div>
  )
}
