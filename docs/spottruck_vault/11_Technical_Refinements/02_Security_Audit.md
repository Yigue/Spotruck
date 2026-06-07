---
title: Spottruck Security Audit
description: Análisis de seguridad completo - threat model, OWASP Top 10, GDPR/LOPD, seguridad de API
date: 2026-06-04
author: Guillermo Riedel
status: draft
tags: [spottruck, security, audit, OWASP, threat-model]
area: 11_Technical_Refinements
project: spottruck
stage: security
---

# Spottruck Security Audit

## Resumen

Este documento presenta una auditoría de seguridad completa para Spottruck, la plataforma de subastas/logística para transporte de carga. Cubre el threat model, vulnerabilidades OWASP Top 10, cumplimiento normativo (GDPR/LGPD/LOPD), y el plan de pruebas de penetración.

## Threat Model - STRIDE

### Spoofing (Suplantación de Identidad)

**Escenarios de amenaza:**
1. Un atacante roba credenciales de usuario (phishing, data breach) y se hace pasar por él
2. Un transportista crea múltiples cuentas para inflar precios en subastas
3. Un empleado de Spottruck accede a cuentas de usuarios sin autorización

**Mitigaciones implementadas:**
- Contraseñas hasheadas con bcrypt (cost factor 12, mínimo)
- 2FA obligatorio para transportistas que operan comercialmente
- Rate limiting en intentos de login (5 por minuto, luego lock 15 min)
- Tokens JWT firmados con RS256, no HS256
- Sesiones invalidate al hacer logout (token blacklist en Redis)

**Validación:**
```bash
# Test de fuerza de contraseña mínimo
# Las contraseñas deben cumplir:
# - Mínimo 8 caracteres
# - Al menos 1 mayúscula, 1 minúscula, 1 número
# - No pueden estar en listas de passwords comprometidos (HaveIBeenPwned API)
```

### Tampering (Manipulación de Datos)

**Escenarios de amenaza:**
1. Un atacante modifica parámetros de API para cambiar el monto de una oferta
2. Un usuario manipula el estado del viaje para reclamar pagos fraudulentos
3. Datos de tracking GPS son alterados para mostrar entregas ficticias

**Mitigaciones implementadas:**
- Validación de request bodies con JSON Schema (every endpoint)
- Checksums en payloads críticos (HMAC-SHA256)
- Firmas digitales en operaciones financieras (viajes > $50,000 ARS)
- Campos inmutables en DB (created_at, created_by no se pueden modificar)
- Tabla de audit_logs donde TODAS las mutations se registran con usuario y timestamp
- Integrity constraints en PostgreSQL (CHECK constraints)

**Validación:**
```sql
-- Los precios de oferta deben estar en un rango válido
ALTER TABLE bids ADD CONSTRAINT bid_amount_range 
CHECK (amount BETWEEN 1000 AND 10000000);

-- No se puede cambiar el estado de un viaje una vez completado
CREATE OR REPLACE FUNCTION validate_trip_state_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'COMPLETED' AND NEW.status != OLD.status THEN
    RAISE EXCEPTION 'Cannot modify a completed trip';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_state_validation
BEFORE UPDATE ON trips
FOR EACH ROW EXECUTE FUNCTION validate_trip_state_transition();
```

### Repudiation (No Repudio)

**Escenarios de amenaza:**
1. Un usuario niega haber enviado una oferta
2. Una empresa niega haber cancelado un viaje
3. Un empleado niega haber accedido a datos sensibles

**Mitigaciones implementadas:**
- Todos los logs en formato estructurado JSON con timestamp UTC
- Logs de auditoría en tabla inmutable (sin DELETE/UPDATE, solo INSERT)
- Firmas digitales para contratos (hash de documento + firma del usuario)
- Email de confirmación para todas las operaciones críticas
- Video de verificación para altas de transportistas

**Schema de audit log:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT no_update_or_delete CHECK (true) -- trigger prevent
);

-- Index para queries rápidas
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
```

### Information Disclosure (Divulgación de Información)

**Escenarios de amenaza:**
1. Un atacante extrae datos de usuarios vía SQL injection
2. Datos de tarjetas de crédito se almacenan sin enmascarar
3. Logs de error exponen información del stack trace en producción

**Mitigaciones implementadas:**
- Parameterized queries para TODAS las consultas SQL (ORM Sequelize con raw queries protegidos)
- Enmascaramiento de datos sensibles en logs (card numbers, DNI)
- Environment variables para configuración, nunca en código
- Stack traces solo en entorno de desarrollo, nunca en producción
- TLS 1.3 para todas las comunicaciones (API → client: force HTTPS)
- Headers de seguridad (X-Content-Type-Options, X-Frame-Options, CSP)

**Headers implementados:**
```nginx
# Nginx configuration
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

### Denial of Service (Denegación de Servicio)

**Escenarios de amenaza:**
1. Un atacante envía miles de requests para saturar el API
2. Competidores lanzan ataques de竞价 a las subastas (sniping)
3. Un script malicioso hace infinite search queries pesadas

**Mitigaciones implementadas:**
- Rate limiting por IP y por usuario (token bucket algorithm)
- Circuit breaker en servicios externos (MercadoPago, Google Maps)
- P99 latency budgets enforced en CI/CD
- Max connections en PostgreSQL: 100 (connection pooler arriba)
- Query timeout: 30 segundos máximo
- Indexes en todas las columnas de filtrado frecuente

**Configuración de rate limiting:**
```yaml
# config/rate-limit.yaml
global:
  requests_per_minute: 500
  burst: 100

by_endpoint:
  "/api/auth/login":
    requests_per_minute: 10
    burst: 5
  
  "/api/trips/search":
    requests_per_minute: 60
    burst: 20
  
  "/api/auctions/{id}/bid":
    requests_per_minute: 30
    burst: 10
```

## OWASP Top 10 - Mitigaciones Específicas

### A01:2021 - Broken Access Control

**Vulnerabilidad:** Usuarios pueden acceder a recursos de otros usuarios.

**Mitigaciones:**
- Authorization middleware en cada endpoint (RBAC + resource ownership)
- Ownership check en nivel de servicio, no solo controller
- Default deny: si no está explícitamente permitido, está denegado
- Unit tests para cada permission check

```typescript
// Middleware de autorización
const authorize = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const resourceId = req.params.id;
    
    const hasPermission = await permissionService.check(user.id, action, resource, resourceId);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

// En controller
router.delete('/trips/:id', authorize('delete', 'trip'), tripController.delete);
```

### A02:2021 - Cryptographic Failures

**Vulnerabilidad:** Datos sensibles expuestos sin encryptación.

**Mitigaciones:**
- Encryption at rest para PII (DNI, CUIT, números de tarjeta)
- Encryption in transit: TLS 1.3 everywhere
- Secrets en HashiCorp Vault, no en environment variables en producción
- Key rotation policy: cada 90 días
- No guardar números de tarjeta completos (tokenización con MercadoPago)

```typescript
// Encryption service
class EncryptionService {
  private key: Buffer;
  
  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  }
  
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
  }
  
  decrypt(ciphertext: string): string {
    const [ivHex, encryptedHex, tagHex] = ciphertext.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return decipher.update(Buffer.from(encryptedHex, 'hex')) + decipher.final('utf8');
  }
}
```

### A03:2021 - Injection

**Vulnerabilidad:** SQL injection, XSS, command injection.

**Mitigaciones:**
- Parameterized queries para SQL (no string concatenation)
- Input validation en todas las capas (schema validation con Zod)
- Output encoding para prevenir XSS
- Sanitización de uploads (verificar tipo MIME, scan con ClamAV)

```typescript
// Zod schema validation
const tripCreateSchema = z.object({
  origin: z.object({
    address: z.string().min(5).max(200),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  destination: z.object({
    address: z.string().min(5).max(200),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  cargo_type: z.enum(['GENERAL', 'REFRIGERATED', 'HAZMAT', 'LIVESTOCK']),
  pickup_date: z.string().datetime().refine(d => new Date(d) > new Date(), {
    message: 'Pickup date must be in the future'
  }),
  offered_price: z.number().min(1000).max(10000000)
});

// En controller
const tripData = tripCreateSchema.parse(req.body);
```

### A04:2021 - Insecure Design

**Vulnerabilidad:** Arquitectura insegura por diseño.

**Mitigaciones:**
- Threat modeling en fase de diseño (STRIDE)
- Secure design patterns (defense in depth, zero trust)
- Code review enfocado en seguridad
- Security champions en cada equipo

### A05:2021 - Security Misconfiguration

**Vulnerabilidad:** Configuración por defecto insegura.

**Mitigaciones:**
- Hardened base image (Alpine Linux con wolfi)
- No default passwords (todos los passwords random en primer startup)
- Deshabilitar servicios innecesarios
- Regular security audits de configuración

```dockerfile
# Multi-stage Dockerfile - production stage
FROM node:20-alpine AS production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --chown=appuser:appgroup dist/ ./dist/
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]
```

### A06:2021 - Vulnerable Components

**Vulnerabilidad:** Dependencias con vulnerabilidades conocidas.

**Mitigaciones:**
- Dependabot para actualización automática
- npm audit en CI/CD (fallar si hay HIGH/CRITICAL)
- SBOM (Software Bill of Materials) generado en build
- Container scanning con Trivy

```yaml
# GitHub Actions - dependency check
- name: Run npm audit
  run: npm audit --audit-level=high
  working-directory: ./api
  
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    scan-ref: '.'
    format: 'sarif'
    output: 'trivy-results.sarif'
    
- name: Upload Trivy results to GitHub Security
  uses: github/codeql-action/upload-sarif@v2
  if: always()
  with:
    sarif_file: 'trivy-results.sarif'
```

### A07:2021 - Authentication Failures

**Vulnerabilidad:** Auth débil o mal implementado.

**Mitigaciones:**
- JWT con RS256, short expiration (15 min access, 7 days refresh)
- Refresh token rotation (cada uso genera nuevo refresh token)
- 2FA con TOTP (Google Authenticator compatible)
- Password policy enforced (OWASP guidelines)
- Account lockout después de 5 intentos fallidos

```typescript
// 2FA TOTP setup
import { authenticator } from 'otplib';

const user = await User.findById(userId);
const secret = authenticator.generateSecret();
const otpauthUrl = authenticator.keyuri(user.email, 'Spottruck', secret);

// Store secret encrypted, not in plaintext
await user.update({ 
  two_factor_secret: encryptionService.encrypt(secret),
  two_factor_enabled: false // Enabled after first verification
});

// Verify TOTP
const isValid = authenticator.verify({
  token: req.body.code,
  secret: encryptionService.decrypt(user.two_factor_secret)
});
```

### A08:2021 - Software and Data Integrity Failures

**Vulnerabilidad:** Actualizaciones o plugins no verificados.

**Mitigaciones:**
- Code signed con GitHub Actions (protected branches)
- SBOM verification before deployment
- No auto-approve de dependencias externas
- Immutable infrastructure (no SSH a producción)

### A09:2021 - Security Logging Failures

**Vulnerabilidad:** Falta de logs para detectar ataques.

**Mitigaciones:**
- Structured logging (JSON) con correlación ID (request_id)
- Logs de seguridad centralizados (ELK stack)
- Alerts para patrones de ataque (multiple failed logins, unusual access)
- Retention policy: 90 días hot, 1 año cold storage

### A10:2021 - Server-Side Request Forgery (SSRF)

**Vulnerabilidad:** El servidor hace requests a URLs controladas por atacante.

**Mitigaciones:**
- Allowlist de URLs permitidas para requests externos
- No usar user input directamente en URLs
- Network segmentation (servicios internos no accesibles desde外面)
- Validate URLs con esquema http/https, no permitir file:// o internal hosts

## Cumplimiento Normativo

### Argentina - LOPD (Ley de Protección de Datos Personales)

**Requisitos:**
1. Registro ante la autoridad de protección de datos (AAIP)
2. Consentimiento explícito para recolección de datos
3. Derecho de acceso, corrección y eliminación de datos
4. Notificación de breach en 72 horas

**Implementación:**
```typescript
// Consentimiento guard
const recordConsent = async (userId: string, purpose: string, granted: boolean) => {
  await db.query(
    `INSERT INTO consents (user_id, purpose, granted, ip_address, user_agent, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [userId, purpose, granted, req.ip, req.headers['user-agent']]
  );
};

// Derecho de eliminación (GDPR-style)
const deleteUserData = async (userId: string) => {
  // Eliminar PII, mantener datos anonimizados para analytics
  await db.transaction(async tx => {
    // Eliminar datos sensibles
    await tx.query('DELETE FROM users WHERE id = $1', [userId]);
    // Mantener datos agregados para analytics (anonimizados)
    await tx.query(
      'INSERT INTO anonymous_analytics (metric_type, metric_value, period) SELECT ...',
      [userId]
    );
  });
};
```

### Internacional - GDPR/LGPD

**Requisitos para usuarios internacionales:**
1. Consentimiento granular por propósito
2. Portabilidad de datos (export en JSON)
3. Derecho al olvido
4. Notificación de cambios en privacy policy

**Endpoints implementados:**
- `GET /api/users/me/data` - Export todos los datos del usuario
- `DELETE /api/users/me` - Eliminación de cuenta
- `PUT /api/users/me/privacy` - Gestión de consentimientos

## API Security Checklist

- [ ] Authentication en todos los endpoints (excepto /health)
- [ ] Authorization checks en cada operación
- [ ] Input validation con Zod en todos los endpoints
- [ ] Rate limiting configurado
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] CSRF protection (double submit cookie)
- [ ] Security headers configurados
- [ ] HTTPS only (redirect HTTP → HTTPS)
- [ ] Tokens en HttpOnly cookies (no localStorage)
- [ ] Secrets en Vault, no en environment
- [ ] Logs sin datos sensibles (PII masking)
- [ ] Errors no exponen stack traces en producción

## Plan de Pruebas de Penetración

### Fase 1: Reconocimiento (Semana 1)
- Enumeración de subdominios y endpoints públicos
- Análisis de tecnología (Wappalyzer, builtwith)
- Revisión de código fuente (GitHub public repos)
- OSINT sobre la organización

### Fase 2: Testing Manual (Semana 2)
- SQL injection en todos los inputs
- XSS reflected, stored, DOM-based
- Authentication bypass (parameter tampering, session hijacking)
- Business logic flaws (auction sniping, price manipulation)
- IDOR en recursos de otros usuarios

### Fase 3: API Testing (Semana 3)
- Bypass de rate limiting
- Parameter pollution
- JWT manipulation (alg downgrade, key confusion)
- GraphQL introspection attacks

### Fase 4: Infrastructure (Semana 4)
- Cloud misconfiguration review
- Secret scanning en repos públicos
- DNS zone transfer attempts
- Subdomain takeover

### Herramientas utilizadas:
- Burp Suite Professional
- OWASP ZAP
- SQLMap
- Nmap + NSE scripts
- wfuzz (fuzzing)
- nuclei (vulnerability templates)

### Reporte de hallazgos:
- CVSS 3.1 score para cada vulnerabilidad
- Pasos de reproducción
- Impacto en el negocio
- Recomendación de remediación
- Prioridad (Critical/High/Medium/Low)

---

**Versión**: 1.0.0
**Última actualización**: 2026-06-04
**Autor**: Guillermo Riedel