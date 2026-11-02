"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_js_1 = require("../models/prisma.js");
const errors_js_1 = require("../utils/errors.js");
const notificationService_js_1 = require("../services/notificationService.js");
const auth_js_1 = require("../middleware/auth.js");
const upload_js_1 = require("../middleware/upload.js");
const router = (0, express_1.Router)();
exports.usersRouter = router;
// POST /users/me/request-verification — el transportista pide la revisión
// de su documentación (licencia + camiones cargados)
router.post('/me/request-verification', auth_js_1.authenticate, (0, auth_js_1.requireRole)('DRIVER'), async (req, res, next) => {
    try {
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id: req.user.sub },
            include: { _count: { select: { trucks: true } } },
        });
        if (!user)
            return next(errors_js_1.errors.notFound('User'));
        if (user.documentsStatus === 'APPROVED') {
            return next(errors_js_1.errors.badRequest('Tu documentación ya está aprobada'));
        }
        if (user.documentsStatus === 'PENDING') {
            return next(errors_js_1.errors.badRequest('Ya hay una revisión en curso'));
        }
        if (!user.driverLicense) {
            return next(errors_js_1.errors.badRequest('Cargá tu licencia de conducir en el perfil antes de solicitar la verificación'));
        }
        if (user._count.trucks === 0) {
            return next(errors_js_1.errors.badRequest('Cargá al menos un camión antes de solicitar la verificación'));
        }
        const updated = await prisma_js_1.prisma.user.update({
            where: { id: user.id },
            data: { documentsStatus: 'PENDING' },
            select: { id: true, documentsStatus: true },
        });
        res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /users/:id/verify — el admin aprueba o rechaza la documentación
router.patch('/:id/verify', auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN'), async (req, res, next) => {
    try {
        const { action, note } = zod_1.z
            .object({ action: zod_1.z.enum(['approve', 'reject']), note: zod_1.z.string().max(500).optional() })
            .parse(req.body);
        const user = await prisma_js_1.prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user)
            return next(errors_js_1.errors.notFound('User'));
        if (user.documentsStatus !== 'PENDING') {
            return next(errors_js_1.errors.badRequest('User has no pending verification'));
        }
        const documentsStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
        const updated = await prisma_js_1.prisma.user.update({
            where: { id: user.id },
            data: { documentsStatus },
            select: { id: true, documentsStatus: true },
        });
        await notificationService_js_1.notificationService.createInApp(user.id, 'DOCUMENTS_REVIEWED', action === 'approve'
            ? '✓ Tu cuenta fue verificada'
            : 'Tu documentación fue rechazada', action === 'approve'
            ? 'Tu perfil ahora muestra la insignia de transportista verificado'
            : note || 'Revisá tus datos y volvé a solicitar la verificación', { documentsStatus });
        res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
// POST /users/me/avatar — sube la foto de perfil (jpg/png/webp, ≤2MB).
// Un archivo por usuario: <userId>.<ext> bajo uploads/avatars/
router.post('/me/avatar', auth_js_1.authenticate, upload_js_1.avatarUpload.single('avatar'), async (req, res, next) => {
    try {
        if (!req.file)
            return next(errors_js_1.errors.badRequest('Subí un archivo de imagen'));
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const updated = await prisma_js_1.prisma.user.update({
            where: { id: req.user.sub },
            data: { avatarUrl },
            select: { id: true, avatarUrl: true },
        });
        res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
// POST /users/me/documents — el transportista sube su documentación de
// verificación (licencia, cédula, seguro): pdf/jpg/png, ≤5MB c/u
router.post('/me/documents', auth_js_1.authenticate, (0, auth_js_1.requireRole)('DRIVER', 'ADMIN'), upload_js_1.documentsUpload.array('documents'), async (req, res, next) => {
    try {
        const files = (req.files ?? []);
        if (files.length === 0)
            return next(errors_js_1.errors.badRequest('Subí al menos un archivo (PDF, JPG o PNG)'));
        const userId = req.user.sub;
        const newUrls = files.map((f) => `/uploads/documents/${userId}/${f.filename}`);
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id: userId },
            select: { documentsUrl: true },
        });
        if (!user)
            return next(errors_js_1.errors.notFound('User'));
        // Re-subir el mismo archivo lo pisa en disco: sin duplicados en la lista
        const documentsUrl = Array.from(new Set([...user.documentsUrl, ...newUrls]));
        const updated = await prisma_js_1.prisma.user.update({
            where: { id: userId },
            data: { documentsUrl },
            select: { id: true, documentsUrl: true },
        });
        res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
router.get('/me', auth_js_1.authenticate, async (req, res) => {
    const user = await prisma_js_1.prisma.user.findUnique({
        where: { id: req.user.sub },
        select: {
            id: true, email: true, role: true, companyName: true,
            companyCuit: true, phone: true, driverLicense: true,
            vehiclePlate: true, vehicleType: true, vehicleCapacity: true,
            preferredZone: true, emailVerified: true, documentsStatus: true,
            avatarUrl: true, documentsUrl: true,
            address: true, website: true, sector: true,
            ratingAvg: true, ratingCount: true, tripsCompleted: true,
            trustScore: true, createdAt: true,
            trucks: { where: { active: true } },
        },
    });
    if (!user) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
        return;
    }
    res.json({ data: user });
});
const updateUserSchema = zod_1.z.object({
    companyName: zod_1.z.string().optional(),
    companyCuit: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    driverLicense: zod_1.z.string().optional(),
    vehiclePlate: zod_1.z.string().optional(),
    vehicleType: zod_1.z.string().optional(),
    vehicleCapacity: zod_1.z.number().optional(),
    preferredZone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    website: zod_1.z.string().optional(),
    sector: zod_1.z.string().optional(),
});
router.put('/me', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const data = updateUserSchema.parse(req.body);
        const user = await prisma_js_1.prisma.user.update({
            where: { id: req.user.sub },
            data,
            select: { id: true, email: true, role: true, updatedAt: true },
        });
        res.json({ data: user });
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id/profile', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true, role: true, companyName: true, companyCuit: true,
                phone: true, address: true, website: true, sector: true,
                documentsStatus: true, avatarUrl: true,
                ratingAvg: true, ratingCount: true,
                tripsCompleted: true, trustScore: true, createdAt: true,
                trucks: {
                    where: { active: true },
                    select: { id: true, plate: true, type: true, capacityKg: true, preferredCargo: true },
                },
            },
        });
        if (!user)
            return next(errors_js_1.errors.notFound('User'));
        // El teléfono de una empresa es contacto comercial (visible, como en la
        // app original). El de un transportista solo lo ven empresas y admins.
        const showPhone = user.role === 'COMPANY' || ['COMPANY', 'ADMIN'].includes(req.user.role);
        res.json({ data: showPhone ? user : { ...user, phone: null } });
    }
    catch (err) {
        next(err);
    }
});
router.get('/', auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN'), async (req, res, next) => {
    try {
        const { page = '1', limit = '20', role, documentsStatus } = zod_1.z
            .object({
            page: zod_1.z.string().optional(),
            limit: zod_1.z.string().optional(),
            role: zod_1.z.enum(['COMPANY', 'DRIVER', 'ADMIN']).optional(),
            documentsStatus: zod_1.z.enum(['NONE', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
        })
            .parse(req.query);
        const where = {};
        if (role)
            where.role = role;
        if (documentsStatus)
            where.documentsStatus = documentsStatus;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const [users, total] = await Promise.all([
            prisma_js_1.prisma.user.findMany({ where, skip, take, select: { id: true, email: true, role: true, companyName: true, driverLicense: true, documentsStatus: true, ratingAvg: true, tripsCompleted: true, createdAt: true } }),
            prisma_js_1.prisma.user.count({ where }),
        ]);
        res.json({ data: users, meta: { total, page: Number(page), limit } });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=users.js.map