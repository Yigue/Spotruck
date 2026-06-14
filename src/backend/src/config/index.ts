const DEV_JWT_SECRET = 'dev-secret-change-in-prod'
const isProduction = (process.env.NODE_ENV || 'development') === 'production'
const jwtSecret = process.env.JWT_SECRET || ''

if (isProduction && (!jwtSecret || jwtSecret === DEV_JWT_SECRET)) {
  throw new Error(
    'JWT_SECRET is not configured. Set a strong JWT_SECRET environment variable before starting in production.'
  )
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // URLs públicas (links en emails, back_urls y webhook de MercadoPago)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:4000',

  jwt: {
    secret: jwtSecret || DEV_JWT_SECRET,
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },

  db: {
    url: process.env.DATABASE_URL!,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  },

  mercadopago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
  },

  email: {
    // Si no hay API key, los emails se loguean por consola (modo dev)
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'Spottruck <onboarding@resend.dev>',
  },

  auction: {
    antiSnipingWindowMinutes: 5,
    antiSnipingExtensionMinutes: 2,
    minBidDecrementPercent: 0.10,
    maxExtensions: 3,
    // DUTCH: el precio baja de basePrice hacia reservePrice a lo largo de la
    // ventana de la subasta. El tick recalcula el precio según el tiempo.
    dutchTickSeconds: 15,
  },

  payment: {
    platformFeePercent: 0.08,
    holdDurationHours: 72,
  },
}
