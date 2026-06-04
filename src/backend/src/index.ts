import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { config } from './config/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import { tripsRouter } from './routes/trips.js'
import { auctionsRouter } from './routes/auctions.js'
import { paymentsRouter } from './routes/payments.js'
import { ratingsRouter } from './routes/ratings.js'
import { trackingRouter } from './routes/tracking.js'

const app = express()

// Middleware
app.use(helmet())
app.use(cors({ origin: config.corsOrigin }))
app.use(morgan('combined'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Routes
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/trips', tripsRouter)
app.use('/api/v1/auctions', auctionsRouter)
app.use('/api/v1/payments', paymentsRouter)
app.use('/api/v1/ratings', ratingsRouter)
app.use('/api/v1/tracking', trackingRouter)

// 404
app.use((_, res) => res.status(404).json({ error: 'Not found' }))

// Error handler
app.use(errorHandler)

export { app }
