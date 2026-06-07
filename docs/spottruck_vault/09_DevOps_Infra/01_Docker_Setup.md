# Configuración de Docker para Spottruck

## Índice

1. [Introducción](#introducción)
2. [Arquitectura de Contenedores](#arquitectura-de-contenedores)
3. [Dockerfile Multi-Etapa](#dockerfile-multi-etapa)
4. [Configuración de Docker Compose](#configuración-de-docker-compose)
5. [Variables de Entorno y Secrets](#variables-de-entorno-y-secrets)
6. [Redes Docker](#redes-docker)
7. [Volúmenes y Persistencia de Datos](#volúmenes-y-persistencia-de-datos)
8. [Seguridad en Contenedores](#seguridad-en-contenedores)
9. [Optimización de Imágenes](#optimización-de-imágenes)
10. [Best Practices y Recomendaciones](#best-practices-y-recomendaciones)
11. [Comandos Útiles de Docker](#comandos-útiles-de-docker)

---

## Introducción

Spottruck es una plataforma integral de gestión de flotas de transporte que requiere una infraestructura robusta, escalable y mantenible. Docker se ha convertido en el estándar de facto para la containerización de aplicaciones modernas, ofreciendo beneficios significativos en términos de portabilidad, consistencia entre entornos, aislamiento de servicios y eficiencia en el uso de recursos.

Este documento describe exhaustivamente la configuración de Docker para Spottruck, incluyendo la arquitectura de contenedores recomendada, los Dockerfiles optimizados, la configuración de Docker Compose para todos los servicios, las políticas de seguridad implementadas y las mejores prácticas operativas que deben seguirse en todos los entornos de desarrollo, staging y producción.

La adopción de contenedores Docker para Spottruck permite que el equipo de desarrollo trabaje con entornos idénticos desde la fase de programación hasta el despliegue en producción, eliminando el clásico problema de "funciona en mi máquina". Además, facilita la implementación de arquitecturas de microservicios, el escalado dinámico de componentes individuales y la integración continua con pipelines de CI/CD.

---

## Arquitectura de Contenedores

### Visión General de Servicios

Spottruck se compone de múltiples servicios que trabajan en conjunto para proporcionar una plataforma completa de gestión de flotas. La arquitectura de contenedores está diseñada siguiendo el patrón de microservicios, donde cada componente principal de la aplicación reside en su propio contenedor con responsabilidades claramente definidas.

El núcleo de Spottruck está formado por los siguientes servicios principales:

**API Backend (Node.js/Express o Python/FastAPI)**: Este es el servicio central que maneja toda la lógica de negocio de la aplicación. Gestiona las operaciones de CRUD para vehículos, conductores, rutas y viajes. Expone una API RESTful que el frontend consume para todas las operaciones de la plataforma.

**Frontend (React/Vue.js)**: La interfaz de usuario de Spottruck se sirve como una aplicación web de página única (SPA). El contenedor del frontend sirve los archivos estáticos y se comunica con el API backend para todas las operaciones que requieren datos del servidor.

**Base de Datos PostgreSQL**: El almacenamiento principal de Spottruck utiliza PostgreSQL como sistema de gestión de base de datos relacional. PostgreSQL proporciona la robustez, integridad referencial y soporte para consultas complejas que una aplicación de gestión de flotas necesita.

**Redis Cache**: Se utiliza Redis como caché de aplicación y broker de mensajes para operaciones asíncronas. Redis mejora significativamente el rendimiento de la aplicación al cachear consultas frecuentes a la base de datos y permitir la comunicación entre servicios mediante patrones de pub/sub.

**Nginx como Reverse Proxy**: Nginx actúa como punto de entrada único para todo el tráfico externo. Gestiona el enrutamiento de solicitudes al frontend y al backend según la ruta solicitada, proporciona terminación SSL/TLS y sirve como balanceador de carga básico.

### Diagrama de Arquitectura

La arquitectura de red de Docker para Spottruck se organiza en dos redes virtuales separadas: una red pública para el tráfico externo que pasa por Nginx, y una red interna que conecta los servicios backend con la base de datos y Redis. Esta separación sigue el principio de mínimo privilegio y mejora la postura de seguridad de la aplicación.

---

## Dockerfile Multi-Etapa

### Backend Dockerfile

El Dockerfile del backend de Spottruck utiliza la técnica de construcción multi-etapa para producir imágenes finales pequeñas y seguras. El proceso de construcción comienza con una imagen completa de Node.js o Python que contiene todas las herramientas de compilación necesarias, y termina con una imagen base mínima que solo incluye el runtime necesario para ejecutar la aplicación.

```dockerfile
# Etapa 1: Construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias primero para aprovechar caché de Docker
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Compilar TypeScript si es necesario
RUN npm run build

# Etapa 2: Producción
FROM node:20-alpine AS production

WORKDIR /app

# Crear usuario no root para seguridad
RUN addgroup -g 1001 -S nodejs && adduser -S spottruck -u 1001

# Copiar solo los archivos necesarios del builder
COPY --from=builder --chown=spottruck:nodejs /app/dist ./dist
COPY --from=builder --chown=spottruck:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=spottruck:nodejs /app/package.json ./package.json

# Cambiar a usuario no root
USER spottruck

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Comando de inicio
CMD ["node", "dist/index.js"]
```

### Frontend Dockerfile

El Dockerfile del frontend sigue un patrón similar de multi-etapa, comenzando con una imagen de compilación que incluye todas las dependencias necesarias para construir la aplicación React o Vue.js, y terminando con una imagen Nginx que sirve los archivos estáticos resultantes.

```dockerfile
# Etapa 1: Construcción
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Servidor de archivos estáticos
FROM nginx:alpine AS production

# Copiar configuración de Nginx personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos estáticos del builder
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Health check para Nginx
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## Configuración de Docker Compose

### Servicios Principales

El archivo docker-compose.yml define todos los servicios de Spottruck, sus configuraciones de red, volúmenes y dependencias. Esta configuración permite que toda la aplicación se ejecute con un solo comando, facilitando tanto el desarrollo local como los despliegues en servidores.

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: spottruck-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    networks:
      - public
    depends_on:
      - api
      - frontend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: spottruck-frontend
    networks:
      - public
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: spottruck-api
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://spottruck:${DB_PASSWORD}@postgres:5432/spottruck
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - API_PORT=3000
    networks:
      - backend
      - public
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    container_name: spottruck-postgres
    environment:
      - POSTGRES_USER=spottruck
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=spottruck
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
    networks:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U spottruck -d spottruck"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: spottruck-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  public:
    driver: bridge
  backend:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### Archivo de Variables de Entorno

El archivo `.env` contiene todas las variables sensibles necesarias para la configuración de los servicios. Este archivo nunca debe incluirse en el control de versiones y debe existir exclusivamente en el servidor de despliegue.

```bash
# Base de datos
DB_PASSWORD=YourSecureDatabasePassword123!

# Redis
REDIS_PASSWORD=YourSecureRedisPassword456!

# JWT
JWT_SECRET=YourSuperSecureJWTSecretKey789!

# Dominio
DOMAIN=spottruck.example.com

# Certificados SSL (rutas locales)
SSL_CERT_PATH=./nginx/ssl/fullchain.pem
SSL_KEY_PATH=./nginx/ssl/privkey.pem
```

---

## Variables de Entorno y Secrets

### Gestión de Secrets en Producción

En entornos de producción, es fundamental nunca almacenar secrets en variables de entorno que puedan ser accedidas fácilmente. Docker ofrece varias estrategias para la gestión segura de secretos sensibles.

**Docker Secrets**: Para despliegues con Docker Swarm, se recomienda utilizar Docker Secrets para almacenar credenciales de base de datos, claves API y tokens de autenticación. Los secrets se cifran en tránsito y en reposo, y solo se exponen a los contenedores que los necesitan mediante un sistema de archivos temporal.

**Kubernetes Secrets o Vault**: En entornos Kubernetes, se utilizan las primitivas de secrets nativas o se integra con soluciones como HashiCorp Vault para una gestión centralizada de credenciales con rotación automática y auditoria de accesos.

**Archivos .env para Desarrollo**: En entornos de desarrollo local, el archivo `.env` con permisos restrictivos (chmod 600) es aceptable. Nunca se debe hacer commit de este archivo al repositorio.

### Variables de Entorno No Sensibles

Las variables de entorno no sensibles que pueden ser versionadas de manera segura incluyen configuraciones de comportamiento de la aplicación como niveles de logging, flags de features, URLs de servicios externos que no requieren autenticación y configuraciones regionales.

---

## Redes Docker

### Aislamiento de Redes

La arquitectura de red de Spottruck implementa dos redes Docker separadas que proporcionan aislamiento logical entre componentes.

**Red Pública (public)**: Esta red conecta Nginx con los servicios que necesitan ser alcanzables desde el exterior: el frontend y el API backend. Nginx actúa como el único punto de entrada a esta red, lo que permite controlar y monitorear todo el tráfico entrante.

**Red Backend (backend)**: Esta red privada conecta exclusivamente el API backend con PostgreSQL y Redis. Los servicios en esta red no son alcanzables desde el exterior, lo que añade una capa de seguridad adicional para los datos sensibles almacenados en la base de datos.

### Configuración de DNS

Docker proporciona resolución DNS automática entre contenedores dentro de la misma red. Los servicios pueden referirse entre sí utilizando los nombres definidos en el archivo docker-compose.yml. Por ejemplo, el contenedor de la API puede conectar a PostgreSQL usando la URL `postgresql://postgres:5432/spottruck`.

---

## Volúmenes y Persistencia de Datos

### Volúmenes para Base de Datos

El volumen `postgres_data` monta en `/var/lib/postgresql/data` dentro del contenedor PostgreSQL. Este volumen almacena todos los archivos de la base de datos incluyendo tablas, índices, logs de transacciones y configuraciones. La persistencia de este volumen es crítica para la operación de Spottruck, ya que contiene todos los datos de vehículos, conductores, rutas y viajes.

### Volúmenes para Caché Redis

El volumen `redis_data` se monta en `/data` dentro del contenedor Redis. Redis está configurado con persistencia AOF (Append Only File) que asegura que los datos en caché sobrevivan a reinicios del contenedor. Aunque Redis es principalmente una base de datos en memoria, tener esta persistencia mejora los tiempos de reinicio de la aplicación.

### Scripts de Inicialización

La carpeta `./init-scripts` se monta en `/docker-entrypoint-initdb.d` del contenedor PostgreSQL. Los scripts SQL放置 en esta carpeta se ejecutan automáticamente cuando el contenedor se inicia por primera vez, permitiendo crear esquemas de base de datos, tablas iniciales, índices y datos de seed necesarios para la aplicación.

---

## Seguridad en Contenedores

### Usuario No Root

Todos los contenedores de Spottruck se ejecutan con usuarios no root siguiendo el principio de mínimo privilegio. El Dockerfile del backend crea un usuario `spottruck` con UID 1001 y el frontend utiliza el usuario `nginx` que viene por defecto en la imagen oficial. Esto limita significativamente el impacto de posibles vulnerabilidades que permitan la ejecución de código malicioso.

### Actualizaciones de Seguridad

Las imágenes base utilizadas en los Dockerfiles se seleccionan cuidadosamente para garantizar que reciban actualizaciones de seguridad oportunas. Las imágenes `alpine` son preferidas cuando están disponibles debido a su superficie de ataque reducida. Un proceso de actualización regular debe verificar y aplicar actualizaciones de seguridad a las imágenes base mensualmente.

### Análisis de Vulnerabilidades

Se recomienda integrar herramientas de análisis de vulnerabilidades en el pipeline de CI/CD que escaneen las imágenes Docker antes de su despliegue. Herramientas como Trivy, Clair o Snyk pueden identificar vulnerabilidades conocidas en el sistema operativo y las dependencias de aplicación de las imágenes.

### Configuración de Recursos

Limitar los recursos de CPU y memoria que cada contenedor puede utilizar previene que un contenedor mal configurado o comprometido afecte a otros servicios en el mismo host. Las configuraciones de `deploy.resources.limits` en docker-compose.yml establecen estos límites.

---

## Optimización de Imágenes

### Uso de Multi-Stage Builds

Los Dockerfiles multi-etapa descritos anteriormente son una de las técnicas más efectivas para reducir el tamaño de las imágenes finales. Al separar el entorno de compilación del entorno de producción, las dependencias de desarrollo y herramientas de compilación nunca se incluyen en la imagen final.

### Capas de Docker y Caché

La orden de las instrucciones en el Dockerfile afecta directamente la eficiencia del caché de Docker. Las instrucciones que cambian con menor frecuencia, como la copia de archivos de dependencias (`package*.json`), se colocan antes que las instrucciones que cambian frecuentemente. Esto permite que Docker reutilice capas en caché cuando solo cambia el código de la aplicación.

### Imágenes Base Alpine

Las imágenes basadas en Alpine Linux son significativamente más pequeñas que sus contrapartes basadas en distribuciones completas. Alpine usa musl libc y busybox, resultando en imágenes base de aproximadamente 5MB comparadas con los 100MB+ de imágenes basadas en Debian o Ubuntu.

### Minimizar Capas

Cada instrucción RUN, COPY y ADD en un Dockerfile crea una nueva capa. Consolidar comandos relacionados en una sola instrucción RUN reduce el número de capas y por lo tanto el tamaño total de la imagen. El uso de operadores `&&` para encadenar comandos y `\` para continuar en la siguiente línea mantiene los Dockerfiles legibles sin sacrificar eficiencia.

---

## Best Practices y Recomendaciones

### Health Checks

Todos los contenedores de Spottruck implementan health checks que permiten a Docker monitorear el estado de salud de cada servicio. Los health checks se configuran con intervalos, timeouts y reintentos apropiados para cada tipo de servicio. El health check del API verifica el endpoint `/health`, mientras que PostgreSQL utiliza el comando `pg_isready`.

### Restart Policies

Las políticas de reinicio automático (`restart: unless-stopped`) aseguran que los servicios se recuperen automáticamente después de fallos del sistema o reinicios del daemon de Docker. La política `unless-stopped` reinicia los contenedores a menos que hayan sido explícitamente detenidos por un administrador.

### Logging

La configuración de logging limita el tamaño de los archivos de log y el número de archivos rotados para evitar que los logs consuman todo el espacio en disco disponible. Esta configuración se especifica en el archivo docker-compose.yml mediante la sección `logging`.

### Monitoreo

Integrar el monitoreo de contenedores mediante Prometheus y Grafana proporciona visibilidad sobre el rendimiento y salud de todos los servicios. Métricas como uso de CPU, memoria, red y disco deben ser coleccionadas y alarmadas apropiadamente.

---

## Comandos Útiles de Docker

### Construcción de Imágenes

Para construir las imágenes de todos los servicios de Spottruck, ejecute el siguiente comando desde el directorio raíz del proyecto donde se encuentra el archivo docker-compose.yml:

```bash
docker-compose build
```

Para reconstruir una imagen específica sin usar caché:

```bash
docker-compose build --no-cache <nombre-servicio>
```

### Inicio y Detención de Servicios

Iniciar todos los servicios en modo separado (background):

```bash
docker-compose up -d
```

Ver los logs de todos los servicios:

```bash
docker-compose logs -f
```

Ver los logs de un servicio específico:

```bash
docker-compose logs -f api
```

Detener todos los servicios sin eliminar los contenedores:

```bash
docker-compose stop
```

Detener y eliminar todos los contenedores, redes y volúmenes:

```bash
docker-compose down -v
```

### Operaciones de Mantenimiento

Reiniciar un servicio específico:

```bash
docker-compose restart api
```

Acceder a la terminal de un contenedor:

```bash
docker-compose exec api sh
```

Ejecutar comandos dentro del contexto del servicio (por ejemplo, migraciones de base de datos):

```bash
docker-compose exec api npm run migrate
```

Ver el estado de todos los servicios:

```bash
docker-compose ps
```

Inspeccionar recursos utilizados por los servicios:

```bash
docker-compose top
```

### Escalado

Escalar el servicio de API a múltiples instancias para balanceo de carga:

```bash
docker-compose up -d --scale api=3
```

Nota: El escalado requiere configuración adicional de Nginx como balanceador de carga para distribuir el tráfico entre las instancias.

---

## Conclusión

La configuración de Docker para Spottruck descrita en este documento proporciona una base sólida para el desarrollo, pruebas y despliegue de la aplicación. Siguiendo estas prácticas y recomendaciones, el equipo de desarrollo puede beneficiarse de entornos consistentes, despliegues reproducibles y una postura de seguridad robusta.

La containerización de Spottruck no es solo una decisión técnica, sino también organizacional que permite al equipo moverse más rápido, reducir errores humanos y automatizar procesos repetitivos. Con esta arquitectura en su lugar, la plataforma está preparada para escalar y evolucionar según las necesidades del negocio.
