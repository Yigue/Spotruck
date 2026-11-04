import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuthStore'
import { NotificationBell } from './notifications/NotificationBell'
import { Avatar } from './ui/Avatar'
import api from '../utils/api'

const navItems: { to: string; label: string; icon: string; driverOnly?: boolean; adminOnly?: boolean }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/trips', label: 'Viajes', icon: '🚚' },
  { to: '/auctions', label: 'Subastas', icon: '🔨' },
  { to: '/explore', label: 'Explorar', icon: '🗺️', driverOnly: true },
  { to: '/my-bids', label: 'Mis ofertas', icon: '📋', driverOnly: true },
  { to: '/admin', label: 'Verificaciones', icon: '🛡️', adminOnly: true },
  { to: '/stats', label: 'Estadísticas', icon: '📈' },
  { to: '/profile', label: 'Mi perfil', icon: '👤' },
]

const roleLabels: Record<string, string> = { COMPANY: 'Empresa', DRIVER: 'Transportista', ADMIN: 'Administrador' }

export default function Layout() {
  const { user, logout, updateUser } = useAuthStore()
  const displayName = user?.companyName || user?.email

  // Sesiones guardadas antes de que el login devolviera nombre/foto: se completan una vez
  useEffect(() => {
    if (!user || (user.companyName !== undefined && user.avatarUrl !== undefined)) return
    api
      .get('/users/me')
      .then(({ data }) => updateUser({ companyName: data.data.companyName ?? null, avatarUrl: data.data.avatarUrl ?? null }))
      .catch(() => {})
  }, [user, updateUser])
  const location = useLocation()
  const visibleNavItems = navItems.filter(
    (item) =>
      (!item.driverOnly || user?.role === 'DRIVER') && (!item.adminOnly || user?.role === 'ADMIN')
  )

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Top bar (mobile) */}
      <header className="md:hidden sticky top-0 z-40 bg-secondary-900 text-white flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold text-accent">Spottruck</h1>
        <div className="flex items-center gap-4">
          <NotificationBell compact direction="down" />
          <button
            onClick={logout}
            className="text-xs text-error hover:text-error/80 transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 bg-secondary-900 text-white flex-col">
        <div className="p-4 border-b border-secondary-500">
          <h1 className="text-xl font-bold text-accent">Spottruck</h1>
          <p className="text-xs text-secondary-500 mt-1">Plataforma de Fletes</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {visibleNavItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                location.pathname.startsWith(item.to)
                  ? 'bg-primary text-white'
                  : 'text-secondary-300 hover:bg-secondary-500 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-secondary-500">
          <div className="mb-3">
            <NotificationBell />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Avatar name={displayName} src={user?.avatarUrl ?? undefined} size="md" />
            <div className="text-sm min-w-0">
              <p className="font-medium truncate" title={displayName}>{displayName}</p>
              <p className="text-xs text-secondary-300">{roleLabels[user?.role ?? ''] ?? user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-xs text-error hover:text-error/80 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-auto">
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-secondary-900 text-white border-t border-secondary-500/30 flex justify-around">
        {visibleNavItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center gap-0.5 py-2 px-1 flex-1 text-[10px] font-medium transition-colors ${
              location.pathname.startsWith(item.to) ? 'text-accent' : 'text-secondary-300'
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
