import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'
import { config } from './config/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import { tripsRouter } from './routes/trips.js'
import { auctionsRouter } from './routes/auctions.js'
import { paymentsRouter } from './routes/payments.js'
import { ratingsRouter } from './routes/ratings.js'
import { trackingRouter } from './routes/tracking.js'
import { trucksRouter } from './routes/trucks.js'
import { bidsRouter } from './routes/bids.js'
import { notificationsRouter } from './routes/notifications.js'
import { statsRouter } from './routes/stats.js'
import { setupWebSocket } from './websocket/index.js'

const app = express()
const server = createServer(app)

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
app.use('/api/v1/trucks', trucksRouter)
app.use('/api/v1/bids', bidsRouter)
app.use('/api/v1/notifications', notificationsRouter)
app.use('/api/v1/stats', statsRouter)

// 404
app.use((_, res) => res.status(404).json({ error: 'Not found' }))

// Error handler
app.use(errorHandler)

// WebSocket server
const wss = setupWebSocket(server)
;(global as unknown as { wss?: typeof wss }).wss = wss

// Start server
server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`)
})

export { app }
