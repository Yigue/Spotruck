import { prisma } from '../models/prisma.js'
import { errors } from '../utils/errors.js'

export const trackingService = {
  async recordPosition(tripId: string, lat: number, lng: number, speed?: number, heading?: number) {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } })
    if (!trip) throw errors.notFound('Trip')

    const trackingLog = await prisma.trackingLog.create({
      data: { tripId, lat, lng, speed, heading },
    })

    // If trip was ASSIGNED, move to IN_PROGRESS on first position record
    if (trip.status === 'ASSIGNED') {
      await prisma.trip.update({ where: { id: tripId }, data: { status: 'IN_PROGRESS' } })
    }

    return trackingLog
  },

  async getCurrentPosition(tripId: string) {
    const log = await prisma.trackingLog.findFirst({
      where: { tripId },
      orderBy: { recordedAt: 'desc' },
    })
    if (!log) throw errors.notFound('No tracking data for this trip')
    return log
  },

  async getRouteHistory(tripId: string, limit = 100) {
    const logs = await prisma.trackingLog.findMany({
      where: { tripId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    })
    return logs
  },

  async calculateETA(tripId: string) {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } })
    if (!trip) throw errors.notFound('Trip')

    const lastTwo = await prisma.trackingLog.findMany({
      where: { tripId },
      orderBy: { recordedAt: 'desc' },
      take: 2,
    })

    if (lastTwo.length < 2 || lastTwo[0].speed === null || lastTwo[0].speed === undefined || lastTwo[0].speed <= 0) {
      return null
    }

    // Calculate distance from current position to destination
    const current = lastTwo[0]
    const distance = haversineDistance(current.lat, current.lng, trip.destLat, trip.destLng)
    const speedKmh = current.speed
    if (!speedKmh || speedKmh <= 0) return null

    const timeHours = distance / speedKmh
    const etaMs = Date.now() + timeHours * 60 * 60 * 1000
    const eta = new Date(etaMs)

    return { distanceKm: distance, eta, speedKmh }
  },
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}