import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { whatsappLink } from '../../utils/geo'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { Spinner } from '../ui/Spinner'

interface PublicProfile {
  id: string
  role: string
  companyName?: string
  companyCuit?: string
  phone?: string
  address?: string
  website?: string
  sector?: string
  documentsStatus?: string
  ratingAvg: number
  ratingCount: number
  tripsCompleted: number
  trucks?: { id: string; plate: string; type: string; capacityKg: number }[]
}

interface Review {
  id: string
  score: number
  comment?: string | null
  createdAt: string
  fromUser: { id: string; companyName?: string | null; role: string }
}

interface UserProfileModalProps {
  userId: string | null
  onClose: () => void
}

const Stars = ({ avg, count, hideCount = false }: { avg: number; count: number; hideCount?: boolean }) => (
  <span className="text-warning text-sm">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={s <= Math.round(avg) ? 'text-warning' : 'text-secondary-300'}>
        ★
      </span>
    ))}
    {!hideCount && <span className="text-text-muted ml-1">({count})</span>}
  </span>
)

export function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [reviews, setReviews] = useState<Review[] | null>(null)

  useEffect(() => {
    if (!userId) return
    setProfile(null)
    setReviews(null)
    // Las opiniones de otros usuarios ayudan a elegir (paridad con la app original)
    api
      .get(`/ratings/user/${userId}`)
      .then(({ data }) => setReviews(data.data))
      .catch(() => setReviews([]))
    api
      .get(`/users/${userId}/profile`)
      .then(({ data }) => setProfile(data.data))
      .catch(() => setProfile(null))
  }, [userId])

  return (
    <Modal open={!!userId} onClose={onClose} title="Perfil">
      {!profile ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={profile.companyName} size="lg" />
            <div className="flex-1">
              <p className="font-bold">
                {profile.companyName || (profile.role === 'DRIVER' ? 'Transportista' : profile.role === 'COMPANY' ? 'Empresa' : 'Usuario')}
                {profile.documentsStatus === 'APPROVED' && (
                  <span className="ml-2 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full align-middle">
                    ✓ Verificado
                  </span>
                )}
              </p>
              <Stars avg={profile.ratingAvg} count={profile.ratingCount} />
            </div>
            {profile.phone && (
              <a
                href={whatsappLink(profile.phone)}
                target="_blank"
                rel="noreferrer"
                className="bg-success text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-success/80 transition-colors"
                title="Contactar por WhatsApp"
              >
                ✆
              </a>
            )}
          </div>

          <div className="space-y-2 text-sm">
            {profile.companyCuit && (
              <div>
                <p className="text-text-muted">CUIT</p>
                <p className="font-medium">{profile.companyCuit}</p>
              </div>
            )}
            {profile.address && (
              <div>
                <p className="text-text-muted">Ubicación</p>
                <p className="font-medium">{profile.address}</p>
              </div>
            )}
            {profile.sector && (
              <div>
                <p className="text-text-muted">Sector</p>
                <p className="font-medium">{profile.sector}</p>
              </div>
            )}
            <div>
              <p className="text-text-muted">Viajes realizados</p>
              <p className="font-medium">{profile.tripsCompleted}</p>
            </div>
            {profile.trucks && profile.trucks.length > 0 && (
              <div>
                <p className="text-text-muted">Camiones</p>
                {profile.trucks.map((t) => (
                  <p key={t.id} className="font-medium">
                    {t.plate} — {t.type} ({t.capacityKg.toLocaleString('es-AR')} kg)
                  </p>
                ))}
              </div>
            )}
          </div>

          <section aria-label="Opiniones" className="border-t border-secondary-500/10 pt-3">
            <h3 className="font-bold text-sm mb-2">Opiniones</h3>
            {reviews === null ? (
              <p className="text-sm text-text-muted">Cargando opiniones…</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-text-muted">Todavía no tiene opiniones.</p>
            ) : (
              <ul className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {reviews.slice(0, 10).map((r) => (
                  <li key={r.id} className="text-sm bg-background rounded p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Stars avg={r.score} count={0} hideCount />
                      <span className="text-xs text-text-muted">
                        {new Date(r.createdAt).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                    {r.comment && <p className="mt-1">{r.comment}</p>}
                    <p className="text-xs text-text-muted mt-1">
                      — {r.fromUser.companyName || (r.fromUser.role === 'DRIVER' ? 'Transportista' : 'Empresa')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  )
}
