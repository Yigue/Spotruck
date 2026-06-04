# Spottruck — Deployment Guide

## Requisitos del servidor

- Ubuntu 22.04 LTS
- 2 vCPU, 4GB RAM mínimo
- Docker + Docker Compose
- Nginx como reverse proxy
- SSL (Let's Encrypt con Certbot)

## 1. Preparar el servidor

```bash
# Actualizar
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose -y
```

## 2. Clonar y configurar

```bash
git clone git@github.com:Yigue/Spotruck.git
cd Spottruck
cp src/backend/.env.example src/backend/.env
# Editar valores en .env (DB, Redis, JWT secrets, email)
```

## 3. Variables de entorno necesarias

```env
DATABASE_URL="postgresql://admin:PASSWORD@postgres:5432/spottruck"
REDIS_URL="redis://redis:6379"
JWT_SECRET="<random-32-chars>"
JWT_REFRESH_SECRET="<random-32-chars>"
FRONTEND_URL="https://spottruck.example.com"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=app-password
```

## 4. Build y levanta

```bash
# Backend
cd src/backend
npm install
npx prisma migrate deploy
npm run prisma:seed   # Solo la primera vez
npm run build

# Frontend
cd ../frontend
npm install
npm run build
```

## 5. Nginx

```nginx
server {
    listen 80;
    server_name spottruck.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name spottruck.example.com;

    ssl_certificate /etc/letsencrypt/live/spottruck.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/spottruck.example.com/privkey.pem;

    # Frontend
    location / {
        root /opt/spottruck/src/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /tracking/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

## 6. SSL

```bash
sudo certbot --nginx -d spottruck.example.com
sudo systemctl enable nginx
sudo systemctl restart nginx
```

## 7. PM2 (gestión de procesos)

```bash
npm install -g pm2
cd src/backend
pm2 start dist/index.js --name spottruck-api
pm2 startup
pm2 save
```

## 8. Verificación

```bash
# API
curl https://spottruck.example.com/api/v1/auth/me

# Health check
curl https://spottruck.example.com/health
```

## Docker Compose (alternativa)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: spottruck
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  api:
    build: ./src/backend
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://admin:password@postgres:5432/spottruck
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  web:
    build: ./src/frontend
    ports:
      - "3000:80"
    depends_on:
      - api
```
