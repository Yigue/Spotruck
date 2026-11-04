import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuthStore'
import { guideSteps } from '../utils/guideSteps'

type Audience = 'DRIVER' | 'COMPANY'

const labels: Record<Audience, string> = { DRIVER: '🚛 Soy transportista', COMPANY: '📦 Soy empresa' }

// Guía de usuario paso a paso. Pública: sirve antes y después de registrarse.
export default function GuidePage() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.user?.role)
  const [audience, setAudience] = useState<Audience>(role === 'COMPANY' ? 'COMPANY' : 'DRIVER')
  const steps = guideSteps[audience]

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="bg-secondary-900 text-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-accent">
            Spottruck
          </Link>
          <Link to={token ? '/dashboard' : '/login'} className="text-sm hover:text-accent transition-colors">
            {token ? '← Volver al panel' : 'Iniciar sesión'}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Guía de usuario</h1>
        <p className="text-text-muted mb-6">Cómo usar Spottruck, paso a paso.</p>

        <div className="inline-flex rounded-lg border border-secondary-500/30 overflow-hidden mb-8" role="tablist">
          {(['DRIVER', 'COMPANY'] as const).map((a) => (
            <button
              key={a}
              role="tab"
              aria-selected={audience === a}
              onClick={() => setAudience(a)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                audience === a ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:bg-primary-50'
              }`}
            >
              {labels[a]}
            </button>
          ))}
        </div>

        <ol className="space-y-4" aria-label={`Pasos para ${audience === 'DRIVER' ? 'transportistas' : 'empresas'}`}>
          {steps.map((s, i) => (
            <li key={s.title} className="card flex gap-4">
              <span
                className="shrink-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div>
                <h2 className="font-bold">{s.title}</h2>
                <p className="text-sm text-text-muted mt-1">{s.text}</p>
                {s.tips?.map((t) => (
                  <p key={t} className="text-xs mt-2 bg-primary-50 text-primary rounded px-2 py-1">
                    💡 {t}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ol>

        {!token && (
          <div className="text-center mt-10">
            <Link to={`/register?role=${audience}`} className="btn-accent">
              Crear mi cuenta
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
