import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuthStore } from '../hooks/useAuthStore'
import { whatsappLink } from '../utils/geo'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { SkeletonCard } from '../components/ui/Skeleton'
import { ProtectedFileLink } from '../components/ui/ProtectedFileLink'

type DocsStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'

interface DriverRow {
  id: string
  email: string
  companyName?: string | null
  phone?: string | null
  driverLicense?: string | null
  documentsStatus: DocsStatus
  documentsUrl: string[]
  avatarUrl?: string | null
  emailVerified: boolean
  ratingAvg: number
  ratingCount: number
  tripsCompleted: number
  createdAt: string
  trucks: {
    id: string
    plate: string
    type: string
    capacityKg: number
    senasaNumber?: string | null
    documentsUrl: string[]
  }[]
}

const TABS: { status: DocsStatus; label: string }[] = [
  { status: 'PENDING', label: 'Pendientes' },
  { status: 'APPROVED', label: 'Aprobados' },
  { status: 'REJECTED', label: 'Rechazados' },
  { status: 'NONE', label: 'Sin solicitar' },
]

const statusBadge: Record<DocsStatus, { label: string; variant: 'info' | 'success' | 'error' | 'default' }> = {
  PENDING: { label: 'En revisión', variant: 'info' },
  APPROVED: { label: 'Verificado', variant: 'success' },
  REJECTED: { label: 'Rechazado', variant: 'error' },
  NONE: { label: 'Sin solicitar', variant: 'default' },
}

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || fallback

// Cola de revisión de documentación de transportistas (solo ADMIN).
// Cierra el flujo de verificación: el transportista sube y solicita; acá se resuelve.
export default function AdminPage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<DocsStatus>('PENDING')
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<DriverRow | null>(null)
  const [rejecting, setRejecting] = useState<DriverRow | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/users/verification/summary'),
      api.get('/users', { params: { role: 'DRIVER', documentsStatus: tab, limit: 50 } }),
    ])
      .then(([summary, list]) => {
        setCounts(summary.data.data)
        setDrivers(list.data.data)
      })
      .catch(() => toast.error('No se pudo cargar la cola de verificación'))
      .finally(() => setLoading(false))
  }, [tab])

  useEffect(() => {
    if (user?.role === 'ADMIN') load()
  }, [load, user?.role])

  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />

  const decide = async (driver: DriverRow, action: 'approve' | 'reject') => {
    setBusy(true)
    try {
      await api.patch(`/users/${driver.id}/verify`, {
        action,
        note: action === 'reject' ? note.trim() : undefined,
      })
      toast.success(action === 'approve' ? 'Transportista verificado' : 'Documentación rechazada')
      setApproving(null)
      setRejecting(null)
      setNote('')
      load()
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo registrar la decisión'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Verificación de transportistas</h1>
        <p className="text-text-muted text-sm">
          Revisá la documentación y aprobá o rechazá (con el motivo, que le llega al transportista).
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.status}
            onClick={() => setTab(t.status)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.status
                ? 'bg-primary text-white'
                : 'bg-surface border border-secondary-500/20 text-text-muted hover:border-primary'
            }`}
          >
            {t.label}
            <span
              className={`ml-2 text-xs rounded-full px-1.5 py-0.5 ${
                tab === t.status ? 'bg-white/20' : 'bg-secondary-500/10'
              }`}
            >
              {counts[t.status] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : drivers.length === 0 ? (
        <EmptyState
          icon={tab === 'PENDING' ? '✅' : '🗂️'}
          title={tab === 'PENDING' ? 'No hay verificaciones pendientes' : 'No hay transportistas en esta lista'}
          description={tab === 'PENDING' ? 'Cuando un transportista solicite la verificación, aparece acá.' : undefined}
        />
      ) : (
        <div className="space-y-4">
          {drivers.map((d) => {
            const badge = statusBadge[d.documentsStatus]
            return (
              <Card key={d.id} className="space-y-4">
                <div className="flex items-start gap-3 flex-wrap">
                  <Avatar name={d.companyName || d.email} src={d.avatarUrl ?? undefined} size="lg" />
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-bold">{d.companyName || 'Sin nombre'}</p>
                    <p className="text-sm text-text-muted">
                      {d.email} {d.emailVerified ? '· ✓ email verificado' : '· ⚠ email sin verificar'}
                    </p>
                    <p className="text-xs text-text-muted">
                      Alta {new Date(d.createdAt).toLocaleDateString('es-AR')} · {d.tripsCompleted} viajes
                      {d.ratingCount > 0 && ` · ★ ${d.ratingAvg.toFixed(1)} (${d.ratingCount})`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.phone && (
                      <a
                        href={whatsappLink(d.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-success font-medium hover:underline"
                      >
                        ✆ {d.phone}
                      </a>
                    )}
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Licencia</p>
                    <p className="font-medium">{d.driverLicense || <span className="text-error">No cargada</span>}</p>

                    <p className="text-text-muted text-xs uppercase tracking-wide mt-3 mb-1">Documentos personales</p>
                    {d.documentsUrl.length === 0 ? (
                      <p className="text-text-muted">Sin archivos</p>
                    ) : (
                      <ul className="space-y-1">
                        {d.documentsUrl.map((url) => (
                          <li key={url}>
                            📄 <ProtectedFileLink url={url} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wide mb-1">
                      Camiones ({d.trucks.length})
                    </p>
                    {d.trucks.length === 0 ? (
                      <p className="text-error">Sin camiones cargados</p>
                    ) : (
                      <ul className="space-y-2">
                        {d.trucks.map((t) => (
                          <li key={t.id}>
                            <p className="font-medium">
                              🚛 {t.plate} <span className="text-text-muted">— {t.type}</span>
                            </p>
                            <p className="text-xs text-text-muted">
                              {t.capacityKg.toLocaleString('es-AR')} kg
                              {t.senasaNumber && ` · Senasa ${t.senasaNumber}`}
                            </p>
                            {t.documentsUrl.map((url) => (
                              <p key={url} className="text-xs">
                                📄 <ProtectedFileLink url={url} />
                              </p>
                            ))}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {d.documentsStatus === 'PENDING' && (
                  <div className="flex justify-end gap-3 pt-2 border-t border-secondary-500/10">
                    <Button variant="danger" onClick={() => setRejecting(d)}>
                      Rechazar
                    </Button>
                    <Button variant="primary" onClick={() => setApproving(d)}>
                      Aprobar
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!approving}
        title="¿Verificar a este transportista?"
        description={`${approving?.companyName || approving?.email} va a mostrar la insignia ✓ Verificado en su perfil y en sus ofertas.`}
        confirmLabel="Sí, verificar"
        loading={busy}
        onConfirm={() => approving && decide(approving, 'approve')}
        onCancel={() => setApproving(null)}
      />

      <Modal
        open={!!rejecting}
        onClose={() => {
          setRejecting(null)
          setNote('')
        }}
        title="Rechazar documentación"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Indicá el motivo: <span className="font-medium">{rejecting?.companyName || rejecting?.email}</span> lo
            va a recibir como notificación para poder corregirlo.
          </p>
          <textarea
            className="input"
            rows={4}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: La licencia está vencida / la foto de la cédula no se lee"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setRejecting(null)
                setNote('')
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={busy}
              disabled={note.trim().length < 5}
              onClick={() => rejecting && decide(rejecting, 'reject')}
            >
              Rechazar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
