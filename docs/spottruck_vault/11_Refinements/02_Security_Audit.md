---
title: "02_Security_Audit"
tipo: "Documento Técnico"
proyecto: "Spottruck"
categoria: "Auditoría de Seguridad"
version: "1.0"
fecha_creacion: "2026-06-02"
fecha_actualizacion: "2026-06-04"
estado: "activo"
autor: "Spottruck Dev Team"
tags:
  - "security"
  - "owasp"
  - "gdpr"
  - "lopd"
  - "ley-25326"
  - "threat-model"
  - "encryption"
  - "rate-limiting"
  - "ddos"
  - "security-headers"
  - "spottruck"
zona_horaria: "ART (UTC-3)"
---

# Spottruck — Auditoría de Seguridad

Análisis comprehensivo de amenazas, cobertura OWASP Top 10, compliance GDPR/LOPD (Argentina), y contramedidas técnicas detalladas para la plataforma de subastas y logística de transporte de carga Spottruck.

---

## 1. Threat Model

### 1.1 Assets Críticos

```
ASSETS A PROTEGER:
1. Datos de usuarios (PII): nombres, emails, teléfonos, direcciones, DNI
2. Datos financieros: números de tarjeta, CVV, cuentas bancarias, CBU
3. Credenciales: passwords (bcrypt), JWT tokens, API keys, refresh tokens
4. Documentos: licencias de conducir, seguros, registrations empresariales
5. Información de carga: rutas, tipos de mercancía, valores declarados
6. Reputación: ratings, reviews, historique de transacciones
7. Secretos de aplicación: claves de encriptación, certificados SSL
8. Logs de auditoría: historial de accesos y modificaciones
```

### 1.2 Actors y Motivaciones (STRIDE)

```yaml
actors:
  anonymous_hacker:
    motivation: "Curiosity, fame in hacking community"
    capabilities: "Basic to intermediate hacking skills, automated tools"
    threats: ["Data breach", "Service disruption", "Spam"]
    stride: ["S-Disclosure", "T-Tampering", "D-Denial"]
    
  competitor:
    motivation: "Business advantage, market intelligence"
    capabilities: "Intermediate resources, insider access possibility"
    threats: ["Data theft", "Reputation sabotage", "Price manipulation"]
    stride: ["I-Information Disclosure", "T-Tampering", "R-Repudiation"]
    
  disgruntled_employee:
    motivation: "Revenge, financial gain"
    capabilities: "Internal access, knowledge of systems"
    threats: ["Data exfiltration", "Fraud", "System sabotage"]
    stride: ["T-Tampering", "I-Information Disclosure", "E-Elevation of Privilege"]
    
  organized_cybercrime:
    motivation: "Financial gain, ransomware"
    capabilities: "Advanced resources, zero-day exploits"
    threats: ["Ransomware", "Mass data breach", "Financial fraud"]
    stride: ["S-Disclosure", "T-Tampering", "D-Denial", "E-Elevation"]
    
  nation_state:
    motivation: "Espionage, critical infrastructure disruption"
    capabilities: "Unlimited resources, zero-days, insider networks"
    threats: ["APT", "State-sponsored fraud", "Infrastructure attack"]
    stride: ["All STRIDE categories"]
```

### 1.3 Attack Surfaces

```
SURFACES DE ATAQUE:

WEB APPLICATION:
├── Login/Auth pages (credential theft, brute force)
├── Registration forms (account takeover, spam)
├── Publication creation (XSS, content injection)
├── Offer submission (bid manipulation)
├── Payment pages (PCI DSS violations, fraud)
├── Profile settings (data manipulation)
└── Admin dashboards (privilege escalation)

MOBILE APPS (iOS/Android):
├── Authentication flows (token theft, session hijacking)
├── Device storage (credentials in cleartext)
├── Push notification handlers (deep link exploitation)
└── Deep links (intent hijacking)

APIs REST (v1/v2):
├── /api/auth/* (auth bypass, token forgery)
├── /api/users/* (IDOR, data exfiltration)
├── /api/publications/* (content injection)
├── /api/offers/* (bid manipulation)
├── /api/payments/* (financial fraud)
└── /api/admin/* (privilege escalation)

WebSocket:
├── Real-time bid updates (message injection)
├── Chat functionality (XSS, social engineering)
└── Location tracking (privacy violation)

INFRASTRUCTURE:
├── Load balancers (SSL termination, MITM)
├── Application servers (RCE, container escape)
├── Database servers (SQL injection, data breach)
├── Cache layers Redis (data injection, session hijacking)
├── Message queues RabbitMQ/Kafka (message tampering)
└── File storage S3/MinIO (data exfiltration, ransomware)
```

---

## 2. OWASP Top 10 Mitigations

### 2.1 A01 — Broken Access Control

```yaml
description: "Restrictions on what authenticated users can do are not properly enforced"

mitigations:
  - "Implement role-based access control (RBAC) on all endpoints"
  - "Deny by default; explicit allow for each resource"
  - "Implement proper authentication on all endpoints"
  - "Rate limit API endpoints to prevent enumeration"
  - "Log access control failures and alert on repeated failures"
  - "Use UUIDs instead of sequential IDs to prevent enumeration"
  - "Verify ownership of resources before access"
  
implementation:
  # Middleware de autorización
  - "AuthMiddleware valida JWT y extrae rol"
  - "Route-specific middleware verifica permisos"
  - "Admin endpoints requieren rol 'admin'"
  - "Users solo pueden acceder sus propios recursos"
  
  # Code example (Express middleware):
  const requireRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" })
    }
    next()
  }
  
  const requireOwnership = (resourceParam) => async (req, res, next) => {
    const resourceId = req.params[resourceParam]
    const resource = await Resource.findById(resourceId)
    if (!resource || resource.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" })
    }
    next()
  }
  
  # Test cases:
  - "Usuario no puede acceder perfil de otro usuario"
  - "Transporter no puede ver publications de otra empresa"
  - "Usuario desactivado no puede hacer login"
  - "Rate limit previene enumeración de IDs"
  - "Admin no puede accederse a sí mismo sin auditoría"
```

### 2.2 A02 — Cryptographic Failures

```yaml
description: "Previously known as Sensitive Data Exposure — failures in cryptography"

mitigations:
  - "Encrypt all data in transit with TLS 1.3"
  - "Use strong password hashing (bcrypt cost factor 12, Argon2id)"
  - "Never store plaintext passwords or keys"
  - "Secure key management (AWS KMS, HashiCorp Vault)"
  - "Encrypt data at rest for sensitive fields (AES-256-GCM)"
  - "PCI DSS compliance for payment data"
  - "Certificate pinning for mobile apps"
  
implementation:
  # Passwords:
  password_hash: "bcrypt with cost factor 12, no MD5/SHA1 allowed"
  argon2id_config: "memory=65536, iterations=3, parallelism=4"
  
  # TLS Configuration:
  tls_version: "TLS 1.3 only (TLS 1.0/1.1 deprecated)"
  cipher_suite: "ECDHE-RSA-AES256-GCM-SHA384, ECDHE-ECDSA-AES256-GCM-SHA384"
  cipher_suite_mobile: "TLS_AES_128_GCM_SHA256, TLS_AES_256_GCM_SHA384"
  hsts: "max-age=31536000; includeSubDomains; preload"
  certificate: "AWS ACM or Let's Encrypt with auto-renewal"
  
  # Data at rest encryption:
  db_encryption: "AES-256-GCM for sensitive fields (PII, financial)"
  db_encryption_at_rest: "AWS RDS encryption with KMS"
  backup_encryption: "AES-256-GCM, keys separate from data"
  file_storage: "S3 SSE-KMS with customer managed keys"
  
  # Key management:
  key_storage: "AWS KMS or HashiCorp Vault"
  key_rotation: "Every 90 days for data encryption keys (DEKs)"
  key_rotation_cipher: "Every 365 days for master keys (CMKs)"
  secrets_rotation: "Every 30 days for API keys"
  hsm: "AWS CloudHSM for highest sensitivity keys"
```

### 2.3 A03 — Injection

```yaml
description: "SQL, NoSQL, OS, or LDAP injection"

mitigations:
  - "Use parameterized queries / prepared statements"
  - "Use ORM with parameterized queries by default"
  - "Input validation on client AND server side"
  - "Escape output for display contexts"
  - "Use LIMIT/OFFSET to prevent dumping entire tables"
  - "No dynamic query construction with user input"
  
implementation:
  # SQL Injection prevention:
  - "TypeScript: Use Knex.js or Prisma (parameterized queries)"
  - "PROHIBIDO: SELECT * FROM users WHERE id = ${userId}"
  - "PERMITIDO: SELECT * FROM users WHERE id = $1", [userId]
  - "Prisma: prisma.user.findUnique({ where: { id: userId } })"
  
  # NoSQL Injection (MongoDB):
  - "Validate types with Joi/Zod schemas"
  - "Cast ObjectId properly: new ObjectId(userId)"
  - "Never pass user input directly to $where, $function"
  - "Use Mongoose schemas with strict type enforcement"
  
  # XSS Prevention:
  - "Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'"
  - "HTTPOnly and Secure flags on cookies"
  - "Output encoding: DOMPurify for user-generated HTML"
  - "React/Angular auto-escaping (verify default)"
  - "X-XSS-Protection: 1; mode=block"
  
  # Command Injection:
  - "Never use user input in shell commands"
  - "Use libraries instead of system() calls"
  - "If shell required:严格 whitelist of allowed chars"
  
  # CSRF:
  - "SameSite cookie attribute: Strict or Lax"
  - "CSRF tokens on state-changing operations"
  - "Origin/Referer header validation"
```

### 2.4 A04 — Insecure Design

```yaml
description: "Missing or ineffective security controls in the architecture"

mitigations:
  - "Threat modeling during design phase (STRIDE, PASTA)"
  - "Secure design patterns (zero trust, defense in depth)"
  - "Segregation of environments (dev/staging/prod)"
  - "Security Champions in each team"
  - "Regular architecture reviews (quarterly)"
  - "Abuse case documentation"
  
implementation:
  # Zero Trust Architecture:
  - "Never trust; always verify (beyondcorp model)"
  - "Microsegmentation of network"
  - "mTLS for service-to-service communication"
  - "Identity-based access instead of network-based"
  
  # Defense in Depth:
  - "WAF (Web Application Firewall) at edge"
  - "Rate limiting at API Gateway"
  - "Input validation at application layer"
  - "Parameterized queries at database layer"
  - "Encryption at rest at storage layer"
  
  # Environment Separation:
  production_network: "Isolated VPC with private subnets, no direct DB access from internet"
  staging_isolation: "Separate AWS account, no production data"
  dev_data: "Anonymized/synthetic data only"
  network_architecture: "3-tier (web, app, data) with security groups"
```

### 2.5 A05 — Security Misconfiguration

```yaml
description: "Incorrectly configured permissions, unnecessary features enabled"

mitigations:
  - "Hardened base images for containers (CIS benchmarks)"
  - "Automated security configuration checks (Inspec, Chef InSpec)"
  - "Remove unnecessary features/dependencies"
  - "Error messages don't reveal stack traces"
  - "Disable directory listing"
  - "Default credentials must be changed"
  
implementation:
  # Server hardening:
  server_hardening: |
    # SSH: Disable root login, use key-based auth only
    # Firewall: Only ports 80, 443, 22 (jump host) open
    # Disable: TELNET, FTP, rsh, rlogin, SSLv2/v3
    # Enable: auditd, fail2ban, unattended upgrades
    # Kernel: ASLR, DEP, seccomp enabled
    # Sudo: Require password for sudo commands
  
  # Docker security:
  container_security: |
    - No privileged containers
    - Read-only root filesystems
    - Non-root users in containers (USER directive)
    - No sensitive data in image layers (docker history)
    - Regular base image updates (alpine:latest)
    - Health checks defined in Dockerfile
    - Resource limits (memory, CPU)
  
  # Database security:
  database_security: |
    - No root/sa login from network
    - Remove sample databases (test, mysql)
    - Strong passwords for DB users (32+ chars)
    - Minimal privileges for app users
    - SSL connections required
    - Audit logging enabled
  
  # Error handling:
  error_handling: |
    - Custom error pages (404, 500, 403, etc.)
    - Stack traces in logs only, never to client
    - Global exception handler (express error middleware)
    - Log correlation IDs for debugging
    - Generic messages for auth errors (no user enumeration)
```

### 2.6 A06 — Vulnerable Components

```yaml
description: "Using components with known vulnerabilities"

mitigations:
  - "Dependency scanning (Snyk, Dependabot, OWASP Dependency-Check)"
  - "Pin versions in package.json/Dockerfile"
  - "Regular security updates (weekly)"
  - "Remove unused dependencies (npm prune)"
  - "Software Composition Analysis (SCA)"
  - "Monitor CVE databases for affected packages"
  
implementation:
  # CI/CD integration:
  dependency_scan: |
    - GitHub Actions: Snyk scanner on every PR
    - Fail build if critical CVE found
    - Automated PR for security updates
    - License scanning (reject GPL-3.0, AGPL-3.0)
  
  # Container scanning:
  container_scan: |
    - Trivy scan on every Docker image build
    - Block deployment if HIGH/CRITICAL CVEs
    - Weekly vulnerability report
    - Clair scanner for deeper analysis
  
  # JavaScript dependencies:
  js_audit: |
    - npm audit --audit-level=high (in CI)
    - yarn audit --audit-level=high
    - Renovate bot for automated updates
    - lock file checked into git
  
  # Keep components updated:
  update_policy: |
    - Critical CVEs: patch within 24h
    - High CVEs: patch within 7 days
    - Medium CVEs: patch within 30 days
    - Dependencies: update monthly
```

### 2.7 A07 — Authentication Failures

```yaml
description: "Broken authentication mechanisms"

mitigations:
  - "Multi-factor authentication (MFA/2FA) TOTP or WebAuthn"
  - "Strong password policy (12+ chars, complexity)"
  - "Password breach detection (HaveIBeenPwned API)"
  - "Account lockout policies"
  - "Secure session management (JWT with short expiry)"
  
implementation:
  # Password policy:
  password_policy: |
    Minimum: 12 characters
    Require: uppercase, lowercase, number, special char
    Max age: 365 days (warn at 90 days)
    History: last 12 passwords cannot be reused
    Breach check: API call to HIBP on registration/password change
    Common passwords: reject top 10000 list
  
  # MFA implementation:
  mfa_methods: |
    - TOTP (Google Authenticator, Authy) - PRIMARY
    - WebAuthn/FIDO2 (hardware keys) - RECOMMENDED
    - Recovery codes (one-time, 10 codes, 12 digits each)
    - Backup email verification (less preferred)
  
  # Session management:
  session_config: |
    - JWT access token: 15 min expiry (short)
    - JWT refresh token: 7 day expiry, stored in httpOnly cookie
    - Refresh token rotation on use (one-time use)
    - Logout invalidates both tokens (token blacklisting)
    - Concurrent sessions: max 3 per user (configurable)
    - Device fingerprinting for anomaly detection
  
  # Brute force protection:
  rate_limiting: |
    - Login: 5 attempts per 15 min per IP, then captcha
    - API: 100 requests/min per user
    - Lock account: 10 failed attempts = 30 min lock
    - Progressive delays: 1s, 2s, 4s, 8s, 16s
```

### 2.8 A08 — Data Integrity Failures

```yaml
description: "Software and data integrity issues"

mitigations:
  - "Digital signatures for code/artifacts (Cosign, GPG)"
  - "Integrity checking for dependencies (Subresource Integrity)"
  - "CI/CD pipeline security"
  - "Immutable infrastructure"
  - "Backup integrity verification (hash checks)"
  
implementation:
  # Artifact signing:
  artifact_signing: |
    - Docker images signed with Cosign (Sigstore)
    - npm packages with npm provenance
    - SBOM (Software Bill of Materials) generated
    - Verify signatures before deployment
  
  # CI/CD security:
  cicd_security: |
    - No secrets in pipelines (use AWS Secrets Manager)
    - Signed commits required for main branch
    - Branch protection: 2 reviewers minimum
    - Security scanning in pipeline gates
    - Static analysis before merge
    - Dynamic analysis in staging
  
  # Immutable infrastructure:
  immutable_servers: |
    - AMIs rebuilt on every deploy (no in-place updates)
    - Containers use immutable tags (not :latest)
    - Configuration via Terraform/IaC only
    - No manual changes in production
  
  # Backup verification:
  backup_policy: |
    - Daily automated backups (AWS RDS Snapshots)
    - Weekly restore tests documented
    - Backups encrypted (AES-256) and signed
    - Offsite replication (cross-region)
    - Backup retention: 30 days daily, 1 year monthly
```

### 2.9 A09 — Logging & Monitoring Failures

```yaml
description: "Insufficient logging and monitoring for incident response"

mitigations:
  - "Centralized logging (ELK Stack, Loki, CloudWatch)"
  - "Security monitoring (SIEM) - Splunk, Wazuh, Elastic SIEM"
  - "Alerting for critical events (PagerDuty, OpsGenie)"
  - "Incident response procedures (IRP)"
  - "Regular penetration testing (annual, with follow-up)"
  
implementation:
  # What to log (W3C Extended Log Format):
  log_events: |
    - Authentication: success/failure, IP, timestamp, user-agent, geo
    - Authorization: access denied events, privilege escalation attempts
    - Data access: sensitive data queries, bulk exports
    - Configuration changes: admin actions, system changes
    - Security events: WAF blocks, rate limit triggers
    - All API calls: request/response (sanitized), latency
  
  # Alert rules:
  alert_rules: |
    - Multiple failed logins (>5 in 10 min per IP)
    - Access from new IP/country (geo-velocity)
    - Unusual data export volume (>100 records)
    - API errors spike (>5% error rate)
    - Database connection errors
    - Suspicious patterns (CVE in progress)
    - Privilege escalation detected
  
  # Monitoring dashboards:
  dashboards: |
    - Real-time security events
    - Attack attempt detection (visualization)
    - Compliance status (GDPR, PCI DSS)
    - Vulnerability trends (chart over time)
    - MTTR (Mean Time To Response)
  
  # Incident response:
  incident_response: |
    - Playbooks: ransomware, data breach, DDoS, insider threat
    - On-call rotation 24/7 (2-person minimum)
    - Communication channels: encrypted (Signal, Element)
    - Post-incident review (PIR) within 72h
    - Legal notification requirements documented
```

### 2.10 A10 — Server-Side Request Forgery (SSRF)

```yaml
description: "Fetching external resources without validating URLs"

mitigations:
  - "Validate and sanitize all user-provided URLs"
  - "Use allowlists for permitted domains"
  - "Disable HTTP redirects in service clients"
  - "Network segmentation (no direct internal access)"
  
implementation:
  # URL validation:
  url_validation: |
    - Parse URL, verify scheme (only https allowed, no javascript:, data:)
    - Block private IPs: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    - Block localhost: 127.0.0.1, ::1, 0.0.0.0
    - Block AWS metadata: 169.254.169.254, 169.254.169.253
    - Use built-in URL libraries (url.parse), don't regex yourself
    - Resolve URL and verify final destination
  
  # Allowlist approach:
  allowed_domains: |
    - api.stripe.com (payment webhooks)
    - maps.googleapis.com (geocoding, maps)
    - api.whatsapp.com (notifications)
    - s3.amazonaws.com (file uploads only to own bucket)
  
  # Network segmentation:
  network_rules: |
    - App servers cannot access AWS metadata (169.254.169.254)
    - Database only accessible from app tier (security groups)
    - Egress only through NAT gateway (inspect traffic)
    - No direct SSH from internet (jump host only)
```

---

## 3. Rate Limiting y DDoS Mitigation

### 3.1 Rate Limiting Implementation

```yaml
rate_limiting_architecture:
  approach: "Token bucket algorithm with Redis"
  
  tiers:
    anonymous:
      requests_per_minute: 30
      burst: 10
      block_duration: 5 minutes
      
    authenticated:
      requests_per_minute: 100
      burst: 20
      block_duration: 10 minutes
      
    premium:
      requests_per_minute: 500
      burst: 50
      block_duration: 15 minutes
      
    api_key:
      requests_per_minute: 1000
      burst: 100
      block_duration: 30 minutes

endpoints:
  /api/auth/login:
    limit: "5 attempts per 15 min per IP"
    penalty: "captcha required for 15 min"
    
  /api/auth/register:
    limit: "3 attempts per hour per IP"
    penalty: "email verification required"
    
  /api/payments/*:
    limit: "10 per min per user"
    penalty: "manual review flag"
    
  /api/admin/*:
    limit: "100 per hour per admin"
    penalty: "security alert"

implementation:
  redis_sliding_window: |
    Key: "ratelimit:{user_id}:{endpoint}"
    TTL: 60 seconds
    Algorithm: Sliding window log
    
  response_headers:
    X-RateLimit-Limit: 100
    X-RateLimit-Remaining: 95
    X-RateLimit-Reset: 1640000000
    Retry-After: 60 (only on 429)
```

### 3.2 DDoS Mitigation Strategy

```yaml
layers_of_protection:
  edge:
    - "Cloudflare/AWS Shield Advanced at DNS level"
    - "Anycast network for traffic distribution"
    - "Bot detection (machine learning)"
    - "Geo-blocking (configurable per country)"
    - "Challenge: CAPTCHA, JS challenge, browser verification"
    
  network:
    - "AWS WAF with rate-based rules"
    - "Security groups with stateful filtering"
    - "DDoS protection in VPC (AWS DDoS Protection)"
    - "Connection limits per IP (100 concurrent)"
    
  application:
    - "Request validation early in stack"
    - "Resource exhaustion protection"
    - "Slow client handling (timeout limits)"
    - "Payload size limits (10MB max)"

attack_mitigation:
  volumetric:
    - "Traffic scrubbing at edge (100Gbps+ capacity)"
    - "Rate limiting downstream"
    - "Anycast distribution"
    
  protocol:
    - "SYN proxy for SYN flood"
    - "TCP connection limits"
    - "TLS handshake validation"
    
  application:
    - "Semantic validation (not just rate)"
    - "Behavioral analysis"
    - "Challenge-response for suspicious clients"
```

---

## 4. Security Headers

### 4.1 Header Configuration

```yaml
security_headers:
  Content-Security-Policy: |
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://api.stripe.com https://maps.googleapis.com;
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
    object-src 'none';
    upgrade-insecure-requests;
    
  Strict-Transport-Security: |
    max-age=31536000;
    includeSubDomains;
    preload;
    
  X-Content-Type-Options: "nosniff"
  
  X-Frame-Options: "DENY"
  
  X-XSS-Protection: "1; mode=block; report=https://spottruck.com/xss-report"
  
  Referrer-Policy: "strict-origin-when-cross-origin"
  
  Permissions-Policy: |
    camera=();
    microphone=();
    geolocation=(self);
    payment=(self);
    
  Cache-Control: "no-store, no-cache, must-revalidate, private"
  
  Pragma: "no-cache"

cors_configuration:
  allowed_origins:
    production: "https://spottruck.com, https://www.spottruck.com"
    development: "http://localhost:3000"
    
  allowed_methods: "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  
  allowed_headers: "Content-Type, Authorization, X-Request-ID"
  
  exposed_headers: "X-RateLimit-Remaining, X-RateLimit-Reset"
  
  credentials: true
  
  max_age: 86400
```

---

## 5. Compliance: GDPR y LOPD Argentina

### 5.1 GDPR — Principios Aplicables

```yaml
gdpr_principles:
  lawfulness:
    article: "Art. 6 - Lawful processing"
    implementation: |
      - Consent for marketing emails (Art. 6.1.a)
      - Contract necessity for service data (Art. 6.1.b)
      - Legal obligation for tax records (Art. 6.1.c)
      - Legitimate interest for fraud prevention (Art. 6.1.f)
      - Consent withdrawal mechanism easily accessible
      
  purpose_limitation:
    article: "Art. 5 - Purpose limitation"
    implementation: |
      - Data collected only for stated purposes
      - No secondary use without explicit consent
      - Anonymization for analytics (k-anonymity ≥5)
      - Privacy by design in all features
      
  data_minimization:
    article: "Art. 5 - Data minimization"
    implementation: |
      - Only necessary data collected
      - Phone optional for registration
      - Address required only for billing/shipping
      - No GPS tracking without explicit consent
      
  accuracy:
    article: "Art. 5 - Accuracy"
    implementation: |
      - Users can view/edit profile data (Art. 15)
      - Data verification prompts quarterly
      - Self-service data correction portal
      - Automated data quality checks
      
  storage_limitation:
    article: "Art. 5 - Storage limitation"
    implementation: |
      - Inactive accounts deleted after 3 years (notified at 2 years)
      - Transaction logs kept 7 years (tax compliance)
      - Reviews anonymized after 2 years
      - Backup retention: 90 days encrypted
      
  integrity_confidentiality:
    article: "Art. 5, 32 - Security"
    implementation: |
      - Encryption at rest and in transit
      - Pseudonymization where possible
      - Regular security testing (pen test annual)
      - DPO appointed (Art. 37)
      
  accountability:
    article: "Art. 5.2 - Accountability"
    implementation: |
      - Privacy impact assessments (DPIA) for high-risk processing
      - Records of processing activities (RoPA)
      - Data protection policies documented
      - Regular audits (annual third-party)
```

### 5.2 LOPD Argentina — Ley 25.326

```yaml
lopd_requirements:
  data_registry:
    description: "Registro de base de datos de datos personales"
    implementation: |
      - Register all databases containing personal data with AAIP
      - Include: purpose, data types, retention, recipients, transfers
      - Update registry within 30 days of changes
      - Annual renewal with AAIP
      - Registration number displayed in privacy policy
      
  privacy_notice:
    description: "Aviso de privacidad (Art. 6)"
    implementation: |
      - Clear and plain language at collection points
      - Info: controller identity, purpose, data types, rights
      - Recipients of data (third parties, international transfers)
      - Available in Spanish (primary)
      - Easy to access (no buried links, linked from footer)
      - Consent obtained before data collection
      
  data_subject_rights:
    description: "Derechos de los titulares (Art. 14, 16)"
    implementation: |
      - Access (Art. 14): Request all data held (15 days response)
      - Rectification (Art. 16): Easy correction process
      - Deletion: "Right to be forgotten" with legal exceptions
      - Portability: Data export in JSON/CSV format
      - Opposition: Right to object to processing
      - Response time: 10 business days maximum
      - No charge for exercising rights (first request)
      - Verified identity required (video call or document)
      
  breach_notification:
    description: "Notificación de breach (Art. 17)"
    implementation: |
      - Detect within 24h (SIEM, IDS/IPS)
      - Notify AAIP within 72h if likely risk to rights
      - Notify affected users immediately if high risk
      - Document all breaches in incident log
      - Remediation plan documented
      
  international_transfers:
    description: "Transferencias internacionales (Art. 12)"
    implementation: |
      - Only to countries with adequate protection
      - Standard contractual clauses for other transfers
      - Explicit consent for new transfer destinations
      - Current transfers: AWS us-east-1 (adequacy decision)
      
  consent:
    description: "Consentimiento (Art. 5, 6)"
    implementation: |
      - Explicit, informed, unambiguous consent
      - Separate checkbox from Terms & Conditions
      - Easy withdrawal mechanism (account settings)
      - Document consent with timestamp, IP, purpose
      - Consent audit trail maintained
      
  data_quality:
    description: "Calidad de los datos (Art. 4)"
    implementation: |
      - Data must be relevant, appropriate, not excessive
      - Update data on user request
      - Delete inaccurate or obsolete data
      - Verify data accuracy periodically
```

### 5.3 Data Handling Matrix

```yaml
data_categories:
  personal_identifiers:
    data_types: ["name", "email", "phone", "address", "DNI"]
    legal_basis: "Contract (Art. 6.1.b)"
    retention: "Active account + 2 years post-deletion"
    encrypted: true
    special_category: false
    
  financial_data:
    data_types: ["payment methods", "bank accounts", "CBU"]
    legal_basis: "Legal obligation (Art. 6.1.c) - tax law"
    retention: "7 years for tax compliance"
    encrypted: true
    pci_dss: true
    special_category: false
    
  location_data:
    data_types: ["pickup coordinates", "delivery coordinates", "route history"]
    legal_basis: "Legitimate interest + consent (Art. 6.1.f, 6.1.a)"
    retention: "3 years for dispute resolution"
    encrypted: true
    consent_required: true
    special_category: false
    
  professional_data:
    data_types: ["company name", "CUIT", "business type", "fleet info"]
    legal_basis: "Contract (Art. 6.1.b)"
    retention: "Active account + 2 years"
    encrypted: true
    special_category: false
    
  sensitive_data:
    data_types: ["driver's license", "insurance documents", "criminal record"]
    legal_basis: "Explicit consent (Art. 6.1.a)"
    retention: "Duration of contract only"
    encrypted: true
    special_category: true
    extra_protection: "Additional access controls, audit logging"
    
  reviews_ratings:
    data_types: ["comments", "ratings", "interaction history"]
    legal_basis: "Consent (Art. 6.1.a)"
    retention: "Until user requests deletion"
    anonymizable: true
    pseudonymization: "User ID removed, review kept anonymous"
```

---

## 6. Encryption Architecture

### 6.1 Encryption at Rest

```yaml
encryption_at_rest:
  database:
    type: "AES-256-GCM"
    key_management: "AWS KMS (customer managed keys)"
    encrypted_tables:
      - "users (pii fields)"
      - "payments (financial data)"
      - "documents (licenses, insurance)"
    transparent_data_encryption: true
    
  file_storage:
    type: "AES-256-GCM"
    key_management: "AWS S3 SSE-KMS"
    bucket_policy: "Enforce encryption"
    versioning: true (for backup)
    
  backups:
    type: "AES-256-GCM"
    key_management: "Separate KMS key"
    storage: "AWS S3 Glacier (cross-region)"
    
  redis_cache:
    type: "AES-256-GCM for session data"
    at_rest: true
    # Note: Redis RDB snapshots encrypted separately

key_hierarchy:
  master_key: |
    AWS KMS CMK (rotated annually)
    Stored in AWS CloudHSM for critical keys
    
  data_encryption_keys: |
    Generated per table/feature
    Encrypted by master key
    Stored in key store (Vault)
    
  transport_keys: |
    TLS certificates (Let's Encrypt, auto-renewal)
    Certificate private keys in AWS ACM
```

### 6.2 Encryption in Transit

```yaml
encryption_in_transit:
  tls_configuration:
    version: "TLS 1.3 only"
    fallback: "TLS 1.2 (for legacy compatibility, FIPS mode)"
    cipher_suites:
      - "TLS_AES_256_GCM_SHA384"
      - "TLS_CHACHA20_POLY1305_SHA256"
      - "ECDHE-RSA-AES256-GCM-SHA384"
      - "ECDHE-ECDSA-AES256-GCM-SHA384"
    certificate_type: "RSA 4096 or ECDSA P-384"
    
  internal_services:
    mTLS: true
    service_mesh: "Istio/Linkerd"
    certificate_rotation: "90 days"
    
  client_connections:
    mobile_apps: "TLS 1.3, certificate pinning"
    web_browsers: "TLS 1.3, HSTS preload"
    api_clients: "TLS 1.3, API key + TLS"
```

### 6.3 Key Management

```yaml
key_management:
  aws_kms:
    key_types: |
      - Customer Master Keys (CMK) for key encryption
      - Data keys for field-level encryption
    rotation: |
      - CMK: automatic rotation every year
      - Data keys: manual rotation every 90 days
    access_control: |
      - IAM policies for key access
      - Principle of least privilege
      - Break-glass procedures documented
      
  hashicorp_vault:
    use_cases: |
      - API keys and secrets (dynamic secrets)
      - Database credential rotation
      - Certificate authority (internal PKI)
    audit_logging: |
      - All key access logged
      - Logs exported to SIEM
      - Alert on unusual access
      
  secret_rotation:
    database: "Every 30 days"
    api_keys: "Every 30 days"
    encryption_keys: "Every 90 days"
    certificates: "Every 60 days (Let's Encrypt 90-day limit)"
```

---

## 7. Security Testing Plan

### 7.1 Testing Schedule

```yaml
security_testing:
  static_analysis:
    frequency: "Every commit (CI/CD pipeline)"
    tools: ["SonarQube", "Snyk", "npm audit", "Bandit (Python)"]
    fail_criteria: "HIGH/CRITICAL vulnerabilities block merge"
    
  dynamic_analysis:
    frequency: "Weekly (DAST)"
    tools: ["OWASP ZAP", "Burp Suite Professional"]
    scope: "Staging environment full scan"
    report: "Weekly security report to security team"
    
  penetration_testing:
    frequency: "Annual (external vendor)"
    scope: "Full application + API + infrastructure"
    deliverables: ["Executive summary", "Technical report", "Remediation plan", "Retest"]
    scope_expansion: "Quarterly internal tests on critical features"
    
  api_security:
    frequency: "Quarterly"
    focus: ["Authentication", "Authorization", "Rate limiting", "Injection"]
    tools: ["Postman", "REST Assured", "Astra"]
    
  incident_response_drill:
    frequency: "Semi-annual"
    scenario: "Data breach simulation (tabletop + technical)"
    participants: ["Security team", "DevOps", "Legal", "PR"]
```

### 7.2 Security Metrics

```yaml
security_metrics:
  vulnerability_metrics:
    - "Open vulnerabilities by severity (target: 0 critical, <5 high)"
    - "Mean time to remediate (MTTR): Critical <24h, High <7d"
    - "Vulnerability recurrence rate (target: <5%)"
    
  incident_metrics:
    - "Security incidents per month (target: <3)"
    - "False positive rate in alerts (target: <20%)"
    - "Incident detection time (MTTD: target <1h)"
    - "Containment time (target: <30 min)"
    
  compliance_metrics:
    - "Policy compliance percentage (target: 100%)"
    - "Training completion rate (target: 100%)"
    - "Findings remediated on time (target: 95%)"
    - "Third-party vendor risk assessments (annual)"
```

---

## 8. Security Architecture

### 8.1 Security Layers

```
LAYERS OF DEFENSE:

EDGE LAYER (CDN/WAF):
├── DDoS protection (Cloudflare/AWS Shield)
├── WAF rules (OWASP Top 10, custom rules)
├── Bot detection (ML-based)
├── Geo-blocking (Argentina-primary)
├── Rate limiting (token bucket)
└── SSL/TLS termination

LOAD BALANCER:
├── SSL/TLS termination
├── Certificate validation
├── Header security (HSTS, CSP injection)
├── Access logging (full request/response)
└── Health checks (unhealthy instance removal)

APPLICATION LAYER:
├── Authentication (JWT RS256, MFA)
├── Authorization (RBAC, resource ownership)
├── Input validation (Zod schemas, Joi)
├── Output encoding (DOMPurify)
├── Security headers (CSP, etc.)
└── Session management (secure cookies)

DATABASE LAYER:
├── Parameterized queries (Prisma, Knex)
├── Least privilege access (IAM, security groups)
├── Encryption at rest (AES-256-GCM)
├── Audit logging (all queries on sensitive tables)
└── Backup encryption (cross-region)

MONITORING LAYER:
├── SIEM (Elastic Security)
├── Real-time alerting (PagerDuty)
├── Log aggregation (ELK/Loki)
├── Anomaly detection (ML models)
└── Penetration testing (annual, external)
```

### 8.2 Security Controls Catalog

```yaml
controls:
  preventive:
    - "Input validation (server-side Zod/Joi)"
    - "Output encoding (DOMPurify)"
    - "Parameterized queries (all DB access)"
    - "MFA for admin and premium users"
    - "Rate limiting (Redis token bucket)"
    - "IP allowlisting for admin (optional)"
    - "API key authentication for services"
    
  detective:
    - "Anomaly detection in logs (ML)"
    - "Failed login alerting (>5/10min)"
    - "Unusual API access patterns"
    - "Database query monitoring (sensitive data)"
    - "WAF blocking alerts"
    - "Certificate expiration monitoring"
    
  corrective:
    - "Incident response playbooks"
    - "Automated blocking (fail2ban)"
    - "Session revocation (token blacklisting)"
    - "Password reset enforcement"
    - "Auto-scaling under DDoS"
    - "DRP activation procedures"
    
  administrative:
    - "Security training (annual, OWASP)"
    - "Code review security checklist"
    - "Penetration testing (annual)"
    - "Vendor security assessment"
    - "Background checks for admin access"
    - " NDA and security agreements"
```

---

_Ultima actualización: 2026-06-04 16:30 ART_

_Versión: 1.1_

_Próxima revisión: 2026-09-04_
