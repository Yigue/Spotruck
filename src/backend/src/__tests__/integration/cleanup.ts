import { prisma } from '../../models/prisma'

// Limpia todo lo que cuelga de los usuarios de prueba, respetando el orden de
// dependencias (FK). Publicar un viaje crea su subasta, y las ofertas/pagos/
// notificaciones/valoraciones/tracking cuelgan de ahí: borrar solo los viajes
// ya no alcanza.
export async function cleanupTestUsers(emailFragment = '_test.com') {
  const users = await prisma.user.findMany({
    where: { email: { contains: emailFragment } },
    select: { id: true },
  })
  const userIds = users.map((u) => u.id)
  if (userIds.length === 0) return

  const trips = await prisma.trip.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  })
  const tripIds = trips.map((t) => t.id)

  await prisma.bid.deleteMany({
    where: { OR: [{ userId: { in: userIds } }, { auction: { tripId: { in: tripIds } } }] },
  })
  await prisma.auction.deleteMany({ where: { tripId: { in: tripIds } } })
  await prisma.payment.deleteMany({
    where: { OR: [{ userId: { in: userIds } }, { tripId: { in: tripIds } }] },
  })
  await prisma.rating.deleteMany({
    where: {
      OR: [
        { fromUserId: { in: userIds } },
        { toUserId: { in: userIds } },
        { tripId: { in: tripIds } },
      ],
    },
  })
  await prisma.trackingLog.deleteMany({ where: { tripId: { in: tripIds } } })
  await prisma.trip.deleteMany({ where: { id: { in: tripIds } } })
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.truck.deleteMany({ where: { ownerId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
}
