import request from 'supertest'
import { app } from '../../index'
import { prisma } from '../../models/prisma'

const API = '/api/v1'

function uniqueEmail(prefix: string) {
  return `${prefix}_${Date.now()}@test.com`
}

async function registerCompany(email: string, password = 'password123') {
  const res = await request(app).post(`${API}/auth/register`).send({
    email,
    password,
    role: 'COMPANY',
    companyName: 'Test Company',
    companyCuit: '20-12345678-1',
  })
  return res.body.data.accessToken as string
}

async function registerDriver(email: string, password = 'password123') {
  const res = await request(app).post(`${API}/auth/register`).send({
    email,
    password,
    role: 'DRIVER',
    driverLicense: 'DL-999',
    vehiclePlate: 'XYZ-999',
    vehicleType: 'CAMION',
  })
  return res.body.data.accessToken as string
}

// ─────────────────────────────────────────────
// TRIPS CRUD FLOW
// ─────────────────────────────────────────────
describe('Trips CRUD Flow', () => {
  let companyToken: string
  let driverToken: string
  let companyEmail: string
  let driverEmail: string

  beforeAll(async () => {
    companyEmail = uniqueEmail('trip_company')
    driverEmail = uniqueEmail('trip_driver')
    companyToken = await registerCompany(companyEmail)
    driverToken = await registerDriver(driverEmail)
  })

  afterAll(async () => {
    // Delete trips first to avoid FK constraint violations
    await prisma.trip.deleteMany({
      where: { user: { email: { contains: '_test.com' } } },
    })
    await prisma.user.deleteMany({
      where: { email: { contains: '_test.com' } },
    })
  })

  const validTripPayload = {
    originAddress: 'Av. Corrientes 1000, CABA',
    originLat: -34.6037,
    originLng: -58.3816,
    destAddress: 'Av. Santa Fe 2000, CABA',
    destLat: -34.5994,
    destLng: -58.4266,
    cargoType: 'GENERAL',
    cargoDesc: 'Cajas de electrónica',
    weightKg: 500,
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    basePrice: 15000,
  }

  // ─── CREATE ───
  describe('POST /trips', () => {
    it('creates a trip as a company user', async () => {
      const res = await request(app)
        .post(`${API}/trips`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send(validTripPayload)

      expect(res.status).toBe(201)
      expect(res.body.data).toMatchObject({
        originAddress: validTripPayload.originAddress,
        destAddress: validTripPayload.destAddress,
        cargoType: 'GENERAL',
        basePrice: validTripPayload.basePrice,
        status: 'DRAFT',
      })
      expect(res.body.data.id).toBeDefined()
    })

    it('returns 403 when a driver tries to create a trip', async () => {
      const res = await request(app)
        .post(`${API}/trips`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send(validTripPayload)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .post(`${API}/trips`)
        .send(validTripPayload)

      expect(res.status).toBe(401)
    })

    it('returns 400 when originAddress is missing', async () => {
      const res = await request(app)
        .post(`${API}/trips`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ ...validTripPayload, originAddress: '' })

      expect(res.status).toBe(400)
    })

    it('returns 400 when basePrice is not positive', async () => {
      const res = await request(app)
        .post(`${API}/trips`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ ...validTripPayload, basePrice: -100 })

      expect(res.status).toBe(400)
    })

    it('returns 400 for invalid cargoType', async () => {
      const res = await request(app)
        .post(`${API}/trips`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ ...validTripPayload, cargoType: 'INVALID' })

      expect(res.status).toBe(400)
    })
  })

  // ─── LIST ───
  describe('GET /trips', () => {
    it('returns paginated list of trips', async () => {
      // Create a trip first
      await request(app)
        .post(`${API}/trips`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send(validTripPayload)

      const res = await request(app)
        .get(`${API}/trips`)
        .set('Authorization', `Bearer ${companyToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toBeInstanceOf(Array)
      expect(res.body.meta).toMatchObject({
        total: expect.any(Number),
        page: 1,
        limit: 20,
      })
    })

    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).get(`${API}/trips`)
      expect(res.status).toBe(401)
    })

    it('filters by status', async () => {
      const res = await request(app)
        .get(`${API}/trips?status=DRAFT`)
        .set('Authorization', `Bearer ${companyToken}`)

      expect(res.status).toBe(200)
      for (const trip of res.body.data) {
        expect(trip.status).toBe('DRAFT')
      }
    })

    it('filters by cargoType', async () => {
      const res = await request(app)
        .get(`${API}/trips?cargoType=GENERAL`)
        .set('Authorization', `Bearer ${companyToken}`)

      expect(res.status).toBe(200)
      for (const trip of res.body.data) {
        expect(trip.cargoType).toBe('GENERAL')
      }
    })

    it('filters by price range', async () => {
      const res = await request(app)
        .get(`${API}/trips?minPrice=1000&maxPrice=20000`)
        .set('Authorization', `Bearer ${companyToken}`)

      expect(res.status).toBe(200)
      for (const trip of res.body.data) {
        expect(trip.basePrice).toBeGreaterThanOrEqual(1000)
        expect(trip.basePrice).toBeLessThanOrEqual(20000)
      }
    })

    it('respects pagination parameters', async () => {
      const res = await request(app)
        .get(`${API}/trips?page=1&limit=5`)
        .set('Authorization', `Bearer ${companyToken}`)

      expect(res.status).toBe(200)
      expect(res.body.meta.limit).toBe(5)
    })
  })

  // ─── GET ONE ───
  describe('GET /trips/:id', () => {
    let tripId: string

    beforeAll(async () => {
      const createRes = await request(app)
        .post(`${API}/trips`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send(validTripPayload)
      tripId = createRes.body.data.id
    })

    it('returns a single trip by id', async () => {
      const res = await request(app)
        .get(`${API}/trips/${tripId}`)
        .set('Authorization', `Bearer ${companyToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.id).toBe(tripId)
      expect(res.body.data.originAddress).toBeDefined()
      expect(res.body.data.user).toBeDefined()
    })

    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).get(`${API}/trips/${tripId}`)
      expect(res.status).toBe(401)
    })

    it('returns 404 for non-existent trip id', async () => {
      const res = await request(app)
        .get(`${API}/trips/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${companyToken}`)

      expect(res.status).toBe(404)
    })
  })

  // ─── UPDATE ───
  describe('PUT /trips/:id', () => {
    let tripId: string

    beforeEach(async () => {
      const createRes = await request(app)
        .post(`${API}/trips`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send(validTripPayload)
      tripId = createRes.body.data.id
    })

    it('updates a trip as the owner', async () => {
      const newDesc = 'Updated cargo description'
      const res = await request(app)
        .put(`${API}/trips/${tripId}`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ cargoDesc: newDesc })

      expect(res.status).toBe(200)
      expect(res.body.data.cargoDesc).toBe(newDesc)
    })

    it('updates basePrice', async () => {
      const res = await request(app)
        .put(`${API}/trips/${tripId}`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ basePrice: 20000 })

      expect(res.status).toBe(200)
      expect(res.body.data.basePrice).toBe(20000)
    })

    it('returns 404 when trip does not exist', async () => {
      const res = await request(app)
        .put(`${API}/trips/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ cargoDesc: 'something' })

      expect(res.status).toBe(404)
    })

    it('returns 403 when a different user tries to update', async () => {
      // Create another company
      const otherEmail = uniqueEmail('trip_other')
      const otherToken = await registerCompany(otherEmail)

      const res = await request(app)
        .put(`${API}/trips/${tripId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ cargoDesc: 'hacked!' })

      expect(res.status).toBe(403)

      await prisma.user.deleteMany({ where: { email: otherEmail } })
    })

    it('returns 400 when updating a trip not in DRAFT or OPEN status', async () => {
      // Set trip status to IN_PROGRESS via direct DB update
      await prisma.trip.update({ where: { id: tripId }, data: { status: 'IN_PROGRESS' } })

      const res = await request(app)
        .put(`${API}/trips/${tripId}`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ cargoDesc: 'should fail' })

      expect(res.status).toBe(400)
    })

    it('returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .put(`${API}/trips/${tripId}`)
        .send({ cargoDesc: 'something' })

      expect(res.status).toBe(401)
    })
  })

  // ─── DELETE ───
  describe('DELETE /trips/:id', () => {
    let tripId: string

    beforeEach(async () => {
      const createRes = await request(app)
        .post(`${API}/trips`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send(validTripPayload)
      tripId = createRes.body.data.id
    })

    it('deletes a trip as the owner', async () => {
      const res = await request(app)
        .delete(`${API}/trips/${tripId}`)
        .set('Authorization', `Bearer ${companyToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.success).toBe(true)

      // Verify it's gone
      const getRes = await request(app)
        .get(`${API}/trips/${tripId}`)
        .set('Authorization', `Bearer ${companyToken}`)
      expect(getRes.status).toBe(404)
    })

    it('returns 404 when trip does not exist', async () => {
      const res = await request(app)
        .delete(`${API}/trips/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${companyToken}`)

      expect(res.status).toBe(404)
    })

    it('returns 403 when a different user tries to delete', async () => {
      const otherEmail = uniqueEmail('trip_del_other')
      const otherToken = await registerCompany(otherEmail)

      const res = await request(app)
        .delete(`${API}/trips/${tripId}`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.status).toBe(403)

      await prisma.user.deleteMany({ where: { email: otherEmail } })
    })

    it('returns 400 when deleting a trip not in DRAFT or OPEN status', async () => {
      await prisma.trip.update({ where: { id: tripId }, data: { status: 'ASSIGNED' } })

      const res = await request(app)
        .delete(`${API}/trips/${tripId}`)
        .set('Authorization', `Bearer ${companyToken}`)

      expect(res.status).toBe(400)
    })

    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).delete(`${API}/trips/${tripId}`)
      expect(res.status).toBe(401)
    })
  })
})