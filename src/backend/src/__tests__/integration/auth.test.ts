import request from 'supertest'
import { app } from '../../index'
import { prisma } from '../../models/prisma'

const API = '/api/v1'

// Helpers
function getAuthTokens(res: request.Response) {
  return {
    accessToken: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
  }
}

// ─────────────────────────────────────────────
// AUTH FLOW
// ─────────────────────────────────────────────
describe('Auth Flow', () => {
  const uniqueEmail = (prefix: string) => `${prefix}_${Date.now()}@test.com`

  afterAll(async () => {
    // Delete trips first to avoid FK constraint violations
    await prisma.trip.deleteMany({
      where: { user: { email: { contains: '_test.com' } } },
    })
    await prisma.user.deleteMany({
      where: { email: { contains: '_test.com' } },
    })
  })

  // REGISTER
  describe('POST /auth/register', () => {
    it('registers a new company user and returns tokens', async () => {
      const email = uniqueEmail('reg_company')
      const res = await request(app)
        .post(`${API}/auth/register`)
        .send({
          email,
          password: 'Password123',
          role: 'COMPANY',
          companyName: 'Acme SRL',
          companyCuit: '20-99999999-1',
          phone: '+549****1111',
        })

      expect(res.status).toBe(201)
      expect(res.body.data).toMatchObject({
        user: {
          email,
          role: 'COMPANY',
        },
      })
      expect(res.body.data.accessToken).toBeDefined()
      expect(res.body.data.refreshToken).toBeDefined()
    })

    it('registers a driver user', async () => {
      const email = uniqueEmail('reg_driver')
      const res = await request(app)
        .post(`${API}/auth/register`)
        .send({
          email,
          password: 'Driverpass123',
          role: 'DRIVER',
          driverLicense: 'DL-123456',
          vehiclePlate: 'ABC-123',
          vehicleType: 'CAMION',
        })

      expect(res.status).toBe(201)
      expect(res.body.data.user.role).toBe('DRIVER')
      expect(res.body.data.accessToken).toBeDefined()
    })

    it('returns 409 when email already registered', async () => {
      const email = uniqueEmail('reg_dup')
      const first = await request(app)
        .post(`${API}/auth/register`)
        .send({ email, password: 'Password123', role: 'COMPANY' })

      const dup = await request(app)
        .post(`${API}/auth/register`)
        .send({ email, password: 'Password123', role: 'COMPANY' })

      expect(first.status).toBe(201)
      expect(dup.status).toBe(409)
      expect(dup.body.error.code).toBe('CONFLICT')
    })

    it('returns 400 for invalid email', async () => {
      const res = await request(app)
        .post(`${API}/auth/register`)
        .send({ email: 'not-an-email', password: 'Password123', role: 'COMPANY' })

      expect(res.status).toBe(400)
    })

    it('returns 400 when password is too short', async () => {
      const res = await request(app)
        .post(`${API}/auth/register`)
        .send({ email: 'test@test.com', password: 'short', role: 'COMPANY' })

      expect(res.status).toBe(400)
    })
  })

  // LOGIN
  describe('POST /auth/login', () => {
    it('logs in with valid credentials and returns tokens', async () => {
      const email = uniqueEmail('login_ok')
      await request(app).post(`${API}/auth/register`).send({
        email,
        password: 'myPassword123',
        role: 'COMPANY',
        companyName: 'Login Test Co',
      })

      const res = await request(app)
        .post(`${API}/auth/login`)
        .send({ email, password: 'myPassword123' })

      expect(res.status).toBe(200)
      expect(res.body.data).toMatchObject({
        user: { email, role: 'COMPANY' },
      })
      expect(res.body.data.accessToken).toBeDefined()
      expect(res.body.data.refreshToken).toBeDefined()
    })

    it('returns 401 for wrong password', async () => {
      const email = uniqueEmail('login_wrong')
      await request(app).post(`${API}/auth/register`).send({
        email,
        password: 'correctpass',
        role: 'COMPANY',
      })

      const res = await request(app)
        .post(`${API}/auth/login`)
        .send({ email, password: 'wrongpassword' })

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 401 for non-existent email', async () => {
      const res = await request(app)
        .post(`${API}/auth/login`)
        .send({ email: 'nobody@test.com', password: 'anypass' })

      expect(res.status).toBe(401)
    })
  })

  // REFRESH TOKEN
  describe('POST /auth/refresh', () => {
    it('returns new tokens given a valid refresh token', async () => {
      const email = uniqueEmail('refresh_ok')
      const regRes = await request(app).post(`${API}/auth/register`).send({
        email,
        password: 'Password123',
        role: 'COMPANY',
      })
      const refreshToken = regRes.body.data.refreshToken

      const res = await request(app)
        .post(`${API}/auth/refresh`)
        .send({ refreshToken })

      expect(res.status).toBe(200)
      expect(res.body.data.accessToken).toBeDefined()
      expect(res.body.data.refreshToken).toBeDefined()
      expect(res.body.data.accessToken).not.toBe(refreshToken)
    })

    it('returns 401 for invalid refresh token', async () => {
      const res = await request(app)
        .post(`${API}/auth/refresh`)
        .send({ refreshToken: 'invalid.token.here' })

      expect(res.status).toBe(401)
    })

    it('returns 400 when refreshToken is missing', async () => {
      const res = await request(app)
        .post(`${API}/auth/refresh`)
        .send({})

      expect(res.status).toBe(400)
    })
  })

  // GET /auth/me
  describe('GET /auth/me', () => {
    it('returns current user data with valid token', async () => {
      const email = uniqueEmail('me_ok')
      const regRes = await request(app).post(`${API}/auth/register`).send({
        email,
        password: 'Password123',
        role: 'COMPANY',
        companyName: 'Me Test Company',
        phone: '+549****1111',
      })
      const accessToken = regRes.body.data.accessToken

      const res = await request(app)
        .get(`${API}/auth/me`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toMatchObject({
        email,
        role: 'COMPANY',
        companyName: 'Me Test Company',
      })
      expect(res.body.data.passwordHash).toBeUndefined()
    })

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get(`${API}/auth/me`)
      expect(res.status).toBe(401)
    })

    it('returns 401 when token is invalid', async () => {
      const res = await request(app)
        .get(`${API}/auth/me`)
        .set('Authorization', 'Bearer invalid.token.here')

      expect(res.status).toBe(401)
    })
  })

  // LOGOUT
  describe('POST /auth/logout', () => {
    it('returns success for authenticated user', async () => {
      const email = uniqueEmail('logout_ok')
      const regRes = await request(app).post(`${API}/auth/register`).send({
        email,
        password: 'Password123',
        role: 'COMPANY',
      })
      const accessToken = regRes.body.data.accessToken

      const res = await request(app)
        .post(`${API}/auth/logout`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.success).toBe(true)
    })

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post(`${API}/auth/logout`)
      expect(res.status).toBe(401)
    })
  })
})