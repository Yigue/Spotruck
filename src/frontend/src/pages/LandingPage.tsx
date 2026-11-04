import { Link } from 'react-router-dom'

const steps = [
  {
    icon: '📦',
    title: 'La empresa publica el viaje',
    text: 'Origen, destino, tipo de carga, fecha y precio tope. Elige el tipo de subasta que le convenga.',
  },
  {
    icon: '🚛',
    title: 'Los transportistas se postulan',
    text: 'Ofertan a la baja con su camión verificado. La empresa ve perfil, reputación y flota de cada uno.',
  },
  {
    icon: '📍',
    title: 'Seguimiento y pago seguro',
    text: 'Seguimiento GPS en vivo, pago en garantía y calificación de ambas partes al finalizar.',
  },
]

const auctionTypes = [
  { name: 'Abierta', text: 'Cada oferta debe bajar al menos 10 %. Con extensión automática anti-sniping.' },
  { name: 'Holandesa', text: 'El precio baja solo con el tiempo; gana el primero que pulsa «Tomar».' },
  { name: 'Sellada', text: 'Las ofertas son privadas: solo la empresa ve los montos.' },
]

// Portada pública (paridad con index.html / publispotruck.html del legacy)
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text">
      <header className="bg-secondary-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold text-accent">Spottruck</span>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/login" className="px-3 py-2 hover:text-accent transition-colors">
              Iniciar sesión
            </Link>
            <Link to="/register" className="btn-accent">
              Registrarse
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-secondary-900 text-white pb-16 pt-10 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">
              El flete al mejor precio, con transportistas verificados
            </h1>
            <p className="mt-4 text-secondary-300 max-w-2xl mx-auto">
              Spottruck conecta empresas con transportistas de carga de todo el país mediante subastas
              inversas en tiempo real.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/register?role=COMPANY" className="btn-accent">
                Soy una empresa
              </Link>
              <Link
                to="/register?role=DRIVER"
                className="px-4 py-2 rounded-lg border border-white/40 hover:bg-white/10 transition-colors font-medium"
              >
                Soy transportista
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-12" aria-labelledby="como-funciona">
          <h2 id="como-funciona" className="text-xl font-bold text-center mb-8">
            Cómo funciona
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="card text-center">
                <div className="text-3xl mb-2" aria-hidden="true">
                  {s.icon}
                </div>
                <h3 className="font-bold mb-1">
                  {i + 1}. {s.title}
                </h3>
                <p className="text-sm text-text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-primary-50 py-12 px-4" aria-labelledby="tipos">
          <div className="max-w-5xl mx-auto">
            <h2 id="tipos" className="text-xl font-bold text-center mb-8">
              Tres formas de subastar
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {auctionTypes.map((t) => (
                <div key={t.name} className="card">
                  <h3 className="font-bold text-primary mb-1">{t.name}</h3>
                  <p className="text-sm text-text-muted">{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center text-xs text-text-muted py-6">
        © {new Date().getFullYear()} Spottruck · Plataforma de fletes
      </footer>
    </div>
  )
}
