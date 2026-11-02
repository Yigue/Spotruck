"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tripsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const prisma_js_1 = require("../models/prisma.js");
const errors_js_1 = require("../utils/errors.js");
const notificationService_js_1 = require("../services/notificationService.js");
const paymentService_js_1 = require("../services/paymentService.js");
const mercadopagoService_js_1 = require("../services/mercadopagoService.js");
const index_js_1 = require("../websocket/index.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
exports.tripsRouter = router;
const createTripSchema = zod_1.z.object({
    originAddress: zod_1.z.string().min(1),
    originLat: zod_1.z.number().min(-90).max(90),
    originLng: zod_1.z.number().min(-180).max(180),
    originProvince: zod_1.z.string().optional(),
    originCity: zod_1.z.string().optional(),
    destAddress: zod_1.z.string().min(1),
    destLat: zod_1.z.number().min(-90).max(90),
    destLng: zod_1.z.number().min(-180).max(180),
    destProvince: zod_1.z.string().optional(),
    destCity: zod_1.z.string().optional(),
    distanceKm: zod_1.z.number().positive().optional(),
    durationMin: zod_1.z.number().int().positive().optional(),
    cargoType: zod_1.z.enum(['BULK', 'PALLETS', 'GENERAL', 'REFRIGERATED']),
    cargoDesc: zod_1.z.string().optional(),
    weightKg: zod_1.z.number().positive().optional(),
    volumeDesc: zod_1.z.string().optional(),
    scheduledDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime().optional(),
    basePrice: zod_1.z.number().positive(),
    // true = guardar como borrador (no entra en subasta todavía)
    draft: zod_1.z.boolean().optional(),
});
const updateTripSchema = createTripSchema.partial().strict();
const tripWhereSchema = zod_1.z.object({
    // Filtros validados contra los enums: un valor inválido da 400, no un 500 de Prisma
    status: zod_1.z
        .enum(['DRAFT', 'OPEN', 'AUCTION', 'ASSIGNED', 'IN_PROGRESS', 'DELIVERED', 'SETTLED', 'CANCELLED'])
        .optional(),
    cargoType: zod_1.z.enum(['BULK', 'PALLETS', 'GENERAL', 'REFRIGERATED']).optional(),
    minPrice: zod_1.z.string().optional(),
    maxPrice: zod_1.z.string().optional(),
    lat: zod_1.z.string().optional(),
    lng: zod_1.z.string().optional(),
    radius: zod_1.z.string().optional(),
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    // Wave 1: mine=true limita la lista a los viajes propios (empresa: creados;
    // transportista: asignados vía oferta aceptada). Se combina en AND con el resto.
    mine: zod_1.z.enum(['true', 'false']).optional(),
});
// GET /trips
router.get('/', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const { status, cargoType, minPrice, maxPrice, lat, lng, radius, page = '1', limit = '20', mine } = tripWhereSchema.parse(req.query);
        const where = {};
        if (mine === 'true') {
            if (req.user.role === 'DRIVER') {
                where.auction = { is: { bids: { some: { userId: req.user.sub, status: 'ACCEPTED' } } } };
            }
            else {
                where.userId = req.user.sub;
            }
        }
        if (status)
            where.status = status;
        if (cargoType)
            where.cargoType = cargoType;
        if (minPrice || maxPrice) {
            where.basePrice = {};
            if (minPrice)
                where.basePrice.gte = Number(minPrice);
            if (maxPrice)
                where.basePrice.lte = Number(maxPrice);
        }
        if (lat && lng && radius) {
            const ids = await prisma_js_1.prisma.$queryRaw `
        SELECT id FROM trips
        WHERE (
          6371 * acos(
            cos(radians(${Number(lat)})) * cos(radians(origin_lat)) *
            cos(radians(origin_lng) - radians(${Number(lng)})) +
            sin(radians(${Number(lat)})) * sin(radians(origin_lat))
          )
        ) <= ${Number(radius)}
      `;
            where.id = { in: ids.map((x) => x.id) };
        }
        const [trips, total] = await Promise.all([
            prisma_js_1.prisma.trip.findMany({
                where,
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, companyName: true, ratingAvg: true } },
                    auction: { select: { id: true, status: true, currentPrice: true, type: true, endTime: true } },
                },
            }),
            prisma_js_1.prisma.trip.count({ where }),
        ]);
        res.json({ data: trips, meta: { total, page: Number(page), limit: Number(limit) } });
    }
    catch (err) {
        next(err);
    }
});
// GET /trips/:id
router.get('/:id', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const trip = await prisma_js_1.prisma.trip.findUnique({
            where: { id: req.params.id },
            include: {
                user: { select: { id: true, companyName: true, ratingAvg: true, ratingCount: true, companyCuit: true, phone: true } },
                auction: {
                    include: {
                        bids: {
                            orderBy: { createdAt: 'desc' },
                            take: 10,
                            include: {
                                user: { select: { id: true, companyName: true, ratingAvg: true, ratingCount: true, phone: true, tripsCompleted: true, documentsStatus: true, avatarUrl: true } },
                                truck: { select: { id: true, plate: true, type: true, capacityKg: true } },
                            },
                        },
                    },
                },
                trackingLogs: { orderBy: { recordedAt: 'desc' }, take: 100 },
                ratings: { select: { fromUserId: true, toUserId: true, score: true } },
            },
        });
        if (!trip)
            return next(errors_js_1.errors.notFound('Trip'));
        // Los teléfonos de los postulantes solo los ve la empresa dueña del viaje
        const isOwner = trip.userId === req.user.sub || req.user.role === 'ADMIN';
        const data = !isOwner && trip.auction
            ? {
                ...trip,
                auction: {
                    ...trip.auction,
                    bids: trip.auction.bids.map((b) => b.user.id === req.user.sub ? b : { ...b, user: { ...b.user, phone: null } }),
                },
            }
            : trip;
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
// La publicación nace "En Subasta" (como en la app original): la subasta
// queda abierta hasta la fecha fin de la publicación (o 72h por defecto)
const DEFAULT_AUCTION_HOURS = 72;
function auctionEndTime(endDate) {
    const fallback = new Date(Date.now() + DEFAULT_AUCTION_HOURS * 60 * 60 * 1000);
    return endDate && endDate > new Date() ? endDate : fallback;
}
// POST /trips — crea la publicación y abre la subasta en la misma transacción.
// Con draft=true queda en borrador (sin subasta) para publicar después.
router.post('/', auth_js_1.authenticate, (0, auth_js_1.requireRole)('COMPANY', 'ADMIN'), async (req, res, next) => {
    try {
        const { draft, ...data } = createTripSchema.parse(req.body);
        const trip = await prisma_js_1.prisma.$transaction(async (tx) => {
            const created = await tx.trip.create({
                data: {
                    ...data,
                    userId: req.user.sub,
                    scheduledDate: new Date(data.scheduledDate),
                    endDate: data.endDate ? new Date(data.endDate) : undefined,
                    status: draft ? 'DRAFT' : 'AUCTION',
                },
            });
            if (!draft) {
                await tx.auction.create({
                    data: {
                        tripId: created.id,
                        type: 'OPEN',
                        startTime: new Date(),
                        endTime: auctionEndTime(created.endDate),
                        reservePrice: new client_1.Prisma.Decimal(created.basePrice).mul(0.9).toDecimalPlaces(2),
                        currentPrice: created.basePrice,
                        status: 'OPEN',
                    },
                });
            }
            return created;
        });
        const withAuction = await prisma_js_1.prisma.trip.findUnique({
            where: { id: trip.id },
            include: { auction: { select: { id: true, status: true, endTime: true } } },
        });
        res.status(201).json({ data: withAuction });
    }
    catch (err) {
        next(err);
    }
});
// POST /trips/:id/publish — publica un borrador: abre la subasta
router.post('/:id/publish', auth_js_1.authenticate, (0, auth_js_1.requireRole)('COMPANY', 'ADMIN'), async (req, res, next) => {
    try {
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: req.params.id } });
        if (!trip)
            return next(errors_js_1.errors.notFound('Trip'));
        if (trip.userId !== req.user.sub && req.user.role !== 'ADMIN') {
            return next(errors_js_1.errors.forbidden('Not your trip'));
        }
        if (trip.status !== 'DRAFT')
            return next(errors_js_1.errors.badRequest('Only DRAFT trips can be published'));
        const [updated] = await prisma_js_1.prisma.$transaction([
            prisma_js_1.prisma.trip.update({ where: { id: trip.id }, data: { status: 'AUCTION' } }),
            prisma_js_1.prisma.auction.create({
                data: {
                    tripId: trip.id,
                    type: 'OPEN',
                    startTime: new Date(),
                    endTime: auctionEndTime(trip.endDate),
                    reservePrice: new client_1.Prisma.Decimal(trip.basePrice).mul(0.9).toDecimalPlaces(2),
                    currentPrice: trip.basePrice,
                    status: 'OPEN',
                },
            }),
        ]);
        res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
// POST /trips/:id/cancel — la empresa cancela la publicación
router.post('/:id/cancel', auth_js_1.authenticate, (0, auth_js_1.requireRole)('COMPANY', 'ADMIN'), async (req, res, next) => {
    try {
        const trip = await prisma_js_1.prisma.trip.findUnique({
            where: { id: req.params.id },
            include: { auction: true }
        });
        if (!trip)
            return next(errors_js_1.errors.notFound('Trip'));
        if (trip.userId !== req.user.sub && req.user.role !== 'ADMIN') {
            return next(errors_js_1.errors.forbidden('Not your trip'));
        }
        if (['IN_PROGRESS', 'DELIVERED', 'SETTLED', 'CANCELLED'].includes(trip.status)) {
            return next(errors_js_1.errors.badRequest('Cannot cancel trip in current status'));
        }
        await prisma_js_1.prisma.$transaction(async (tx) => {
            // 1. Cancel the trip
            await tx.trip.update({ where: { id: trip.id }, data: { status: 'CANCELLED' } });
            if (trip.auction) {
                // 2. Cancel auction
                await tx.auction.update({ where: { id: trip.auction.id }, data: { status: 'CANCELLED' } });
                // 3. Reject all pending/accepted bids
                await tx.bid.updateMany({
                    where: { auctionId: trip.auction.id, status: { in: ['PENDING', 'ACCEPTED'] } },
                    data: { status: 'REJECTED' }
                });
            }
            // 4. Refund held payment if any (trip was ASSIGNED)
            if (trip.status === 'ASSIGNED') {
                const payment = await tx.payment.findFirst({
                    where: { tripId: trip.id, status: 'HELD' }
                });
                if (payment) {
                    await tx.payment.update({
                        where: { id: payment.id },
                        data: { status: 'REFUNDED' }
                    });
                    // In a real scenario, trigger MercadoPago refund API here
                }
            }
        });
        const updated = await prisma_js_1.prisma.trip.findUnique({ where: { id: trip.id } });
        (0, index_js_1.broadcastToTrip)(trip.id, { type: 'trip_update', status: 'CANCELLED' });
        res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
// PUT /trips/:id
router.put('/:id', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: req.params.id } });
        if (!trip)
            return next(errors_js_1.errors.notFound('Trip'));
        if (trip.userId !== req.user.sub && req.user.role !== 'ADMIN') {
            return next(errors_js_1.errors.forbidden());
        }
        if (!['DRAFT', 'OPEN'].includes(trip.status)) {
            return next(errors_js_1.errors.badRequest('Cannot edit trip in current status'));
        }
        const { draft: _draft, ...data } = updateTripSchema.parse(req.body);
        const updated = await prisma_js_1.prisma.trip.update({
            where: { id: req.params.id },
            data: {
                ...data,
                scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
            },
        });
        res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /trips/:id
router.delete('/:id', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: req.params.id } });
        if (!trip)
            return next(errors_js_1.errors.notFound('Trip'));
        if (trip.userId !== req.user.sub && req.user.role !== 'ADMIN') {
            return next(errors_js_1.errors.forbidden());
        }
        if (!['DRAFT', 'OPEN'].includes(trip.status)) {
            return next(errors_js_1.errors.badRequest('Cannot delete trip in current status'));
        }
        await prisma_js_1.prisma.trip.delete({ where: { id: req.params.id } });
        res.json({ data: { success: true } });
    }
    catch (err) {
        next(err);
    }
});
// ─── Transiciones de estado del viaje (stepper de la app original) ───────────
// ASSIGNED (Preparando) → IN_PROGRESS (En viaje) → DELIVERED (Esperando
// confirmación) → SETTLED (Finalizada). El transportista avanza los dos
// primeros pasos y la empresa confirma el último.
async function getAssignedDriverId(tripId) {
    const acceptedBid = await prisma_js_1.prisma.bid.findFirst({
        where: { auction: { tripId }, status: 'ACCEPTED' },
        select: { userId: true },
    });
    return acceptedBid?.userId ?? null;
}
// POST /trips/:id/start — el transportista asignado empieza el viaje
router.post('/:id/start', auth_js_1.authenticate, (0, auth_js_1.requireRole)('DRIVER'), async (req, res, next) => {
    try {
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: req.params.id } });
        if (!trip)
            return next(errors_js_1.errors.notFound('Trip'));
        if (trip.status !== 'ASSIGNED')
            return next(errors_js_1.errors.badRequest('Trip must be ASSIGNED to start'));
        const driverId = await getAssignedDriverId(trip.id);
        if (driverId !== req.user.sub)
            return next(errors_js_1.errors.forbidden('You are not assigned to this trip'));
        const updated = await prisma_js_1.prisma.trip.update({ where: { id: trip.id }, data: { status: 'IN_PROGRESS' } });
        await notificationService_js_1.notificationService.createInApp(trip.userId, 'TRIP_STATE', 'El transportista empezó el viaje', `${trip.originAddress} → ${trip.destAddress}`, { tripId: trip.id, status: 'IN_PROGRESS' });
        (0, index_js_1.broadcastToTrip)(trip.id, { type: 'trip_update', status: 'IN_PROGRESS' });
        res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
// POST /trips/:id/finish — el transportista marca el viaje como terminado
router.post('/:id/finish', auth_js_1.authenticate, (0, auth_js_1.requireRole)('DRIVER'), async (req, res, next) => {
    try {
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: req.params.id } });
        if (!trip)
            return next(errors_js_1.errors.notFound('Trip'));
        if (trip.status !== 'IN_PROGRESS')
            return next(errors_js_1.errors.badRequest('Trip must be IN_PROGRESS to finish'));
        const driverId = await getAssignedDriverId(trip.id);
        if (driverId !== req.user.sub)
            return next(errors_js_1.errors.forbidden('You are not assigned to this trip'));
        const updated = await prisma_js_1.prisma.trip.update({ where: { id: trip.id }, data: { status: 'DELIVERED' } });
        await notificationService_js_1.notificationService.createInApp(trip.userId, 'TRIP_STATE', 'El transportista terminó el viaje', 'Confirmá la entrega para finalizar y liberar el pago', { tripId: trip.id, status: 'DELIVERED' });
        (0, index_js_1.broadcastToTrip)(trip.id, { type: 'trip_update', status: 'DELIVERED' });
        res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
// POST /trips/:id/confirm-delivery — la empresa confirma la entrega y se
// libera el pago al transportista
router.post('/:id/confirm-delivery', auth_js_1.authenticate, (0, auth_js_1.requireRole)('COMPANY', 'ADMIN'), async (req, res, next) => {
    try {
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: req.params.id } });
        if (!trip)
            return next(errors_js_1.errors.notFound('Trip'));
        if (trip.userId !== req.user.sub && req.user.role !== 'ADMIN') {
            return next(errors_js_1.errors.forbidden('Not your trip'));
        }
        if (trip.status !== 'DELIVERED')
            return next(errors_js_1.errors.badRequest('Trip must be DELIVERED to confirm'));
        // Con MercadoPago activo, la empresa no puede finalizar el viaje si el
        // pago sigue pendiente: el transportista quedaría sin cobrar
        const pendingPayment = await prisma_js_1.prisma.payment.findFirst({
            where: { tripId: trip.id, status: 'PENDING' },
        });
        if (pendingPayment && mercadopagoService_js_1.mercadopagoService.isConfigured()) {
            return next(errors_js_1.errors.badRequest('El pago del viaje está pendiente: pagalo con MercadoPago antes de confirmar la entrega'));
        }
        const payment = await prisma_js_1.prisma.payment.findFirst({
            where: { tripId: trip.id, status: 'HELD' },
        });
        if (payment) {
            // releasePayment también pasa el viaje a SETTLED
            await paymentService_js_1.paymentService.releasePayment(payment.id);
        }
        else {
            await prisma_js_1.prisma.trip.update({ where: { id: trip.id }, data: { status: 'SETTLED' } });
        }
        const driverId = await getAssignedDriverId(trip.id);
        if (driverId) {
            await prisma_js_1.prisma.user.update({
                where: { id: driverId },
                data: { tripsCompleted: { increment: 1 } },
            });
            await notificationService_js_1.notificationService.createInApp(driverId, 'TRIP_STATE', 'La empresa confirmó la entrega', 'El viaje finalizó. ¡No te olvides de valorar a la empresa!', { tripId: trip.id, status: 'SETTLED' });
        }
        (0, index_js_1.broadcastToTrip)(trip.id, { type: 'trip_update', status: 'SETTLED' });
        const updated = await prisma_js_1.prisma.trip.findUnique({ where: { id: trip.id } });
        res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=trips.js.map