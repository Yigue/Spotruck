import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuthStore'
import { NotificationBell } from './notifications/NotificationBell'

const navItems: { to: string; label: string; icon: string; driverOnly?: boolean }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/trips', label: 'Viajes', icon: '🚚' },
  { to: '/auctions', label: 'Subastas', icon: '🔨' },
  { to: '/explore', label: 'Explorar', icon: '🗺️', driverOnly: true },
  { to: '/profile', label: 'Mi perfil', icon: '👤' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const visibleNavItems = navItems.filter(
    (item) => !item.driverOnly || user?.role === 'DRIVER'
  )

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary-900 text-white flex flex-col">
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
                  : 'text-secondary-500 hover:bg-secondary-500 hover:text-white'
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
          <div className="text-sm mb-2">
            <p className="font-medium">{user?.companyName || user?.email}</p>
            <p className="text-xs text-secondary-500">{user?.role}</p>
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
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
