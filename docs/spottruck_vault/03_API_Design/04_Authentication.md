---
title: "04 — Autenticación y Autorización"
category: "API Design"
project: "Spottruck"
version: "1.0.0"
date: "2026-06-03"
status: "approved"
author: "Spottruck Dev Team"
tags: [api, authentication, jwt, oauth2, security, spottruck, rbac, mfa, session]
created: 2026-06-03
last_modified: 2026-06-03
---

# 04 — Autenticación y Autorización

**Versión API:** v1  
**Última actualización:** 2026-06-03

---

## 1. Resumen Ejecutivo

Este documento describe la arquitectura de autenticación y autorización de Spottruck, incluyendo los flujos de JWT, OAuth2 para integraciones de terceros, RBAC (Control de Acceso Basado en Roles), MFA (Autenticación Multifactor), y gestión de sesiones. El sistema está diseñado para cumplir con OWASP Top 10, GDPR/MEX-SIMPL, y las mejores prácticas de la industria de transporte.

La autenticación en Spottruck se basa en tres pilares fundamentales: tokens JWT con vida corta para acceso a APIs, refresh tokens rotativos para mantener sesiones sin re-autenticación frecuente, y OAuth2 para integraciones de terceros. Todos los tokens son revocables y el sistema soporta MFA obligatorio para roles administrativos.

---

## 2. Flujos de JWT (JSON Web Tokens)

### 2.1 Arquitectura de Tokens

Spottruck utiliza un sistema de tokens dual para balancear seguridad y experiencia de usuario:

| Token | Tipo | Duración | Propósito |
|-------|------|----------|-----------|
| Access Token | JWT RS256 | 15 minutos | Acceso a APIs protegidas |
| Refresh Token | Opaco (64 bytes) | 30 días | Renovación de sesión |

**Por qué RS256 y no HS256:** Usamos RS256 (RSA + SHA-256) porque permite que clientesvaliden firmas sin conocer la clave privada. Las claves públicas se publican en un endpoint JWKS, facilitando la integración de apps móviles y partners sin compartir secretos.

### 2.2 Estructura del Access Token

El payload del JWT contiene los siguientes claims:

```json
{
  "sub": "usr_a1b2c3d4e5f6",
  "userId": "d9f45e01-7d8e-4a1b-9c3d-123456789abc",
  "email": "juan.perez@transportes.mx",
  "role": "driver",
  "companyId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "permissions": ["trips:read", "trips:update", "auctions:bid"],
  "iat": 1759430400,
  "exp": 1759431300,
  "jti": "jwt_abc123xyz789",
  "iss": "spottruck",
  "aud": "spottruck-api"
}
```

| Claim | Descripción |
|-------|-------------|
| `sub` | Subject identifier (user ID con prefijo) |
| `userId` | UUID puro del usuario |
| `email` | Email para conveniencia del cliente |
| `role` | Rol actual del usuario |
| `companyId` | UUID de empresa asociada (null si no aplica) |
| `permissions` | Array de permisos efectivos |
| `iat` | Issued At — timestamp Unix de emisión |
| `exp` | Expiration — timestamp Unix de expiración |
| `jti` | JWT ID — identificador único para blacklist |
| `iss` | Issuer — valor fijo "spottruck" |
| `aud` | Audience — API destinataria |

### 2.3 Flujo Completo de Autenticación

```
┌──────────┐     POST /auth/login      ┌──────────────┐
│  Client  │ ─────────────────────────▶│   Auth Svc   │
│          │   {email, password}       │              │
│          │◀──────────────────────────│              │
└──────────┘     {access_token,        └──────────────┘
                  refresh_token,                    │
                  expires_in}                       ▼
                                            ┌──────────────┐
                                            │  PostgreSQL   │
                                            │  Store refresh│
                                            │  token hash   │
                                            └──────────────┘
```

**Pasos detallados:**

1. **Login request:** El cliente envía `POST /api/v1/auth/login` con email y password.
2. **Validación de credenciales:** El Auth Service verifica contra bcrypt hash en PostgreSQL.
3. **Generación de tokens:**
   - Se genera el JWT con RS256 (firma con clave privada)
   - Se genera refresh token: 64 bytes random codificado en Base64url
   - Se calcula hash SHA-256 del refresh token para almacenamiento
4. **Almacenamiento:** El hash del refresh token se almacena en la tabla `refresh_tokens` junto con user_id, expires_at (30 días), y metadata.
5. **Respuesta:** Se devuelve access_token, refresh_token, y tiempos de expiración.

### 2.4 Refresh Token Rotation

El sistema implementa **rotación de refresh tokens** para seguridad. Cada vez que un refresh token es usado, se genera uno nuevo y el anterior se invalida.

**Flujo de refresh:**

```
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "rt_abc123xyz...def"
}

Respuesta (200):
{
  "access_token": "eyJhbGciOiJSUzI1NiJ9...",
  "refresh_token": "rt_newtoken123...xyz",
  "expires_in": 900
}
```

**Comportamiento:**
1. El servidor recibe el refresh token
2. Calcula SHA-256 del token recibido
3. Busca el hash en la tabla `refresh_tokens`
4. Si existe y no está expirado/revocado:
   - Genera nuevo access token
   - Genera nuevo refresh token
   - Almacena hash del nuevo refresh token
   - Marca el refresh token anterior como `revoked_at`
5. Si no existe o está revoked: retorna `AUTH_007` (token inválido)

**Beneficio de seguridad:** Si un atacante roba un refresh token y lo usa antes que el dueño legítimo, el token del dueño legítimo se revoca (porque ya fue usado), alertando de la intrusión.

### 2.5 Blacklist de Access Tokens

Los access tokens pueden ser blacklisted antes de su expiración natural. Esto permite revoke inmediata en casos de seguridad.

**Casos de uso para blacklist:**
- Usuario inicia logout
- Usuario cambia password
- Administrador suspende usuario
- Se detecta uso sospechoso del token

**Mecanismo:** El `jti` del token se inserta en la tabla `token_blacklist` con `expires_at` igual al timestamp de expiración del token. El middleware de autenticación verifica esta tabla en cada request.

```sql
INSERT INTO token_blacklist (jti, expires_at) 
VALUES ('jwt_abc123xyz789', '2026-06-03T14:30:00Z');
```

**Optimización con Redis:** En producción, la verificación de blacklist se hace contra Redis para evitar latency de base de datos en el hot path. El cache tiene TTL igual a la diferencia entre `exp` y `now()`.

### 2.6 Logout

El logout es un proceso de dos pasos:

1. **Blacklist del access token:** El `jti` se inserta en la blacklist. El access token sigue válido por hasta 15 minutos, pero será rechazado en cada request.
2. **Revocación del refresh token:** El refresh token se marca como `revoked_at`, impidiendo futuros refresh.

```
POST /auth/logout
Authorization: Bearer <access_token>

Respuesta (200):
{
  "message": "Sesión cerrada exitosamente"
}
```

---

## 3. OAuth2 — Integraciones de Terceros

### 3.1 Authorization Code Flow

Para aplicaciones web con servidor backend, implementamos Authorization Code Flow según RFC 6749.

**Registro de aplicación:** El partner registra su app en `https://developer.spottruck.com` y recibe:
- `client_id` — identificador público
- `client_secret` — secreto para backend (nunca expone en cliente)

**Scopes disponibles:**

| Scope | Descripción | Acceso a terceros |
|-------|-------------|-------------------|
| `read` | Lectura de datos públicos y propios | Sí |
| `write` | Creación y modificación de recursos propios | Sí |
| `delete` | Eliminación de recursos propios | Sí |
| `trips:read` | Ver trips del usuario | Sí |
| `trips:write` | Crear/modificar trips del usuario | Sí |
| `auctions:read` | Ver auctions | Sí |
| `auctions:bid` | Participar en auctions | Sí |
| `admin` | Acceso administrativo completo | No (requiere aprobación) |

**Flujo detallado:**

```
1. Redirect inicial:
   GET /api/v1/oauth/authorize
     ?response_type=code
     &client_id=CLIENT_ID
     &redirect_uri=https://partner.com/callback
     &scope=read+trips:read
     &state=RANDOM_STATE_32_BYTES

2. Usuario autentica en Spottruck (si no tiene sesión)

3. Usuario ve pantalla de consentimiento con los scopes solicitados

4. Si usuario autoriza:
   GET https://partner.com/callback?code=AUTH_CODE&state=RANDOM_STATE

   Si usuario rechaza:
   GET https://partner.com/callback?error=access_denied&state=RANDOM_STATE

5. Backend partner intercambia código por tokens:
   POST /api/v1/oauth/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code
   &code=AUTH_CODE
   &client_id=CLIENT_ID
   &client_secret=CLIENT_SECRET
   &redirect_uri=https://partner.com/callback

6. Respuesta:
   {
     "access_token": "eyJhbGciOiJSUzI1NiJ9...",
     "token_type": "Bearer",
     "expires_in": 900,
     "refresh_token": "rt_xyz789...",
     "scope": "read trips:read"
   }
```

**Protección CSRF:** El parámetro `state` es obligatorio y debe ser un valor random de al menos 32 bytes. El partner debe verificar que el `state` en el callback coincida con el enviado.

**Seguridad del código:** El código de autorización tiene vida útil de 10 minutos y solo puede usarse una vez.

### 3.2 PKCE Flow para Apps Móviles

PKCE (Proof Key for Code Exchange) es requerido para todas las aplicaciones móviles nativas y protege contra ataques de intercepción de código.

**Diferencia clave:** No requiere `client_secret` porque la identidad se verifica mediante un challenge criptográfico generado en el dispositivo.

**Fase 1 — Inicio (en el dispositivo):**

```javascript
// Generar code_verifier
const codeVerifier = generateRandomString(43); // 43-128 caracteres

// Generar code_challenge
const codeChallenge = base64url(sha256(codeVerifier));

// Guardar code_verifier en storage seguro (Keychain/Keystore)

// Redirect al navegador/SSO
GET /api/v1/oauth/authorize
  ?response_type=code
  &client_id=CLIENT_ID
  &redirect_uri=spottruck://callback
  &scope=read
  &state=RANDOM_STATE
  &code_challenge=CODE_CHALLENGE
  &code_challenge_method=S256
```

**Fase 2 — Intercambio (en el dispositivo):**

```javascript
// Después de recibir el código
POST /api/v1/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTH_CODE
&client_id=CLIENT_ID
&redirect_uri=spottruck://callback
&code_verifier=CODE_VERIFIER

// Respuesta
{
  "access_token": "eyJhbGciOiJSUzI1NiJ9...",
  "refresh_token": "rt_xyz789...",
  "expires_in": 900
}
```

El servidor calcula `SHA256(code_verifier)` y lo compara con el `code_challenge` almacenado. Si coinciden, la identidad del cliente está verificada.

### 3.3 Client Credentials Flow

Para integraciones server-to-server sin usuario final (webhooks, sincronizaciones), usamos Client Credentials.

```bash
POST /api/v1/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=CLIENT_ID
&client_secret=CLIENT_SECRET
&scope=read
```

**Respuesta:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "scope": "read"
}
```

**Nota:** No se entrega refresh token. El cliente debe renovar el token antes de que expire (15 min). Recomendamos scheduler que renueve 60 segundos antes.

**Seguridad:** `client_secret` nunca debe estar en código cliente. Usar variables de entorno o secretos de servidor (AWS Secrets Manager, HashiCorp Vault).

### 3.4 Token Revocation

Para invalidar tokens OAuth (logout de app partner):

```
POST /api/v1/oauth/revoke
Content-Type: application/x-www-form-urlencoded

token=ACCESS_TOKEN
&client_id=CLIENT_ID
&client_secret=CLIENT_SECRET
```

El servidor inserta el `jti` en la blacklist, invalidando el token inmediatamente.

---

## 4. RBAC — Control de Acceso Basado en Roles

### 4.1 Roles del Sistema

| Rol | Descripción | Nivel de acceso |
|-----|-------------|-----------------|
| `guest` | Visitante sin cuenta | 0 — Sin acceso a datos privados |
| `user` | Usuario registrado básico | 1 — Solo datos propios |
| `shipper` | Embarcador que publica cargas | 2 —Gestión de publicaciones y pagos |
| `carrier` | Transportista que puja y ejecuta | 2 — Gestión de auctions y trips |
| `company_owner` | Dueño de empresa transportista | 3 — Gestión de flota y conductores |
| `admin` | Administrador de plataforma | 99 — Acceso total |

**Notas:**
- Un usuario puede tener un único rol activo.
- El rol `company_owner` incluye permisos de `carrier`.
- El rol `admin` puede actuar como cualquier otro rol (impersonation).

### 4.2 Matriz de Permisos

| Recurso/Acción | guest | user | shipper | carrier | company_owner | admin |
|----------------|-------|------|---------|---------|---------------|-------|
| **Publications (Cargas)** | | | | | | |
| Ver públicas | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Crear | — | — | ✓ | — | ✓ | ✓ |
| Editar propia | — | — | ✓ | — | ✓ | ✓ |
| Eliminar propia | — | — | ✓ | — | ✓ | ✓ |
| Moderar cualquier | — | — | — | — | — | ✓ |
| **Offers (Ofertas)** | | | | | | |
| Ver ofertas propias | — | — | ✓ | ✓ | ✓ | ✓ |
| Crear oferta | — | — | — | ✓ | ✓ | — |
| Retirar oferta propia | — | — | — | ✓ | ✓ | — |
| Aceptar/rechazar ofertas | — | — | ✓ | — | ✓ | ✓ |
| **Trips (Viajes)** | | | | | | |
| Ver trips propios | — | — | ✓ | ✓ | ✓ | ✓ |
| Crear trip | — | — | ✓ | — | ✓ | ✓ |
| Asignar conductor | — | — | ✓ | — | ✓ | ✓ |
| Actualizar estado | — | — | — | ✓ | ✓ | ✓ |
| Ver tracking | — | — | ✓ | ✓ | ✓ | ✓ |
| **Payments (Pagos)** | | | | | | |
| Ver pagos propios | — | — | ✓ | ✓ | ✓ | ✓ |
| Crear pago (escrow) | — | — | ✓ | — | ✓ | ✓ |
| Liberar pago | — | — | — | — | — | ✓ |
| Solicitar reembolso | — | — | ✓ | — | ✓ | ✓ |
| **Ratings (Calificaciones)** | | | | | | |
| Ver calificaciones | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Enviar calificación | — | — | ✓ | ✓ | ✓ | ✓ |
| Responder calificación | — | — | ✓ | ✓ | ✓ | ✓ |
| Moderar calificación | — | — | — | — | — | ✓ |
| **Users (Usuarios)** | | | | | | |
| Ver perfil público | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Editar propio perfil | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ver listado usuarios | — | — | — | — | — | ✓ |
| Suspender usuario | — | — | — | — | — | ✓ |
| **Company** | | | | | | |
| Ver company propia | — | — | ✓ | ✓ | ✓ | ✓ |
| Crear company | — | — | ✓ | — | ✓ | ✓ |
| Editar propia company | — | — | — | — | ✓ | ✓ |
| Ver cualquier company | — | — | — | — | — | ✓ |
| **Fleet (Flota)** | | | | | | |
| Ver vehículos propios | — | — | — | ✓ | ✓ | ✓ |
| Agregar vehículo | — | — | — | — | ✓ | ✓ |
| Editar vehículo propio | — | — | — | — | ✓ | ✓ |
| Ver cualquier vehículo | — | — | — | — | — | ✓ |

### 4.3 Permisos Granulares por Recurso

Además de roles, implementamos permisos granulares en formato `recurso:acción`:

**Publications/Cargas:**
- `publications:read` — Ver cualquier publicación
- `publications:create` — Crear publicación
- `publications:update` — Editar publicación propia
- `publications:delete` — Cancelar publicación propia
- `publications:moderate` — Aprobar/rechazar cualquier publicación (admin)

**Offers/Ofertas:**
- `offers:read` — Ver ofertas propias o de publicaciones propias
- `offers:create` — Colocar nueva oferta (carrier)
- `offers:update` — Modificar/retirar oferta propia
- `offers:accept` — Aceptar oferta (shipper dueño)
- `offers:reject` — Rechazar oferta (shipper dueño)

**Trips/Viajes:**
- `trips:read` — Ver trips propios
- `trips:create` — Crear trip
- `trips:update` — Actualizar estado (conductor asignado)
- `trips:dispute` — Abrir disputa en trip propio

**Payments/Pagos:**
- `payments:read` — Ver pagos propios
- `payments:create` — Crear pago (shipper)
- `payments:release` — Liberar pago (admin)
- `payments:refund` — Solicitar reembolso

**Drivers:**
- `drivers:read` — Ver información de conductores
- `drivers:create` — Crear perfil de conductor (company_owner)
- `drivers:update` — Actualizar conductor propio
- `drivers:deactivate` — Desactivar conductor (company_owner/admin)

**Vehicles:**
- `vehicles:read` — Ver vehículos
- `vehicles:create` — Crear vehículo (company_owner)
- `vehicles:update` — Actualizar vehículo propio
- `vehicles:delete` — Eliminar vehículo propio

### 4.4 Implementación en Middleware

El middleware de autorización ejecuta la siguiente lógica por cada request:

```
1. Extraer user_id y role del JWT
2. Consultar permisos efectivos del usuario (cache en Redis)
3. Si endpoint requiere permisos específicos:
   a. Verificar que el rol tenga los permisos necesarios
   b. Para recursos propios: verificar ownership
4. Si cualquier verificación falla: return 403
```

**Ejemplo de verificación para `PATCH /api/v1/publications/:id`:**

```python
def check_publication_update_permission(user, publication_id):
    publication = get_publication(publication_id)
    
    # Si no existe
    if not publication:
        raise NotFoundError("Publication not found")
    
    # Verificar ownership o rol admin
    if publication.company_id != user.company_id and user.role != 'admin':
        raise ForbiddenError("AUTH_005: No tienes permiso para editar esta publicación")
    
    # Verificar que no esté cerrada o cancelada
    if publication.status in ['closed', 'cancelled']:
        raise ConflictError("PUB_003: No se puede editar una publicación cerrada")
    
    return True
```

### 4.5 Row-Level Security en PostgreSQL

Para defense in depth, implementamos RLS (Row-Level Security) a nivel de base de datos:

```sql
-- Política: users ven solo sus propios datos
CREATE POLICY users_own_data ON users
  FOR ALL
  USING (id = current_user_id());

-- Política: publications visibles si están 'open' o el usuario es el dueño
CREATE POLICY publications_read ON publications
  FOR SELECT
  USING (
    status = 'open'
    OR company_id = current_user_id()
    OR current_role() = 'admin'
  );

-- Política: companies visibles solo a employees de la misma company
CREATE POLICY companies_own ON companies
  FOR ALL
  USING (id = current_user_company_id());

-- Habilitar RLS en tablas sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
```

**Beneficio:** Incluso si hay un bug en el código de aplicación, la base de datos protege los datos a nivel de fila. Esta defense in depth es especialmente importante para datos financieros.

---

## 5. MFA — Autenticación Multifactor

### 5.1 Requisitos de MFA

El MFA es obligatorio para los siguientes roles/usuarios:
- Todos los usuarios con rol `admin`
- Todos los usuarios con acceso a información financiera
- Usuarios que superan 10 failed login attempts en 24 horas

El MFA es opcional pero recomendado para:
- company_owners
- usuarios con acceso a datos sensibles

### 5.2 Métodos MFA Soportados

| Método | Descripción | Seguridad |
|--------|-------------|-----------|
| `totp` | Time-based One-Time Password (Google Authenticator, Authy) | Alta |
| `sms` | Código por SMS (menos recomendado) | Media |
| `email` | Código por email | Media-Baja |
| `backup_codes` | Códigos de respaldo impresos (8 use limit) | Baja |

**Recomendación:** TOTP es el método más seguro y es el recomendado por Spottruck. SMS es vulnerable a SIM swapping attacks.

### 5.3 Habilitación de MFA

**Paso 1 — Iniciar enroll:**

```
POST /api/v1/auth/mfa/enroll
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "method": "totp"
}

Respuesta:
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "otpauth://totp/Spottruck:juan.perez@transportes.mx?secret=JBSWY3DPEHPK3PXP&issuer=Spottruck",
  "manualEntryKey": "JBSWY3DPEHPK3PXP"
}
```

El usuario escanea el QR code con su app de autenticación (Google Authenticator, Authy).

**Paso 2 — Verificar primer código:**

```
POST /api/v1/auth/mfa/verify
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "code": "123456",
  "secret": "JBSWY3DPEHPK3PXP"
}

Respuesta (200):
{
  "mfaEnabled": true,
  "backupCodes": [
    "ABCD-1234-EFGH",
    "IJKL-5678-MNOP",
    ...
  ]
}
```

**Almacenamiento de secretos:** El secreto TOTP se almacena encriptado con AES-256 en la base de datos. Nunca se almacena en texto claro.

### 5.4 Login con MFA

```
1. Login normal:
   POST /api/v1/auth/login
   {email, password}

   Si MFA está habilitado, respuesta:
   {
     "challenge": "mfa_required",
     "challengeMethod": "totp",
     "tmpToken": "tmp_xyz789..."
   }

2. Verificar MFA:
   POST /api/v1/auth/mfa/verify
   {
     "tmpToken": "tmp_xyz789...",
     "code": "123456"
   }

   Respuesta (200):
   {
     "access_token": "eyJ...",
     "refresh_token": "rt_...",
     "expires_in": 900
   }
```

**Seguridad del tmpToken:** El `tmpToken` tiene validez de 5 minutos y solo puede usarse una vez para completar el login. Si expira, el usuario debe iniciar login nuevamente.

### 5.5 Deshabilitación de MFA

Para deshabilitar MFA se requiere verificación del código actual:

```
POST /api/v1/auth/mfa/disable
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "code": "123456"
}

Respuesta (200):
{
  "mfaEnabled": false,
  "message": "MFA deshabilitado exitosamente"
}
```

---

## 6. Gestión de Sesiones

### 6.1 Estructura de Sesión

Cada sesión de usuario tiene:

```json
{
  "sessionId": "uuid",
  "userId": "uuid",
  "refreshTokenHash": "sha256 hash",
  "deviceInfo": {
    "type": "mobile|desktop|tablet",
    "os": "iOS 17|Android 14|Windows 11",
    "browser": "Chrome 125|Safari|Firefox",
    "brand": "Apple|Samsung|null",
    "model": "iPhone 15|null"
  },
  "ipAddress": "string",
  "country": "string (ISO 3166-1 alpha-2)",
  "city": "string",
  "createdAt": "timestamp",
  "lastActiveAt": "timestamp",
  "expiresAt": "timestamp"
}
```

### 6.2 Límites de Sesión

| Tipo de cuenta | Sesiones activas máxima |
|----------------|------------------------|
| Free tier | 2 sesiones simultáneas |
| Premium | 5 sesiones simultáneas |
| Enterprise | 10 sesiones simultáneas |
| Admin | 1 sesión (MFA obligatorio) |

Cuando se excede el límite, la sesión más antigua es automáticamente invalidada.

### 6.3 Detección de Anomalías

El sistema detecta y alerta sobre:
- Login desde país diferente al usual
- Múltiples fail attempts desde diferentes IPs
- Sesión activa desde dispositivo nuevo mientras otra sesión activa desde dispositivo diferente
- Login fuera de horas laborales normales (opcional, configurable por empresa)

**Respuesta a anomalías:**
1. Enviar notificación al usuario (email/push)
2. Requerir verificación adicional (MFA)
3. Opcionalmente: bloquear sesión sospechosa

### 6.4 Session Listing

El usuario puede ver y revoke sesiones activas:

```
GET /api/v1/auth/sessions
Authorization: Bearer <access_token>

Respuesta:
{
  "sessions": [
    {
      "sessionId": "abc123",
      "deviceInfo": {"type": "mobile", "os": "iOS 17", "brand": "Apple"},
      "ipAddress": "187.197.82.123",
      "city": "Ciudad de México",
      "country": "MX",
      "createdAt": "2026-06-03T08:00:00Z",
      "lastActiveAt": "2026-06-03T14:30:00Z",
      "isCurrent": true
    },
    {
      "sessionId": "def456",
      "deviceInfo": {"type": "desktop", "os": "Windows 11", "browser": "Chrome 125"},
      "ipAddress": "189.234.56.78",
      "city": "Monterrey",
      "country": "MX",
      "createdAt": "2026-06-01T10:00:00Z",
      "lastActiveAt": "2026-02T02:00:00Z",
      "isCurrent": false
    }
  ]
}
```

### 6.5 Revocar Sesión Específica

```
DELETE /api/v1/auth/sessions/:sessionId
Authorization: Bearer <access_token>

Respuesta (200):
{
  "message": "Sesión revocada exitosamente"
}
```

Para revoke todas las sesiones excepto la actual:

```
DELETE /api/v1/auth/sessions
Authorization: Bearer <access_token>
Query: ?except_current=true

Respuesta (200):
{
  "message": "Todas las demás sesiones han sido revocadas",
  "sessionsRevoked": 4
}
```

---

## 7. Contraseñas y Recuperación

### 7.1 Requisitos de Contraseña

- Mínimo 12 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- Al menos un carácter especial (!@#$%^&*()_+-=)
- No puede contener el email ni el nombre del usuario
- No puede estar en lista de passwords comprometidos (HaveIBeenPwned API)

### 7.2 Almacenamiento

Las contraseñas se almacenan usando **bcrypt** con:
- Cost factor: 12 (auto-escalable)
- Salt: random por cada password
- Hash: `$2b$12$[SALT][HASH]`

### 7.3 Recuperación de Contraseña

**Paso 1 — Solicitar reset:**

```
POST /api/v1/auth/password-reset
Content-Type: application/json

{
  "email": "juan.perez@transportes.mx"
}

Respuesta (200):
{
  "message": "Si el email existe, recibirás un enlace de recuperación",
  "email": "juan.perez@transportes.mx"
}
```

**Nota de seguridad:** Siempre retornar éxito para prevenir email enumeration attacks, incluso si el email no existe.

**Paso 2 — Link de reset (enviado por email):**

El usuario recibe un link con token:
```
https://app.spottruck.com/reset-password?token=RESET_TOKEN&email=juan.perez@transportes.mx
```

**Paso 3 — Establecer nueva contraseña:**

```
POST /api/v1/auth/password-reset/confirm
Content-Type: application/json

{
  "token": "RESET_TOKEN",
  "email": "juan.perez@transportes.mx",
  "newPassword": "NuevaContraseña123!"
}

Respuesta (200):
{
  "message": "Contraseña actualizada exitosamente"
}
```

**Validaciones del token:**
- Debe existir en la tabla `password_reset_tokens`
- No debe estar expirado (1 hora de validez)
- No debe haber sido usado
- Email debe coincidir

**Paso 4 — Efectos colaterales del reset:**

Cuando el usuario cambia su contraseña:
1. Todos los refresh tokens del usuario son revocados
2. Todas las sesiones del usuario son invalidadas
3. Si el usuario tiene MFA, se mantiene habilitado
4. Se envía email de notificación al usuario

---

## 8. Seguridad Adicional

### 8.1 Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `POST /auth/login` | 5 requests | 15 minutos |
| `POST /auth/refresh` | 10 requests | 15 minutos |
| `POST /auth/password-reset` | 3 requests | 1 hora |
| `POST /oauth/token` | 10 requests | 15 minutos |
| API general | 1000 requests | 1 hora |

**Respuesta cuando se excede:**

```json
HTTP 429 Too Many Requests
Retry-After: 3600

{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Demasiadas solicitudes. Intenta de nuevo en 1 hora.",
    "retryAfter": 3600
  }
}
```

### 8.2 Headers de Seguridad

Todos los responses incluyen:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

### 8.3 CORS Configuration

```javascript
const corsOptions = {
  origin: ['https://spottruck.com', 'https://app.spottruck.com'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 horas
};
```

### 8.4 Login Attempts Tracking

Failed login attempts se rastrean por IP y email:

```sql
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY,
  ip_address VARCHAR(45),
  email VARCHAR(254),
  success BOOLEAN,
  attempted_at TIMESTAMP DEFAULT NOW(),
  user_agent TEXT
);

-- Índice para buscar intentos recientes
CREATE INDEX idx_login_attempts_email_at 
ON login_attempts(email, attempted_at DESC);

-- Limpiar intentos mayores a 24 horas (job nocturno)
DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '24 hours';
```

Si hay más de 10 failed attempts desde la misma IP en 24 horas:
- El IP es bloqueado temporalmente (15 min ban)
- Se envía alerta al usuario por email

---

## 9. Endpoints de Autenticación

### Resumen de Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Registro de nuevo usuario |
| POST | `/api/v1/auth/login` | Login con credenciales |
| POST | `/api/v1/auth/logout` | Logout (invalida sesión) |
| POST | `/api/v1/auth/refresh` | Refrescar access token |
| POST | `/api/v1/auth/revoke` | Revocar token específico |
| GET | `/api/v1/auth/sessions` | Listar sesiones activas |
| DELETE | `/api/v1/auth/sessions/:id` | Revocar sesión específica |
| DELETE | `/api/v1/auth/sessions` | Revocar todas las sesiones |
| POST | `/api/v1/auth/password-reset` | Solicitar reset de contraseña |
| POST | `/api/v1/auth/password-reset/confirm` | Confirmar nueva contraseña |
| POST | `/api/v1/auth/mfa/enroll` | Iniciar enroll de MFA |
| POST | `/api/v1/auth/mfa/verify` | Verificar código MFA |
| POST | `/api/v1/auth/mfa/disable` | Deshabilitar MFA |
| GET | `/api/v1/auth/me` | Obtener perfil del usuario actual |
| PUT | `/api/v1/auth/me` | Actualizar perfil del usuario actual |
| POST | `/api/v1/oauth/authorize` | Authorization endpoint OAuth |
| POST | `/api/v1/oauth/token` | Token endpoint OAuth |
| POST | `/api/v1/oauth/revoke` | Revocar token OAuth |
| GET | `/api/v1/.well-known/jwks.json` | JWKS público |

---

*Este documento forma parte de la especificación técnica de Spottruck. Para preguntas o aclaraciones sobre seguridad, contactar al equipo de seguridad en security@spottruck.com.*