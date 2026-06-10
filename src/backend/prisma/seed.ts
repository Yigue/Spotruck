import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Spottruck DB...')

  // Clean existing data
  await prisma.notification.deleteMany()
  await prisma.trackingLog.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.rating.deleteMany()
  await prisma.bid.deleteMany()
  await prisma.auction.deleteMany()
  await prisma.trip.deleteMany()
  await prisma.truck.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('Demo1234!', 12)

  // ─── Users ──────────────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      email: 'admin@spottruck.com',
      passwordHash,
      role: 'ADMIN',
      companyName: 'Spottruck Admin',
      emailVerified: true,
    },
  })

  const company = await prisma.user.create({
    data: {
      email: 'empresa@demo.com',
      passwordHash,
      role: 'COMPANY',
      companyName: 'Agroquímica del Litoral S.A.',
      phone: '+54 341 555 0100',
    },
  })

  const company2 = await prisma.user.create({
    data: {
      email: 'logistica@demo.com',
      passwordHash,
      role: 'COMPANY',
      companyName: 'Transportes Rosarinos',
      phone: '+54 341 555 0200',
    },
  })

  const driver1 = await prisma.user.create({
    data: {
      email: 'camionero1@demo.com',
      passwordHash,
      role: 'DRIVER',
      driverLicense: 'DNI 12345678',
      vehiclePlate: 'AB 123 CD',
      vehicleType: 'SEMIREMOLQUE',
      vehicleCapacity: 25000,
      documentsStatus: 'APPROVED', // transportista verificado de ejemplo
    },
  })

  const driver2 = await prisma.user.create({
    data: {
      email: 'camionero2@demo.com',
      passwordHash,
      role: 'DRIVER',
      driverLicense: 'DNI 23456789',
      vehiclePlate: 'EF 456 GH',
      vehicleType: 'BASCULANTE',
      vehicleCapacity: 18000,
    },
  })

  const driver3 = await prisma.user.create({
    data: {
      email: 'camionero3@demo.com',
      passwordHash,
      role: 'DRIVER',
      driverLicense: 'DNI 34567890',
      vehiclePlate: 'IJ 789 KL',
      vehicleType: 'FURGÓN',
      vehicleCapacity: 12000,
    },
  })

  console.log('✅ Users created')
  console.log('   Companies:', company.email, company2.email)
  console.log('   Drivers:', driver1.email, driver2.email, driver3.email)

  // ─── Trucks (flota por transportista) ──────────────────────────────────────
  const truck1a = await prisma.truck.create({
    data: {
      ownerId: driver1.id,
      plate: 'AB 123 CD',
      type: 'SEMI',
      capacityKg: 25000,
      preferredCargo: 'BULK',
    },
  })

  const truck1b = await prisma.truck.create({
    data: {
      ownerId: driver1.id,
      plate: 'MN 321 OP',
      type: 'JAULA',
      capacityKg: 15000,
      preferredCargo: 'GENERAL',
      senasaNumber: 'SEN-004512',
      insurance: { aseguradora: 'La Segunda', tipo: 'Carga total', monto: 5000000 },
    },
  })

  const truck2a = await prisma.truck.create({
    data: {
      ownerId: driver2.id,
      plate: 'EF 456 GH',
      type: 'BATEA',
      capacityKg: 18000,
      preferredCargo: 'BULK',
    },
  })

  const truck3a = await prisma.truck.create({
    data: {
      ownerId: driver3.id,
      plate: 'IJ 789 KL',
      type: 'FURGON',
      capacityKg: 12000,
      preferredCargo: 'REFRIGERATED',
    },
  })

  console.log('✅ Trucks created:', truck1a.plate, truck1b.plate, truck2a.plate, truck3a.plate)

  // ─── Trips ──────────────────────────────────────────────────────────────────
  const now = new Date()
  const day20 = new Date('2026-06-20T08:00:00Z')
  const day22 = new Date('2026-06-22T06:00:00Z')
  const day18 = new Date('2026-06-18T07:00:00Z')
  const day10 = new Date('2026-06-10T05:00:00Z')

  const trip1 = await prisma.trip.create({
    data: {
      userId: company.id,
      originAddress: 'Rosario, Santa Fe',
      originLat: -32.9442,
      originLng: -60.6503,
      destAddress: 'Buenos Aires, CABA',
      destLat: -34.6037,
      destLng: -58.3816,
      cargoType: 'BULK',
      cargoDesc: 'Soja en granos, 50 ton',
      weightKg: 50000,
      scheduledDate: day20,
      basePrice: 55000,
      status: 'AUCTION',
    },
  })

  const trip2 = await prisma.trip.create({
    data: {
      userId: company.id,
      originAddress: 'Venado Tuerto, Santa Fe',
      originLat: -33.6833,
      originLng: -61.9667,
      destAddress: 'Córdoba, CBA',
      destLat: -31.4201,
      destLng: -64.1888,
      cargoType: 'PALLETS',
      cargoDesc: 'Mercadería general paletizada',
      weightKg: 12000,
      scheduledDate: day22,
      basePrice: 28000,
      status: 'AUCTION',
    },
  })

  const trip3 = await prisma.trip.create({
    data: {
      userId: company.id,
      originAddress: 'Pergamino, Buenos Aires',
      originLat: -33.8900,
      originLng: -60.5700,
      destAddress: 'Mar del Plata, Buenos Aires',
      destLat: -38.0042,
      destLng: -57.5856,
      cargoType: 'GENERAL',
      cargoDesc: 'Equipamiento agrícola',
      weightKg: 8000,
      scheduledDate: day18,
      basePrice: 35000,
      status: 'DRAFT',
    },
  })

  // Trip in progress (assigned via auction)
  const trip4 = await prisma.trip.create({
    data: {
      userId: company.id,
      originAddress: 'San Miguel, Buenos Aires',
      originLat: -34.5428,
      originLng: -58.7155,
      destAddress: 'Tandil, Buenos Aires',
      destLat: -37.3215,
      destLng: -59.1333,
      cargoType: 'REFRIGERATED',
      cargoDesc: 'Productos lácteos refrigerados',
      weightKg: 6000,
      scheduledDate: day10,
      basePrice: 22000,
      status: 'IN_PROGRESS',
    },
  })

  console.log('✅ Trips created:', trip1.id, trip2.id, trip3.id, trip4.id)

  // ─── Auctions ───────────────────────────────────────────────────────────────
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  const auction1 = await prisma.auction.create({
    data: {
      tripId: trip1.id,
      type: 'OPEN',
      startTime: now,
      endTime: tomorrow,
      currentPrice: 49000,
      reservePrice: 50000,
      status: 'OPEN',
    },
  })

  const auction2 = await prisma.auction.create({
    data: {
      tripId: trip2.id,
      type: 'OPEN',
      startTime: now,
      endTime: tomorrow,
      currentPrice: 26500,
      reservePrice: 25000,
      status: 'OPEN',
    },
  })

  // Closed auction for trip4
  const auction3 = await prisma.auction.create({
    data: {
      tripId: trip4.id,
      type: 'OPEN',
      startTime: twoDaysAgo,
      endTime: yesterday,
      currentPrice: 19500,
      reservePrice: 18000,
      status: 'CLOSED',
    },
  })

  console.log('✅ Auctions created:', auction1.id, auction2.id, auction3.id)

  // ─── Bids (con camión, aclaración y estado) ─────────────────────────────────
  const bid1 = await prisma.bid.create({
    data: {
      auctionId: auction1.id,
      userId: driver1.id,
      truckId: truck1a.id,
      amount: 53000,
      note: 'Tengo factura A, vuelvo vacío de Buenos Aires',
    },
  })

  const bid2 = await prisma.bid.create({
    data: {
      auctionId: auction1.id,
      userId: driver2.id,
      truckId: truck2a.id,
      amount: 51000,
      note: 'Disponible desde el 19/06',
    },
  })

  const bid3 = await prisma.bid.create({
    data: {
      auctionId: auction1.id,
      userId: driver3.id,
      truckId: truck3a.id,
      amount: 49000,
    },
  })

  const bid4 = await prisma.bid.create({
    data: {
      auctionId: auction2.id,
      userId: driver1.id,
      truckId: truck1b.id,
      amount: 26500,
      note: 'Jaula con Senasa al día',
    },
  })

  // Closed auction bids: driver1 ganó con 19500 (coincide con el payment)
  await prisma.bid.create({
    data: { auctionId: auction3.id, userId: driver1.id, truckId: truck1a.id, amount: 19500, status: 'ACCEPTED' },
  })
  await prisma.bid.create({
    data: { auctionId: auction3.id, userId: driver2.id, truckId: truck2a.id, amount: 21000, status: 'REJECTED' },
  })

  console.log('✅ Bids created')

  // ─── Notifications ──────────────────────────────────────────────────────────
  await prisma.notification.create({
    data: {
      userId: company.id,
      type: 'NEW_BID',
      title: 'Nueva oferta en tu publicación',
      body: 'Un transportista ofreció 49000 ARS por Rosario → Buenos Aires',
      payload: { tripId: trip1.id, auctionId: auction1.id, bidId: bid3.id },
    },
  })
  await prisma.notification.create({
    data: {
      userId: driver1.id,
      type: 'BID_ACCEPTED',
      title: '¡Tu oferta fue aceptada!',
      body: 'Te asignaron el viaje San Miguel → Tandil por 19500 ARS',
      payload: { tripId: trip4.id },
      readAt: new Date(),
    },
  })

  console.log('✅ Notifications created')

  // ─── Ratings ────────────────────────────────────────────────────────────────
  await prisma.rating.create({
    data: {
      tripId: trip4.id,
      fromUserId: company.id,
      toUserId: driver1.id,
      score: 5,
      punctuality: 5,
      communication: 5,
      cargoCondition: 5,
      comment: 'Excelente servicio, muy profesional y puntual',
    },
  })

  await prisma.rating.create({
    data: {
      tripId: trip4.id,
      fromUserId: driver1.id,
      toUserId: company.id,
      score: 4,
      punctuality: 4,
      communication: 4,
      comment: 'Buena empresa, pagan en tiempo y forma',
    },
  })

  // Update driver stats
  await prisma.user.update({
    where: { id: driver1.id },
    data: { ratingAvg: 4.5, ratingCount: 1, tripsCompleted: 1 },
  })

  console.log('✅ Ratings created')

  // ─── Payments ───────────────────────────────────────────────────────────────
  await prisma.payment.create({
    data: {
      tripId: trip4.id,
      userId: driver1.id,
      amount: 19500,
      platformFee: 1950,
      netAmount: 17550,
      status: 'RELEASED',
    },
  })

  console.log('✅ Payments created')

  // ─── Tracking logs for trip4 ───────────────────────────────────────────────
  await prisma.trackingLog.create({
    data: {
      tripId: trip4.id,
      lat: -34.5428,
      lng: -58.7155,
      speed: 0,
    },
  })
  await prisma.trackingLog.create({
    data: {
      tripId: trip4.id,
      lat: -35.5,
      lng: -58.9,
      speed: 85,
    },
  })

  console.log('✅ Tracking logs created')

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed complete!\n')
  console.log('📧 Demo credentials (password: Demo1234!):')
  console.log('   empresa@demo.com     → COMPANY  (Agroquímica del Litoral)')
  console.log('   logistica@demo.com  → COMPANY  (Transportes Rosarinos)')
  console.log('   camionero1@demo.com → DRIVER   (vehicle: AB 123 CD)')
  console.log('   camionero2@demo.com → DRIVER   (vehicle: EF 456 GH)')
  console.log('   camionero3@demo.com → DRIVER   (vehicle: IJ 789 KL)')
  console.log('\n📦 Trips:')
  console.log('   trip1 → OPEN auction (Rosario → Buenos Aires, BULK, base 55000)')
  console.log('   trip2 → OPEN auction (Venado Tuerto → Córdoba, PALLETS, base 28000)')
  console.log('   trip3 → DRAFT        (Pergamino → Mar del Plata, GENERAL, base 35000)')
  console.log('   trip4 → IN_PROGRESS  (San Miguel → Tandil, REFRIGERATED, base 22000)')
  console.log('\n🔓 Para probar: login como empresa, crear auction, login como driver, hacer bid')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
