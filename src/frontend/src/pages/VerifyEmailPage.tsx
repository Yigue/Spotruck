import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import { Spinner } from '../components/ui/Spinner'

// Página de destino del link "Verificar mi email" que llega por correo
export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!token) {
      setState('error')
      return
    }
    api
      .post('/auth/verify-email', { token })
      .then(() => setState('success'))
      .catch(() => setState('error'))
  }, [token])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-primary">Spottruck</h1>

        {state === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Spinner />
            <p className="text-text-muted text-sm">Verificando tu email…</p>
          </div>
        )}

        {state === 'success' && (
          <>
            <div className="text-5xl">✅</div>
            <h2 className="text-lg font-bold">¡Email verificado!</h2>
            <p className="text-sm text-text-muted">
              Tu cuenta quedó validada. Ya podés operar con normalidad.
            </p>
            <Link to="/dashboard" className="btn-primary inline-block">
              Ir al dashboard
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="text-5xl">⚠️</div>
            <h2 className="text-lg font-bold">No pudimos verificar tu email</h2>
            <p className="text-sm text-text-muted">
              El link es inválido o ya fue utilizado. Podés pedir uno nuevo desde tu perfil.
            </p>
            <Link to="/profile" className="btn-primary inline-block">
              Ir a mi perfil
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
