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
  ratingAvg: number
  ratingCount: number
  tripsCompleted: number
  trucks?: { id: string; plate: string; type: string; capacityKg: number }[]
}

interface UserProfileModalProps {
  userId: string | null
  onClose: () => void
}

const Stars = ({ avg, count }: { avg: number; count: number }) => (
  <span className="text-warning text-sm">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={s <= Math.round(avg) ? 'text-warning' : 'text-secondary-300'}>
        ★
      </span>
    ))}
    <span className="text-text-muted ml-1">({count})</span>
  </span>
)

export function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<PublicProfile | null>(null)

  useEffect(() => {
    if (!userId) return
    setProfile(null)
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
              <p className="font-bold">{profile.companyName || 'Usuario'}</p>
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
        </div>
      )}
    </Modal>
  )
}
