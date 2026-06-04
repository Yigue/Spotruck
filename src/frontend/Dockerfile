FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV VITE_API_URL=/api/v1

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json .
COPY --from=builder /app/index.html .

EXPOSE 3000
CMD ["npm", "run", "preview"]
