import type { Prisma } from '@prisma/client'
import { prisma } from '../models/prisma.js'

// ─── Reglas de visibilidad (una sola fuente de verdad) ──────────────────────────
//
// - ADMIN: ve todo.
// - EMPRESA: solo sus propias publicaciones (no ve las de la competencia).
// - TRANSPORTISTA: el mercado (viajes en subasta) + los viajes en los que ofertó
//   (para no perder el acceso a "mis ofertas" cuando el viaje se adjudica a otro).
// - Los borradores y viajes en curso ajenos NUNCA son visibles.

type Viewer = { id: string; role: string }

// Filtro para listar viajes. null = sin restricción (admin).
export function tripVisibilityFilter({ id, role }: Viewer): Prisma.TripWhereInput | null {
  if (role === 'ADMIN') return null
  if (role === 'DRIVER') {
    return {
      OR: [{ status: 'AUCTION' }, { auction: { is: { bids: { some: { userId: id } } } } }],
    }
  }
  return { userId: id }
}

// Filtro equivalente para listar subastas (se aplica sobre su viaje).
export function auctionVisibilityFilter(viewer: Viewer): Prisma.AuctionWhereInput | null {
  const tripFilter = tripVisibilityFilter(viewer)
  return tripFilter ? { trip: tripFilter } : null
}

export async function canViewTrip(
  trip: { id: string; userId: string; status: string },
  { id, role }: Viewer
): Promise<boolean> {
  if (role === 'ADMIN' || trip.userId === id) return true
  if (role !== 'DRIVER') return false
  if (trip.status === 'AUCTION') return true
  return (await prisma.bid.count({ where: { userId: id, auction: { tripId: trip.id } } })) > 0
}

// Seguimiento GPS: solo las partes del viaje (empresa dueña, transportista
// asignado) y el admin. La ubicación de un camión es información sensible.
export async function isTripParty(
  trip: { id: string; userId: string },
  { id, role }: Viewer
): Promise<boolean> {
  if (role === 'ADMIN' || trip.userId === id) return true
  const accepted = await prisma.bid.findFirst({
    where: { userId: id, status: 'ACCEPTED', auction: { tripId: trip.id } },
    select: { id: true },
  })
  return !!accepted
}

// Qué ve cada uno de las ofertas: el teléfono de un postulante es solo para la
// empresa dueña, y en subasta SELLADA los montos ajenos no se exponen.
export function sanitizeBidsForViewer<
  T extends { amount: unknown; user: { id: string; phone?: string | null } },
>(bids: T[], viewerId: string, isOwner: boolean, sealed: boolean) {
  if (isOwner) return bids
  return bids.map((b) =>
    b.user.id === viewerId
      ? b
      : {
          ...b,
          user: { ...b.user, phone: null },
          ...(sealed ? { amount: null, sealed: true } : {}),
        }
  )
}
