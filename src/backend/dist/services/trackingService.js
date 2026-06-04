"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackingService = void 0;
const prisma_js_1 = require("../models/prisma.js");
const errors_js_1 = require("../utils/errors.js");
exports.trackingService = {
    async recordPosition(tripId, lat, lng, speed, heading) {
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: tripId } });
        if (!trip)
            throw errors_js_1.errors.notFound('Trip');
        const trackingLog = await prisma_js_1.prisma.trackingLog.create({
            data: { tripId, lat, lng, speed, heading },
        });
        // If trip was ASSIGNED, move to IN_PROGRESS on first position record
        if (trip.status === 'ASSIGNED') {
            await prisma_js_1.prisma.trip.update({ where: { id: tripId }, data: { status: 'IN_PROGRESS' } });
        }
        return trackingLog;
    },
    async getCurrentPosition(tripId) {
        const log = await prisma_js_1.prisma.trackingLog.findFirst({
            where: { tripId },
            orderBy: { recordedAt: 'desc' },
        });
        if (!log)
            throw errors_js_1.errors.notFound('No tracking data for this trip');
        return log;
    },
    async getRouteHistory(tripId, limit = 100) {
        const logs = await prisma_js_1.prisma.trackingLog.findMany({
            where: { tripId },
            orderBy: { recordedAt: 'desc' },
            take: limit,
        });
        return logs;
    },
    async calculateETA(tripId) {
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: tripId } });
        if (!trip)
            throw errors_js_1.errors.notFound('Trip');
        const lastTwo = await prisma_js_1.prisma.trackingLog.findMany({
            where: { tripId },
            orderBy: { recordedAt: 'desc' },
            take: 2,
        });
        if (lastTwo.length < 2 || lastTwo[0].speed === null || lastTwo[0].speed === undefined || lastTwo[0].speed <= 0) {
            return null;
        }
        // Calculate distance from current position to destination
        const current = lastTwo[0];
        const distance = haversineDistance(current.lat, current.lng, trip.destLat, trip.destLng);
        const speedKmh = current.speed;
        if (!speedKmh || speedKmh <= 0)
            return null;
        const timeHours = distance / speedKmh;
        const etaMs = Date.now() + timeHours * 60 * 60 * 1000;
        const eta = new Date(etaMs);
        return { distanceKm: distance, eta, speedKmh };
    },
};
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function toRad(deg) {
    return deg * (Math.PI / 180);
}
//# sourceMappingURL=trackingService.js.map