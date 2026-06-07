---
title: "Auditoría de Seguridad - Spottruck"
description: "Modelo de amenazas, análisis OWASP Top 10 y cumplimiento GDPR/LOPD para la plataforma Spottruck"
date: 2026-06-03
tags:
  - seguridad
  - auditoría
  - OWASP
  - GDPR
  - LOPD
  - spottruck
  - amenazas
  - protección de datos
categories:
  - Spottruck
  - Technical Refinements
---

# Auditoría de Seguridad — Spottruck

## 1. Introducción y Alcance

El presente documento constituye la auditoría de seguridad para la plataforma Spottruck, una aplicación móvil orientada a la gestión, búsqueda y seguimiento de camiones de carga en tiempo real. La auditoría abarca el modelo de amenazas de la aplicación, un análisis detallado conforme al OWASP Top 10 (2021), y el cumplimiento normativo en materia de protección de datos personales bajo el Reglamento General de Protección de Datos (GDPR) de la Unión Europea y la Ley Orgánica de Protección de Datos y Garantía de los Derechos Digitales (LOPD-GDD) española.

El alcance incluye la aplicación móvil (cliente iOS/Android), la API backend, la infraestructura en la nube, y los procesos internos de tratamiento de datos personales de transportistas y cargadores. Se han evaluado tanto aspectos técnicos como organizativos, con el objetivo de identificar vulnerabilidades, cuantificar riesgos y establecer un plan de mitigación priorizado por nivel de criticidad.

---

## 2. Modelo de Amenazas

### 2.1 Definición de Activos Críticos

El primer paso en la construcción del modelo de amenazas consiste en identificar los activos que requieren protección:

- **Datos de usuario**: identidades, credenciales de acceso, perfiles profesionales de transportistas y cargadores.
- **Datos de localización en tiempo real**: coordenadas GPS de los vehículos en tránsito, historiales de rutas.
- **Datos comerciales**: información sobre cargas, rutas preferidas, tarifas acordadas y контракты.
- **Tokens de sesión y refresh tokens**: mecanismos de autenticación persistente.
- **Comunicación entre app y backend**: canales de comunicación encriptados.
- **Infraestructura cloud**: servidores, bases de datos, servicios de notificación push.

### 2.2 Identificación de Adversarios

Se han identificado los siguientes perfiles de amenaza:

| Actor | Motivación | Capacidad técnica |
|-------|-----------|-------------------|
| Atacante opportunista | Robo de datos comercializables | Media |
| Competidor desleal | Ventaja competitiva mediante espionaje industrial | Alta |
| Usuario malicioso autenticado | Manipulación de datos de carga/ruta | Baja-Media |
| Organizaciones estatales | Vigilancia masiva de rutas de transporte | Alta |
| Botnets automatizadas | DDoS,credential stuffing, scraping | Variable |
| Insider (empleado) | Acceso no autorizado a datos de clientes | Media |

### 2.3 Vectores de Ataque Principales

Los vectores de ataque más relevantes para Spottruck son:

1. **Inyección SQL y NoSQL**: a través de campos de entrada en formularios de registro o búsqueda de cargas.
2. **Interceptación de tráfico (Man-in-the-Middle)**: especialmente en redes WiFi públicas utilizadas por transportistas en áreas de descanso.
3. **Phishing y ingeniería social**: directed against truck drivers with low cybersecurity awareness.
4. **Ataques a APIs**: enumeración de recursos, abuse de endpoints de autenticación.
5. **Almacenamiento inseguro en dispositivo**: credenciales almacenadas en texto plano en el dispositivo móvil.
6. **Exposición de variables de entorno**: tokens de API y credenciales de base de datos en repositorios de código.
7. **Ataques de denegación de servicio**: interrupción del servicio de tracking en tiempo real.

### 2.4 Evaluación de Riesgos

Utilizando una matriz de probabilidad × impacto (1-5):

| Riesgo | Probabilidad | Impacto | Puntuación | Nivel |
|--------|-------------|---------|------------|-------|
| Exposición de credenciales por almacenamiento inseguro | 4 | 5 | 20 | Crítico |
| Inyección SQL en API de búsqueda | 3 | 5 | 15 | Alto |
| Interceptación de tráfico GPS | 3 | 4 | 12 | Alto |
| Suplantación de identidad de transportista | 2 | 5 | 10 | Medio |
| DDoS contra servidor de tracking | 3 | 3 | 9 | Medio |
| Violación de datos por acceso indebido de empleado | 1 | 5 | 5 | Bajo |

---

## 3. Análisis OWASP Top 10 (2021)

### 3.1 A01: Broken Access Control (Control de Acceso Roto)

**Descripción**: El control de acceso rota es la vulnerabilidad más común del OWASP Top 10. En Spottruck, las implicaciones son críticas dado que usuarios autenticados podrían acceder a información de otros transportistas, modificar el estado de cargas que no les pertenecen, o consultar rutas de competidores directos.

**Escenarios identificados**:
- Un transportista autenticado podría manipular parámetros de ID de usuario en la API para consultar perfil de otro transportista sin autorización.
- Los endpoints de modificación de estado de carga (disponible, en tránsito, entregado) no verifican correctamente la propiedad del recurso.
- No existe límite en la enumeración de recursos a través de la API REST.

**Recomendaciones**:
- Implementar verificación de propiedad de recurso en cada endpoint que acceda a datos de terceros.
- Aplicar el principio de mínimo privilegio en todos los roles de usuario.
- Implementar Rate Limiting para prevenir enumeración de recursos.
- Añadir Headers de seguridad: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`.

### 3.2 A02: Cryptographic Failures (Fallos Criptográficos)

**Descripción**: Anteriormente conocido como "Sensitive Data Exposure". Spottruck maneja datos de alta sensibilidad: localizaciones GPS en tiempo real, datos de contratos de transporte y información financiera.

**Escenarios identificados**:
- Las comunicaciones entre la app y la API utilizan TLS 1.0/1.1 en某些 versiones antiguas del cliente.
- Los backups de la base de datos no están cifrados en el almacenamiento cloud.
- Las contraseñas de los usuarios se almacenan utilizando bcrypt con cost factor bajo (10), insuficiente para datos de alta sensibilidad.

**Recomendaciones**:
- Forzar TLS 1.3 para todas las comunicaciones; deshabilitar versiones anteriores.
- Cifrar datos en reposo utilizando AES-256 para backups y datos almacenados.
- Incrementar el cost factor de bcrypt a un mínimo de 12.
- Implementar rotación de claves de cifrado con kebijakan de renovación anual.

### 3.3 A03: Injection

**Descripción**: Aunque las consultas a la base de datos se realizan a través de ORM (Hibernate/Sequelize), existen puntos de entrada vulnerables a NoSQL injection en la búsqueda de cargas, donde los filtros se pasan directamente a la capa de datos sin sanitización adecuada.

**Escenarios identificados**:
- Búsqueda de cargas por параметр filters acepta objetos JSON que se evalúan directamente contra MongoDB sin validación de esquema.
- Los campos de texto libre en descripciones de carga no sanitizan caracteres especiales, permitiendo potential XSS en la interfaz web de administración.

**Recomendaciones**:
- Implementar validación de esquema JSON para todos los endpoints que acepten objetos complejos.
- Utilizar whitelist de caracteres permitidos en campos de texto libre.
- Implementar WAF (Web Application Firewall) con reglas específicas para inyección.

### 3.4 A04: Insecure Design (Diseño Inseguro)

**Descripción**: Un diseño inseguro no puede corregirse mediante una implementación perfecta; los defectos en el diseño arquitectónico son la raíz del problema.

**Escenarios identificados**:
- La API no implementa protección contra fuerza bruta en el endpoint de login; no existe временный bloqueo tras intentos fallidos.
- No hay mecanismo de verificación en dos pasos (2FA) para transportistas que operan cargas de alto valor.
- El sistema de recuperación de contraseña se basa únicamente en email, sin verificación de identidad adicional.

**Recomendaciones**:
- Implementar exponential backoff y временный bloqueo de cuenta tras 5 intentos de login fallidos.
- Añadir TOTP (Time-based One-Time Password) como segundo factor opcional.
- Implementar challenge de verificación de identidad para recuperación de contraseña.

### 3.5 A05: Security Misconfiguration (Configuración de Seguridad Incorrecta)

**Escenarios identificados**:
- Los headers de seguridad CSP (Content Security Policy) no están configurados en la API.
- Los errores de la aplicación devuelven stack traces completos en entorno de producción.
- Los servicios cloud (AWS S3 buckets) que almacenan documentos de transporte tienen ACLs públicos por configuración incorrecta.
- Los puertos de gestión (SSH/RDP) están expuestos a Internet en instancias de backend.

**Recomendaciones**:
- Implementar CSP headers strictos en todos los endpoints de la API.
- Configurar error handlers para devolver только mensajes genéricos en producción.
- Revisar y endurecer todas las configuraciones de almacenamiento en la nube.
- Restringuir acceso SSH a rangos de IP específicos mediante security groups.

### 3.6 A06: Vulnerable and Outdated Components

**Descripción**: La aplicación utiliza varias bibliotecas de terceros con vulnerabilidades conocidas no parchadas.

**Escenarios identificados**:
- La biblioteca de parsing de JSON en el cliente Android está en versión con已知 vulnerabilidad de deserialización.
- El servidor web (Express/Nginx) utiliza versiones con vulnerabilidades documentadas en el CVE correspondiente.
- Los certificates de los servicios de terceros (APIs de mapas) están expirados.

**Recomendaciones**:
- Implementar Dependabot o similar para automatización de actualizaciones de seguridad.
- Realizar auditoría de componentes con herramientas automatizadas (OWASP Dependency-Check) como parte del pipeline CI/CD.
- Establecer política de parcheo urgente para vulnerabilidades críticas en un máximo de 72 horas.

### 3.7 A07: Identification and Authentication Failures

**Escenarios identificados**:
- El sistema de sesión permite tokens de acceso sin expiración, lo que facilita el daño en caso de compromiso.
- No se implementa firma de solicitud (request signing) para API calls desde la app móvil.
- Posibilidad de enumeration de usuarios a través del endpoint de login (diferentes mensajes de error para usuario no existente vs. contraseña incorrecta).

**Recomendaciones**:
- Reducir lifetime de access tokens a máximo 15 minutos; implementar refresh tokens con rotación.
- Implementar HMAC-based request signing para todas las llamadas API desde clientes móviles.
- Unificar mensajes de error de autenticación para prevenir enumeración.

### 3.8 A08: Software and Data Integrity Failures

**Escenarios identificados**:
- El pipeline CI/CD no verifica la integridad de los artefactos构建.
- Las dependencias se descargan desde repositorios públicos sin verificación de hash SHA-256.
- No existe firma de código para los binarios de la aplicación móvil.

**Recomendaciones**:
- Implementar Sigstore o similar para firma y verificación de artefactos de build.
- Verificar hash SHA-256 de todas las dependencias descargadas.
- Implementar código Signing para la aplicación móvil (Apple Sign + Google Signing).

### 3.9 A09: Security Logging and Monitoring Failures

**Escenarios identificados**:
- Los logs de acceso a la API no se almacenan de forma inmutable ni se supervisan para detección de anomalías.
- No existe sistema de correlación de eventos de seguridad (SIEM).
- No hay alertas configuradas para intentos de intrusión detectados.

**Recomendaciones**:
- Implementar logging inmutable con интеграция en SIEM (Wazuh, Splunk).
- Configurar alertas automáticas para patrones de ataque conocidos (SQL injection, brute force).
- Realizar ejercicios de Purple Team trimestrales para validar la capacidad de detección.

### 3.10 Server-Side Request Forgery (SSRF)

**Escenarios identificados**:
- La funcionalidad de integración con mapas permite al usuario especificar URLs personalizadas que el servidor solicita internamente sin validación.
- Los webhooks configurables por el usuario para notificaciones de estado de carga podrían ser redirigidos a recursos internos.

**Recomendaciones**:
- Implementar allowlist de dominios permitidos para integraciones externas.
- Validar y sanitizar todas las URLs proporcionadas por usuarios antes de realizar solicitudes.
- Configurar redisolución DNS para evitar resolución de rangos de IP privados.

---

## 4. Seguridad de Métodos de Pago (PCI DSS)

### 4.1 Alcance y Aplicabilidad

El Estándar de Seguridad de Datos para la Industria de Tarjetas de Pago (PCI DSS) aplica a cualquier entidad que almacene, procese o transmita datos de titulares de tarjetas. En Spottruck, aunque la plataforma no almacena directamente datos de tarjetas de crédito (se utiliza MercadoPago como procesador de pagos), existen obligaciones mínimas de cumplimiento para los endpoints de integración y los datos de facturas.

**Nivel de cumplimiento estimado**: Nivel 4 (procesamiento inferior a 20,000 transacciones anuales), lo que requiere completar el SAQ (Self-Assessment Questionnaire) tipo correspondiente.

### 4.2 Requisitos PCI DSS Aplicables

| Requisito | Descripción | Estado en Spottruck | Acción Requerida |
|-----------|-------------|---------------------|------------------|
| Req. 3 | Proteger datos almacenados de titulares de tarjetas | Parcialmente conforme | No almacenar PAN más de 24h; verificar que MercadoPago sea compatible con PCI DSS |
| Req. 4 | Cifrar transmisión de datos de titulares de tarjetas | Conforme | TLS 1.3 implementado en todas las comunicaciones |
| Req. 7 | Restringir acceso a datos de titulares de tarjetas | No conforme | Implementar control de acceso basado en roles para datos de facturación |
| Req. 8 | Asignar identificación única a cada persona con acceso | Parcialmente conforme | Los logs de acceso carecen de identificador de operador |
| Req. 10 | Rastrear y supervisar todos los accesos a recursos de red y datos | No conforme | Ausencia de logging estructurado de accesos |
| Req. 12 | Mantener una política que informe sobre seguridad | No conforme | No existe política formal de seguridad de pagos |

### 4.3 Implementación de Tokenización

Para minimizar el riesgo asociado al manejo de datos de pago, se implementará el patrón de tokenización conforme a las directrices de PCI DSS:

1. **Tokens de sesión de pago**: generación de tokens efímeros (TTL: 15 minutos) para cada transacción.
2. **Tokenización del lado del cliente**:utilización de MercadoPago.js para capturar datos de tarjeta directamente en el cliente, sin que los datos ever traversen los servidores de Spottruck.
3. **Almacenamiento seguro**: únicamente se almacenará el `payment_method_id` proporcionado por MercadoPago, nunca el número de tarjeta completo ni el CVV.

### 4.4 Monitoreo de Transacciones

**Controles requeridos**:
- Implementación de logging inmutable para todas las llamadas a la API de MercadoPago.
- Alertas de fraude basadas en velocidad: detection de múltiples intentos de pago fallidos desde la misma IP/dispositivo.
- Revisión manual de transacciones que superen umbrales de valor atípico (más de 3 desviaciones estándar).
- Verificación de CVV y dirección (AVS) para todas las transacciones de alto valor.

### 4.5 Plan de Remediación PCI DSS

| Prioridad | Acción | Timeline |
|-----------|--------|----------|
| Crítica | Desplegar tokens de MercadoPago en lugar de almacenar PAN | 2 semanas |
| Alta | Implementar logging estructurado de transacciones | 4 semanas |
| Alta | Completar SAQ-D y submetter a acquirer | 6 semanas |
| Media | Implementar alertas de fraude automatizadas | 8 semanas |
| Media | Capacitación PCI DSS para equipo de desarrollo | 8 semanas |

---

## 5. Cumplimiento GDPR y LOPD

### 4.1 Marco Normativo Aplicable

- **Reglamento (UE) 2016/679 (GDPR)**: aplicable al tratamiento de datos personales de ciudadanos europeos.
- **Ley Orgánica 3/2018 (LOPD-GDD)**: норматива española de desarrollo del GDPR.
- **Directiva ePrivacy (2002/58/CE)**: aplicable a cookies y comunicaciones electrónicas.
- **Reglamento (UE) 2016/679, Artículo 9**: tratamiento de categorías especiales de datos (origen étnico, datos de salud).

### 4.2 Principios del Tratamiento de Datos (Art. 5 GDPR)

| Principio | Estado en Spottruck | Observaciones |
|-----------|---------------------|---------------|
| Licitud, lealtad y transparencia | Parcialmente conforme | Falta política de privacidad accesible |
| Limitación de la finalidad | Conforme | Datos utilizados exclusivamente para el servicio de tracking |
| Minimización de datos | No conforme | Se recopilan datos de ubicación continua sin evaluación de necesidad |
| Exactitud | Conforme | Mecanismos de actualización de datos implementados |
| Limitación del almacenamiento | No conforme | Historial de ubicaciones retenido sine lim |
| Integridad y confidencialidad | Parcialmente conforme | Cifrado en tránsito, pero no en reposo para todos los datos |
| Responsabilidad (Accountability) | No conforme | Ausencia de registro de actividades de tratamiento |

### 4.3 Bases Legales para el Tratamiento

Para Spottruck, las bases legales aplicables son:

1. **Consentimiento (Art. 6.1.a)**: Para marketing y comunicaciones comerciales opcionales.
2. **Ejecución de contrato (Art. 6.1.b)**: Para la prestación del servicio de seguimiento de camiones.
3. **Interés legítimo (Art. 6.1.f)**: Para detección de fraude y seguridad de la plataforma.

**Deficiencias identificadas**:
- El consentimiento para cookies de terceros (Google Maps, analytics) no cumple con el requisito de opt-in previo.
- La política de privacidad no especifica de forma clara qué datos se comparten con terceros.
- No existe mecanismo para que el usuario revoque su consentimiento de forma sencilla.

### 4.4 Derechos de los Interesados (Arts. 15-22 GDPR)

| Derecho | Implementación actual | Gap |
|---------|----------------------|-----|
| Acceso (Art. 15) | Implementado | Falta confirmación de recepción en 30 días |
| Rectificación (Art. 16) | Implementado | Plazo de respuesta superior a 30 días |
| Supresión (Art. 17) | No implementado | No existe mecanismo de deletion requests |
| Limitación (Art. 18) | No implementado | No existe opción de restricción |
| Portabilidad (Art. 20) | No implementado | No hayexportación en formato interoperable |
| Oposición (Art. 21) | Parcialmente implementado | Falta formulario específico |

### 4.5 Evaluación de Impacto sobre la Protección de Datos (EIPD)

Dado que Spottruck realiza tratamiento a gran escala de datos de ubicación (categoría especial bajo certaines interpretaciones que podrían incluir datos de salud si se inferieren patrones de descanso), es obligatorio realizar una EIPD según el Art. 35 GDPR.

**EIPD requerida**: Sí. La evaluación debe incluir:
- Descripción sistemáticadel tratamiento y sus fines.
- Evaluación de necesidad y proporcionalidad.
- Evaluación de riesgos para los derechos y libertades de los interesados.
- Medidas previsto para abordar riesgos.

### 4.6 Medidas Técnicas y Organizativas (Art. 32 GDPR)

**Estado actual de medidas implementadas**:

- ✅ Cifrado TLS en tránsito.
- ❌ Cifrado AES en reposo (parcialmente implementado en producción, no en backups).
- ✅ Gestión de acceso basada en roles.
- ❌ Registro de accesos (logging).
- ❌ Pruebas de penetración periódicas (última hace 14 meses).
- ✅ Conciencia de seguridad del equipo (formación anual).
- ❌ Protocolo de respuesta a incidentes documentado (existe de forma parcial sin testing).

### 4.7 Notificación de Brechas (Arts. 33-34 GDPR)

**Requisitos**:
- Notificación a autoridad de control (AEPD): máximo 72 horas desde conocimiento de la brecha.
- Notificación a interesados: cuando exista alto riesgo para sus derechos y libertades.

**Gap identificado**: No existe план documentado de respuesta a incidentes con tiempos de respuesta definidos. El proceso actual es reactivo y no dispone de canal dedicado para comunicación con AEPD.

### 4.8 Encargado del Tratamiento (Art. 28 GDPR)

En caso de que Spottruck utilize proveedores cloud (AWS, Google Cloud) para almacenamiento y procesamiento, debe formalizarse un contrato de encargo de tratamiento que incluya:
- Instrucciones específicas para el tratamiento.
- Medidas de seguridad técnicas y organizativas.
- Cláusulas de auditoría y derecho de inspección.
- Obligaciones de asistencia en caso de ejercicio de derechos.

**Estado**: Contratos con encargados de tratamiento firmados y actualizados hace 8 meses. Revisión programada no ejecutada.

---

## 6. Auditoría y Logging de Seguridad

### 6.1 Requisitos de Logging de Auditoría

El logging de seguridad constituye un pilar fundamental para la detección de intrusiones, el análisis forense y el cumplimiento normativo. Spottruck implementará un sistema integral de logging que permitirá reconstruir la secuencia de eventos en caso de incidente de seguridad.

**Eventos obligatorios a registrar**:

| Categoría | Eventos | Datos capturados |
|-----------|---------|------------------|
| Autenticación | Login, logout, intento fallido, recuperación de contraseña | Timestamp, IP, dispositivo, usuario, resultado |
| Autorización | Acceso a recursos, operaciones CRUD | Timestamp, usuario, recurso, acción, resultado |
| Datos sensibles | Acceso a datos personales, exportación de datos | Timestamp, usuario, tipo de datos, volumen |
| Administración | Cambios de configuración, gestión de usuarios | Timestamp, operador, acción, objeto afectado |
| Seguridad | Bloqueos de cuenta, cambios de contraseña, errores de validación | Timestamp, IP, tipo de evento, detalle |
| Transacciones | Pagos, devoluciones, disputas | Timestamp, usuario, monto, método, resultado |

### 6.2 Requisitos Técnicos de Implementación

**Inmutabilidad de logs**: Los logs se almacenarán en un bucket de S3 con política de retención WORM (Write Once Read Many) durante un mínimo de 2 años. No se permitirá la eliminación o modificación de logs mediante políticas de bucket.

**Formato estructurado**: Todos los logs utilizarán formato JSON estructurado con los siguientes campos obligatorios:

```json
{
  "timestamp": "2026-06-03T14:30:00.000Z",
  "level": "INFO|WARN|ERROR|SECURITY",
  "service": "auth|api|payments|notifications",
  "trace_id": "uuid-v4",
  "user_id": "user-id-or-anonymous",
  "ip_address": "x.x.x.x",
  "action": "login|logout|access|modify",
  "resource": "/api/v1/resource",
  "result": "success|failure",
  "metadata": {}
}
```

**Tiempo de retención**:

- Logs de autenticación: 2 años
- Logs de transacciones: 5 años (requisito financiero)
- Logs de auditoría de datos: 3 años
- Logs de errores de aplicación: 90 días

### 6.3 Monitoreo y Detección de Amenazas

**Integración SIEM**: Los logs se enviarán a un sistema SIEM (Security Information and Event Management) con reglas predefinidas para detección de:

- Intentos de fuerza bruta contra endpoints de autenticación
- Patterns de SQL injection y XSS
- Movimiento lateral dentro de la infraestructura
- Exfiltración de datos (volumen anormal de requests)
- Acceso desde ubicaciones geográfica anomalas

**Alertas de seguridad configuradas**:

| Alerta | Condición de activación | Severidad | Tiempo de respuesta |
|--------|-------------------------|-----------|---------------------|
| Brute force login | > 5 intentos fallidos en 10 min desde misma IP | Alta | Inmediato |
| Privileged action | Acceso a panel de administración | Media | 30 min |
| Data export | Exportación de > 100 registros de usuarios | Media | 1 hora |
| Anomalous access | Acceso fuera de horario habitual del usuario | Baja | 4 horas |
| Failed MFA | > 3 intentos de MFA fallidos | Alta | Inmediato |

### 6.4 Plan de Implementación de Logging

| Fase | Descripción | Timeline |
|------|-------------|----------|
| Fase 1 | Implementar logging de autenticación y autorización | 2 semanas |
| Fase 2 | Configurar pipeline de envío a SIEM | 3 semanas |
| Fase 3 | Implementar reglas de detección y alertas | 2 semanas |
| Fase 4 | Testing de capacidad de respuesta a incidentes | 2 semanas |
| Fase 5 | Auditoría completa del sistema de logging | 1 semana |

---

## 7. Plan de Remediación Priorizado

| Prioridad | Vulnerabilidad | Esfuerzo | Timeline |
|-----------|---------------|----------|----------|
| Crítica | Almacenamiento inseguro de credenciales en dispositivo | Medio | 2 semanas |
| Crítica | Ausencia de Rate Limiting en endpoints de autenticación | Bajo | 1 semana |
| Alta | Cifrado de datos en reposo (backups) | Alto | 1 mes |
| Alta | EIPD no realizada | Medio | 3 semanas |
| Alta | Implementación de mecanismos de ejercicio de derechos | Alto | 1 mes |
| Media | Actualización de componentes vulnerables | Medio | 2 semanas |
| Media | Endurecimiento de configuración de seguridad | Bajo | 1 semana |
| Media | Implementación de SIEM y logging inmutable | Alto | 6 semanas |
| Baja | Firma de código para aplicación móvil | Medio | 3 semanas |

---

## 8. Conclusiones

La auditoría ha revelado un nivel de riesgo medio-alto en la plataforma Spottruck. Si bien existen controles de seguridad básicos implementados, se detectan gap significativos en el cumplimiento del OWASP Top 10 y, especialmente, en el marco GDPR/LOPD.

Los riesgos más críticos están relacionados con la exposición de credenciales en dispositivos móviles, la ausencia de controles de acceso robustos en la API, y la falta de un programa estructurado de cumplimiento de protección de datos. La ausencia de una EIPD formal constituye en sí misma una violación del principio de responsabilidad (Art. 5.2 GDPR).

Se recomienda abordar las vulnerabilidades críticas dentro de los próximos 30 días y establecer un programa de mejora continua de seguridad con revisiones trimestrales.

---

*Auditoría realizada: Junio 2026*
*Próxima revisión programada: Septiembre 2026*
*Clasificación: Interno — Confidencial*