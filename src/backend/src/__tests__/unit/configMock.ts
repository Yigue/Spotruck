/**
 * Mock compartido de config para unit tests — refleja la forma COMPLETA de
 * src/config/index.ts (un mock parcial rompe servicios como emailService,
 * que lee config.email al validar isConfigured()).
 *
 * Usar como: jest.mock('../../config/index.js', () => require('./configMock'))
 */
export const config = {
  port: 4000,
  nodeEnv: 'test',
  corsOrigin: 'http://localhost:3000',
  frontendUrl: 'http://localhost:3000',
  apiUrl: 'http://localhost:4000',
  jwt: { secret: 'test-secret', accessExpiresIn: '15m', refreshExpiresIn: '7d' },
  db: { url: 'postgresql://test' },
  redis: { url: 'redis://localhost:6379' },
  mercadopago: { accessToken: '', webhookSecret: '' },
  email: { resendApiKey: '', from: 'Spottruck <test@example.com>' },
  auction: {
    antiSnipingWindowMinutes: 5,
    antiSnipingExtensionMinutes: 2,
    minBidDecrementPercent: 0.10,
    maxExtensions: 3,
  },
  payment: { platformFeePercent: 0.08, holdDurationHours: 72 },
}
