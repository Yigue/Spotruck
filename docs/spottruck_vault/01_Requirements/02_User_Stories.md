---
title: "User Stories - Sistema de Subastas de Viajes"
version: "1.0"
date: "2026-06-03"
status: "draft"
author: "Product Team"
---

# User Stories - Sistema de Subastas de Viajes

## Epics Overview

| Epic ID | Nombre | Descripción |
|---------|--------|-------------|
| EP-01 | Autenticación | Sistema de gestión de usuarios y roles |
| EP-02 | Gestión de Viajes | CRUD de viajes, búsqueda y gestión de preferencias |
| EP-03 | Sistema de Subastas | Mecánica de pujas, seguimiento y resolución |
| EP-04 | Pagos | Procesamiento de transacciones y-wallets |
| EP-05 | Calificaciones | Sistema de feedback y reputación |
| EP-06 | Admin | Panel administrativo y reporting |

---

## EP-01: Epic de Autenticación

### FE-01: Registro y Verificación de Usuarios

#### US-001: Registro de usuario con email
**Título:** Registro de nuevo usuario con verificación por email

**Como:** Visitante del sistema  
**Quiero:** Crear una cuenta usando mi correo electrónico  
**Para que:** Pueda acceder a las funcionalidades del portal de subastas

**Criterios de Aceptación:**
- [ ] El formulario solicita: nombre, email, contraseña, confirmación de contraseña
- [ ] La contraseña debe tener mínimo 8 caracteres, mayúscula, número y símbolo
- [ ] Se envía email de verificación con enlace válido por 24 horas
- [ ] El usuario no puede hacer login hasta verificar su email
- [ ] Se muestra mensaje de error si el email ya existe en el sistema

**Tasks:**
- T-001: Crear endpoint POST /api/auth/register
- T-002: Implementar validación de datos de entrada
- T-003: Generar token de verificación JWT
- T-004: Integrar servicio de envío de emails transaccionales
- T-005: Crear endpoint GET /api/auth/verify-email/:token
- T-006: Implementar lógica de marcar usuario como verificado
- T-007: Escribir pruebas unitarias para flujo de registro

---

#### US-002: Inicio de sesión con credenciales
**Título:** Inicio de sesión con email y contraseña

**Como:** Usuario registrado y verificado  
**Quiero:** Iniciar sesión con mis credenciales  
**Para que:** Pueda acceder a mi cuenta y comenzar a participar en subastas

**Criterios de Aceptación:**
- [ ] El formulario acepta email y contraseña
- [ ] Se devuelve token JWT válido por 24 horas
- [ ] El token se almacena en HttpOnly cookie
- [ ] Se bloquea cuenta después de 5 intentos fallidos
- [ ] Se registra cada intento de login en log de seguridad

**Tasks:**
- T-008: Crear endpoint POST /api/auth/login
- T-009: Implementar lógica de hash de contraseña con bcrypt
- T-010: Crear middleware de rate limiting (5 intentos/15 min)
- T-011: Generar y devolver JWT en cookie HttpOnly
- T-012: Registrar intentos de login en tabla auth_logs
- T-013: Implementar bloqueo temporal de cuenta

---

#### US-003: Recuperación de contraseña
**Título:** Recuperar acceso a cuenta mediante email

**Como:** Usuario que olvidó su contraseña  
**Quiero:** Solicitar un enlace para restablecer mi contraseña  
**Para que:** Pueda recuperar el acceso a mi cuenta sin perder mis datos

**Criterios de Aceptación:**
- [ ] El formulario acepta email y muestra mensaje genérico (no revela si existe)
- [ ] Se envía email con enlace válido por 1 hora
- [ ] El enlace redirige a página para nueva contraseña
- [ ] La nueva contraseña debe cumplir los mismos requisitos del registro
- [ ] Se invalidan todos los tokens JWT anteriores del usuario tras el cambio

**Tasks:**
- T-014: Crear endpoint POST /api/auth/forgot-password
- T-015: Generar token de recuperación con expiración de 1 hora
- T-016: Crear endpoint POST /api/auth/reset-password
- T-017: Invalidar tokens anteriores del usuario
- T-018: Enviar email de notificación de cambio de contraseña

---

### FE-02: Gestión de Roles y Permisos

#### US-004: Asignación de roles a usuarios
**Título:** Sistema de roles para usuarios del sistema

**Como:** Administrador del sistema  
**Quiero:** Asignar roles específicos a cada usuario  
**Para que:** Pueda controlar quién accede a qué funcionalidades

**Criterios de Aceptación:**
- [ ] Existen roles: usuario, subastador, administrador
- [ ] Cada rol tiene permisos asociados en tabla role_permissions
- [ ] Un usuario puede tener múltiples roles
- [ ] Los permisos se verifican en cada endpoint protegido
- [ ] El rol por defecto para nuevos usuarios es "usuario"

**Tasks:**
- T-019: Crear tabla roles con campos: id, name, description, created_at
- T-020: Crear tabla role_permissions
- T-021: Crear tabla user_roles
- T-022: Crear middleware de verificación de permisos
- T-023: Implementar endpoint PUT /api/users/:id/roles

---

#### US-005: Permisos granulares por característica
**Título:** Control de acceso basado en permisos granulares

**Como:** Desarrollador  
**Quiero:** Implementar permisos granulares por característica  
**Para que:** El sistema sea flexible y seguro ante cambios de requisitos

**Criterios de Aceptación:**
- [ ] Cada permiso tiene: resource, action, description
- [ ] Los permisos se consultan vía middleware en cada request
- [ ] Se puede negar acceso a nivel de recurso específico
- [ ] Los logs registran intentos de acceso denegado con timestamp

**Tasks:**
- T-024: Diseñar modelo de permisos en base de datos
- T-025: Implementar PermissionService
- T-026: Crear middleware checkPermission
- T-027: Agregar logging de accesos denegados

---

## EP-02: Epic de Gestión de Viajes

### FE-03: Catálogo de Viajes

#### US-006: Creación de viaje por administrador
**Título:** Crear nuevo viaje en el sistema

**Como:** Administrador o subastador  
**Quiero:** Crear un nuevo registro de viaje con todos sus detalles  
**Para que:** Los usuarios puedan ver y pujar por este viaje

**Criterios de Aceptación:**
- [ ] Campos obligatorios: origen, destino, fecha_ida, fecha_regreso, precio_base
- [ ] Campos opcionales: descripción, incluye, itinerario, imágenes
- [ ] Se genera ID único y slug SEO-friendly
- [ ] El viaje queda en estado "borrador" hasta ser publicado
- [ ] Se registra timestamp de creación y usuario creador

**Tasks:**
- T-028: Crear endpoint POST /api/trips
- T-029: Implementar validación de campos obligatorios
- T-030: Generar slug con transliterate + random suffix
- T-031: Crear servicio de upload de imágenes a S3/Cloudinary
- T-032: Implementar máquina de estados: borrador → publicado → completado

---

#### US-007: Búsqueda de viajes con filtros
**Título:** Buscar viajes según criterios de búsqueda

**Como:** Usuario registrado  
**Quiero:** Buscar viajes por destino, fechas y rango de precio  
**Para que:** Pueda encontrar rápidamente viajes que me interesen

**Criterios de Aceptación:**
- [ ] Filtros disponibles: destino (contiene), fecha ida (rango), fecha regreso (rango), precio máximo
- [ ] Los resultados se paginan (20 por página)
- [ ] Se incluyen solo viajes con estado "publicado"
- [ ] Los resultados se ordenan por fecha de creación descendente
- [ ] Cada resultado incluye: título, origen, destino, fecha, precio base, número de pujas

**Tasks:**
- T-033: Crear endpoint GET /api/trips/search
- T-034: Implementar query builder con filtros dinámicos
- T-035: Agregar paginación con cursor o offset
- T-036: Crear índice en base de datos para optimizar búsqueda
- T-037: Implementar caché Redis para búsquedas frecuentes (TTL 5 min)

---

#### US-008: Ver detalle de viaje
**Título:** Visualizar información completa de un viaje

**Como:** Usuario del sistema  
**Quiero:** Ver todos los detalles de un viaje específico  
**Para que:** Pueda tomar decisión informada sobre participar en la subasta

**Criterios de Aceptación:**
- [ ] Se muestra: título, descripción, origen, destino, fechas, itinerario completo
- [ ] Se muestran imágenes en galería con lightbox
- [ ] Se indica precio base y puja actual más alta
- [ ] Se muestra historial de pujas (usuario anonimizado, monto, timestamp)
- [ ] Se muestra tiempo restante para cierre de subasta
- [ ] Botón "Pujar" visible solo para usuarios autenticados

**Tasks:**
- T-038: Crear endpoint GET /api/trips/:slug
- T-039: Implementar incremento de contador de vistas
- T-040: Crear endpoint GET /api/trips/:slug/bids para historial
- T-041: Diseñar componente de countdown timer en frontend
- T-042: Anonimizar identificadores de usuarios en historial de pujas

---

#### US-009: Edición y eliminación de viajes
**Título:** Modificar o eliminar un viaje existente

**Como:** Administrador o creador del viaje  
**Quiero:** Editar los detalles o eliminar un viaje  
**Para que:** Pueda mantener la información actualizada y corregir errores

**Criterios de Aceptación:**
- [ ] Solo el creador o admin pueden editar
- [ ] Los campos editables son todos excepto el ID
- [ ] Si la subasta ya tiene pujas, solo se permite editar descripción e imágenes
- [ ] La eliminación marca el viaje como "eliminado" (soft delete)
- [ ] Se envía notificación a todos los usuarios que pujaron si se cancela

**Tasks:**
- T-043: Crear endpoint PUT /api/trips/:id
- T-044: Implementar verificación de permisos de edición
- T-045: Crear endpoint DELETE /api/trips/:id
- T-046: Implementar soft delete con columna deleted_at
- T-047: Crear servicio de notificaciones masivas

---

### FE-04: Preferencias de Usuario

#### US-010: Guardar viajes favoritos
**Título:** Marcar viajes como favoritos para seguimiento

**Como:** Usuario autenticado  
**Quiero:** Agregar viajes a mi lista de favoritos  
**Para que:** Pueda rastrear viajes que me interesan sin necesidad de buscar cada vez

**Criterios de Aceptación:**
- [ ] Botón "Guardar" visible en detalle de viaje
- [ ] Al guardar se añade a tabla user_favorites con timestamp
- [ ] No se puede guardar el mismo viaje dos veces
- [ ] Existe página "/favoritos" que lista todos los guardados
- [ ] Se puede eliminar de favoritos con confirmación

**Tasks:**
- T-048: Crear endpoint POST /api/user/favorites/:tripId
- T-049: Crear endpoint DELETE /api/user/favorites/:tripId
- T-050: Crear endpoint GET /api/user/favorites
- T-051: Crear página de favoritos en frontend
- T-052: Implementar contador de favoritos en viajes

---

#### US-011: Configurar alertas de búsqueda
**Título:** Crear alertas automáticas para nuevos viajes

**Como:** Usuario registrado  
**Quiero:** Crear alertas con criterios específicos  
**Para que:** Reciba notificaciones cuando haya nuevos viajes que coincidan

**Criterios de Aceptación:**
- [ ] Se pueden definir: destino (texto), rango de fechas, precio máximo
- [ ] Las alertas se guardan en tabla user_alerts
- [ ] Un job nocturno compara nuevos viajes contra alertas
- [ ] Se envía email con resumen de coincidencias
- [ ] El usuario puede activar/desactivar alertas desde su perfil

**Tasks:**
- T-053: Crear endpoint POST /api/user/alerts
- T-054: Crear endpoint GET /api/user/alerts
- T-055: Crear endpoint DELETE /api/user/alerts/:id
- T-056: Implementar scheduled job para evaluación de alertas
- T-057: Crear servicio de envío de emails con plantillas

---

## EP-03: Epic de Sistema de Subastas

### FE-05: Mecánica de Pujas

#### US-012: Realizar puja en viaje
**Título:** Pujar por un viaje en auction activa

**Como:** Usuario autenticado y verificado  
**Quiero:** Realizar una puja superior a la actual  
**Para que:** Pueda intentar ganar la subasta del viaje

**Criterios de Aceptación:**
- [ ] La puja debe ser mayor a la puja actual más el incremento mínimo
- [ ] El usuario no puede pujar en sus propios viajes
- [ ] Si la puja es válida, se crea registro en tabla bids
- [ ] Se actualiza precio actual del viaje
- [ ] Se devuelve confirmación con nuevo monto y posición del usuario
- [ ] No se permiten pujas 5 minutos antes del cierre

**Tasks:**
- T-058: Crear endpoint POST /api/auctions/:tripId/bids
- T-059: Implementar validación de monto mínimo de puja
- T-060: Crear trigger de base de datos para actualizar precio actual
- T-061: Implementar ventana de restricción temporal (5 min antes cierre)
- T-062: Devolver ranking del usuario entre todos los pujadores

---

#### US-013: Extensión automática de tiempo
**Título:** Extender tiempo de auction ante pujas tardías

**Como:** Sistema  
**Quiero:** Extender automáticamente el tiempo de cierre cuando hay puja en los últimos minutos  
**Para que:** Todos los usuarios tengan oportunidad justa de contra-pujar

**Criterios de Aceptación:**
- [ ] Si se puja en los últimos 3 minutos, se añade 2 minutos al tiempo de cierre
- [ ] La extensión es acumulativa (múltiples pujas = múltiples extensiones)
- [ ] Se registra en log cada extensión indicando razón
- [ ] El tiempo máximo de extensión total es 30 minutos
- [ ] Se notifica a todos los pujadores por email cuando hay extensión

**Tasks:**
- T-063: Implementar servicio de evaluación de tiempo de auction
- T-064: Crear lógica de extensión de tiempo en endpoint de puja
- T-065: Implementar contador de extensiones por auction
- T-066: Enviar notificaciones de extensión a pujadores

---

#### US-014: Sistema de puja automática (proxy bidding)
**Título:** Configurar puja automática máxima

**Como:** Usuario que no puede estar pendientes en tiempo real  
**Quiero:** Definir una puja máxima y que el sistema puje automáticamente  
**Para que:** Permanezca competitivo sin tener que monitorear constantemente

**Criterios de Aceptación:**
- [ ] El usuario define un monto máximo de puja
- [ ] El sistema incrementa automáticamente según el incremento mínimo
- [ ] El usuario es notificado cuando su puja máxima es superada
- [ ] La puja máxima se mantiene secreta hasta el cierre
- [ ] El usuario puede modificar o cancelar su puja automática en cualquier momento

**Tasks:**
- T-067: Crear endpoint POST /api/auctions/:tripId/proxy-bid
- T-068: Implementar ProxyBidService que evalúa pujas entrantes
- T-069: Crear endpoint PUT /api/auctions/:tripId/proxy-bid
- T-070: Crear endpoint DELETE /api/auctions/:tripId/proxy-bid
- T-071: Implementar notificaciones de puja superada

---

#### US-015: Historial de pujas en tiempo real
**Título:** Ver evolución de pujas en vivo

**Como:** Usuario interesado en una auction  
**Quiero:** Ver el historial de pujas actualizado en tiempo real  
**Para que:** Pueda tomar decisiones estratégicas sobre mis pujas

**Criterios de Aceptación:**
- [ ] Se muestra lista de todas las pujas ordenadas por timestamp
- [ ] Cada puja muestra: monto, hora, indicador si es del usuario actual
- [ ] La actualización es en tiempo real via WebSocket
- [ ] Se muestra posición actual del usuario en el ranking
- [ ] Se indica cuánto falta para el cierre

**Tasks:**
- T-072: Implementar WebSocket server para subastas
- T-073: Crear cliente WebSocket en frontend
- T-074: Implementar lógica de broadcast en cada nueva puja
- T-075: Diseñar UI de ranking en tiempo real

---

### FE-06: Resolución de Subastas

#### US-016: Cierre y determinación de ganador
**Título:** Procesar cierre de auction y determinar ganador

**Como:** Sistema  
**Quiero:** Procesar automáticamente el cierre de auctions vencidas  
**Para que:** Se determine el ganador y se notifique a las partes

**Criterios de Aceptación:**
- [ ] Un job corre cada minuto verificando auctions pendientes
- [ ] Se identifica la puja más alta y su usuario
- [ ] Se actualiza estado del viaje a "adjudicado"
- [ ] Se crea registro de transacción pendiente
- [ ] Se envía email al ganador y al vendedor
- [ ] Se genera código de transacción único

**Tasks:**
- T-076: Crear scheduled job de cierre de auctions
- T-077: Implementar lógica de selección de ganador
- T-078: Actualizar estado del viaje a "adjudicado"
- T-079: Crear registro en tabla transactions
- T-080: Enviar notificaciones a ganador y vendedor
- T-081: Generar transaction_id único

---

#### US-017: Cancelación de auction
**Título:** Cancelar auction por circunstancias excepcionales

**Como:** Administrador  
**Quiero:** Cancelar una auction específica  
**Para que:** Pueda manejar situaciones como viajes cancelados o problemas de disponibilidad

**Criterios de Aceptación:**
- [ ] Solo admins pueden cancelar auctions
- [ ] Se debe ingresar motivo de cancelación (obligatorio)
- [ ] Se reembolsan automáticamente todas las pujas (si hay sistema de depósito)
- [ ] Se notifica a todos los participantes
- [ ] El viaje associated se marca como "cancelado"

**Tasks:**
- T-082: Crear endpoint POST /api/admin/auctions/:id/cancel
- T-083: Implementar validación de permisos de admin
- T-084: Revertir depósitos de todas las pujasassociated
- T-085: Enviar notificaciones a todos los participantes
- T-086: Actualizar estado del viaje a "cancelado"

---

## EP-04: Epic de Pagos

### FE-07: Billetera Virtual (Wallet)

#### US-018: Registro de tarjeta de crédito
**Título:** Añadir método de pago para depositar fondos

**Como:** Usuario autenticado  
**Quiero:** Registrar mi tarjeta de crédito en el sistema  
**Para que:** Pueda depositar fondos en mi wallet para realizar pujas

**Criterios de Aceptación:**
- [ ] Se requieren datos: número de tarjeta, fecha expiración, CVV, nombre en tarjeta
- [ ] Se almacenan últimos 4 dígitos y tipo de tarjeta (Visa, MC, etc)
- [ ] Se requiere validación por código enviado por el banco (3DS)
- [ ] La tarjeta se marca como "pendiente_validación" hasta completar 3DS
- [ ] El usuario puede tener hasta 5 tarjetas registradas

**Tasks:**
- T-087: Crear endpoint POST /api/wallet/cards
- T-088: Integrar con procesador de pagos (Stripe) para tokenización
- T-089: Implementar flujo 3DSecure
- T-090: Almacenar datos tokenizados, nunca en texto plano
- T-091: Crear endpoint para verificar tarjeta pendiente

---

#### US-019: Depósito de fondos en wallet
**Título:** Depositar dinero en la billetera virtual

**Como:** Usuario con tarjeta registrada  
**Quiero:** Depositar fondos en mi wallet  
**Para que:** Pueda tener saldo disponible para pujar en subastas

**Criterios de Aceptación:**
- [ ] Montos disponibles: 50, 100, 200, 500 USD u otro personalizado
- [ ] El depósito se procesa via Stripe PaymentIntent
- [ ] Se aplica comisión del 2% sobre el monto depositado
- [ ] Al confirmar, el saldo se incrementa y se registra en transaction_history
- [ ] Se envía comprobante por email

**Tasks:**
- T-092: Crear endpoint POST /api/wallet/deposit
- T-093: Integrar Stripe PaymentIntent para procesamiento
- T-094: Implementar lógica de comisión del 2%
- T-095: Actualizar balance en tabla wallets
- T-096: Registrar en transaction_history con tipo "deposit"
- T-097: Enviar email de confirmación con comprobante

---

#### US-020: Consulta de saldo y movimientos
**Título:** Consultar balance y historial de transacciones

**Como:** Usuario autenticado  
**Quiero:** Ver mi saldo actual y el historial de movimientos  
**Para que:** Pueda mantener control de mis fondos en el sistema

**Criterios de Aceptación:**
- [ ] Se muestra balance actual con precisión de 2 decimales
- [ ] El historial muestra últimos 50 movimientos paginados
- [ ] Cada movimiento indica: fecha, tipo, monto, concepto, saldo resultante
- [ ] Los tipos de movimiento incluyen: depósito, retiro, puja, ganar, reembolso, comisión
- [ ] Se puede filtrar por tipo y rango de fechas

**Tasks:**
- T-098: Crear endpoint GET /api/wallet/balance
- T-099: Crear endpoint GET /api/wallet/transactions
- T-100: Implementar filtros y paginación
- T-101: Diseñar UI de dashboard de wallet

---

#### US-021: Retiro de fondos
**Título:** Retirar fondos de la wallet a cuenta bancaria

**Como:** Usuario con saldo disponible  
**Quiero:** Solicitar retiro de fondos a mi cuenta bancaria  
**Para que:** Pueda disponer de mis ganancias

**Criterios de Aceptación:**
- [ ] Monto mínimo de retiro: 10 USD
- [ ] Se requiere cuenta bancaria vinculada (una sola)
- [ ] El procesamiento tarda 2-5 días hábiles
- [ ] Se aplica comisión fija de 3 USD por retiro
- [ ] El estado inicial es "pending" y se actualiza a "completed" o "rejected"

**Tasks:**
- T-102: Crear endpoint POST /api/wallet/withdraw
- T-103: Crear endpoint PUT /api/wallet/bank-account
- T-104: Implementar lógica de procesamiento de retiros
- T-105: Crear scheduled job para procesar retiros pendientes

---

### FE-08: Transacciones y Facturación

#### US-022: Débito automático al ganar auction
**Título:** Cobrar automáticamente al ganador de una auction

**Como:** Sistema de pagos  
**Quiero:** Debitar el monto de la puja ganadora del wallet del usuario  
**Para que:** Se complete la transacción de compra del viaje

**Criterios de Aceptación:**
- [ ] Al confirmar ganador, se verifica saldo suficiente en wallet
- [ ] Si hay saldo, se debita el monto y se actualiza transaction_history
- [ ] Si no hay saldo, se da plazo de 24 horas para depositar
- [ ] Si no se completa el pago, se cede la auction al siguiente mejor postor
- [ ] Se genera factura con detalle del servicio

**Tasks:**
- T-106: Implementar servicio de cobro automático
- T-107: Crear lógica de transferencia al vendedor
- T-108: Implementar timed hold de 24 horas para pago pendiente
- T-109: Crear lógica de re-adjudicación a siguiente mejor postor
- T-110: Generar factura en PDF

---

#### US-023: Reembolso por cancelación
**Título:** Procesar reembolso automático en cancelaciones

**Como:** Sistema de pagos  
**Quiero:** Reembolsar el montodebitado al usuario cuando se cancela una auction  
**Para que:** Se respete la política de cancelación y se mantenga confianza

**Criterios de Aceptación:**
- [ ] En cancelaciones por parte del vendedor, se reembolsael 100%
- [ ] En cancelaciones por decisión del ganador, se retiene el 10%
- [ ] El reembolso aparece como crédito en wallet en máximo 48 horas
- [ ] Se envía email detallando motivo y monto del reembolso

**Tasks:**
- T-111: Implementar servicio de reembolso parcial/total
- T-112: Calcular deducciones según política de cancelación
- T-113: Actualizar wallet con crédito de reembolso
- T-114: Enviar notificación detallada de reembolso

---

## EP-05: Epic de Calificaciones

### FE-09: Sistema de Reviews

#### US-024: Calificar al vendedor después de auction
**Título:** Dejar review del vendedor una vez completado el viaje

**Como:** Usuario ganador de una auction  
**Quiero:** Calificar mi experiencia con el vendedor  
**Para que:** Otros usuarios puedan evaluar la confiabilidad del vendedor

**Criterios de Aceptación:**
- [ ] Se puede calificar 1-5 estrellas
- [ ] Se debe ingresar comentario de al menos 20 caracteres
- [ ] Solo se puede calificar una vez por transaction
- [ ] La calificación se hace visible solo después de que ambos hayan calificado (sistema de duality)
- [ ] Se puede editar la calificación dentro de los primeros 7 días

**Tasks:**
- T-115: Crear endpoint POST /api/reviews
- T-116: Implementar validación de transaction completada
- T-117: Crear lógica de "pending" hasta que ambos califiquen
- T-118: Implementar período de edición de 7 días
- T-119: Calcular rating promedio del vendedor

---

#### US-025: Responder a review del vendedor
**Título:** El vendedor puede responder a reviews de compradores

**Como:** Vendedor (subastador)  
**Quiero:** Responder a las calificaciones que recibo  
**Para que:** Pueda aclarar malentendidos o agradecer el feedback

**Criterios de Aceptación:**
- [ ] Solo el vendedor puede responder a reviews de su servicio
- [ ] La respuesta tiene límite de 500 caracteres
- [ ] La respuesta se muestra justo después del review original
- [ ] No se puede editar ni eliminar la respuesta

**Tasks:**
- T-120: Crear endpoint POST /api/reviews/:id/response
- T-121: Validar que el respondiente es el vendedor de la transaction
- T-122: Almacenar respuesta junto con review original
- T-123: No permitir edición posterior de la respuesta

---

#### US-026: Ver perfil de reputación de usuario
**Título:** Visualizar historial de calificaciones de un usuario

**Como:** Usuario del sistema  
**Quiero:** Ver el perfil de reputación de un vendedor o comprador  
**Para que:** Pueda evaluar su confiabilidad antes de participar en una auction

**Criterios de Aceptación:**
- [ ] Se muestra rating promedio con precisión de 1 decimal
- [ ] Se muestra distribución de calificaciones (cuántas de 1,2,3,4,5 estrellas)
- [ ] Se listan últimos 20 reviews con comentario y respuesta del vendedor
- [ ] Se indica cuántas transactions ha completado el usuario
- [ ] Se muestra badge si el usuario tiene "Verified Buyer" (>10 transactions con 4+ estrellas)

**Tasks:**
- T-124: Crear endpoint GET /api/users/:id/reputation
- T-125: Calcular rating promedio con algoritmo ponderado
- T-126: Generar distribución de estrellas
- T-127: Implementar lógica de badges de reputación

---

## EP-06: Epic de Admin

### FE-10: Dashboard Administrativo

#### US-027: Dashboard con métricas generales
**Título:** Ver panel de control con estadísticas del sistema

**Como:** Administrador del sistema  
**Quiero:** Ver un dashboard con métricas clave  
**Para que:** Pueda monitorear la salud del negocio y tomar decisiones informadas

**Criterios de Aceptación:**
- [ ] Se muestran: total de usuarios activos, auctions activas, volumen de transacciones
- [ ] Se grafican tendencias de los últimos 30 días
- [ ] Se muestran top 5 viajes más pujados
- [ ] Se indican alertas de auctions que no han tenido pujas en 48 horas
- [ ] Los datos se actualizan cada 5 minutos sin necesidad de refrescar

**Tasks:**
- T-128: Diseñar schema de métricas diarias en base de datos
- T-129: Crear endpoint GET /api/admin/dashboard/metrics
- T-130: Implementar job de agregado de métricas diarias
- T-131: Crear componente de gráficos en frontend
- T-132: Implementar polling o WebSocket para actualización en tiempo real

---

#### US-028: Gestión de usuarios desde admin
**Título:** Ver y modificar datos de usuarios desde panel admin

**Como:** Administrador  
**Quiero:** Listar, buscar y editar información de usuarios  
**Para que:** Pueda manejar cuentas, resolver problemas y aplicar sanciones

**Criterios de Aceptación:**
- [ ] Lista de usuarios con búsqueda por nombre o email
- [ ] Ver detalle completo del usuario: datos, histórico de pujas, transactions, reviews
- [ ] Capacidad de suspender usuario (no puede login ni pujar)
- [ ] Capacidad de eliminar usuario (soft delete, anonymize data)
- [ ] Todos los cambios quedan registrados en audit_log

**Tasks:**
- T-133: Crear endpoint GET /api/admin/users
- T-134: Crear endpoint GET /api/admin/users/:id
- T-135: Crear endpoint PUT /api/admin/users/:id/suspend
- T-136: Crear endpoint DELETE /api/admin/users/:id (soft delete + anonymize)
- T-137: Implementar audit_log para todos los cambios de admin

---

#### US-029: Reporte de auctions por período
**Título:** Generar reportes de auctions por rango de fechas

**Como:** Administrador  
**Quiero:** Generar reportes detallados de auctions  
**Para que:** Pueda analizar el rendimiento y preparar informes financieros

**Criterios de Aceptación:**
- [ ] Filtros: fecha inicio, fecha fin, estado (abierta, cerrada, cancelada)
- [ ] Se muestra: total auctions, total pujas, monto total pujado, comisiones cobradas
- [ ] Se puede exportar a CSV y PDF
- [ ] Se pueden ver detalles por cada auction individually
- [ ] El reporte respeta permisos de acceso (solo admin pueden generar)

**Tasks:**
- T-138: Crear endpoint GET /api/admin/reports/auctions
- T-139: Implementar generación de CSV
- T-140: Implementar generación de PDF con librería de reporting
- T-141: Implementar paginación para resultados grandes

---

#### US-031: Configuración de parámetros del sistema
**Título:** Modificar parámetros operativos del sistema

**Como:** Administrador superior  
**Quiero:** Ajustar configuraciones como incremento mínimo de puja, comisión por transacción, etc.  
**Para que:** El sistema pueda adaptarse a cambios del negocio sin necesidad de deploy

**Criterios de Aceptación:**
- [ ] Panel con lista de parámetros configurables
- [ ] Cada parámetro tiene: nombre, valor actual, tipo, descripción, rango válido
- [ ] Los cambios se guardan en tabla system_configurations
- [ ] Los cambios requieren confirmación con contraseña de admin
- [ ] Se envía email a todos los admins cuando se modifica un parámetro

**Tasks:**
- T-142: Crear endpoint GET /api/admin/configurations
- T-143: Crear endpoint PUT /api/admin/configurations/:key
- T-144: Implementar validación de rango para cada parámetro
- T-145: Implementar auditoría de cambios de configuración
- T-146: Enviar notificaciones a otros admins

---

#### US-032: Sistema de tickets de soporte
**Título:** Gestión de tickets de soporte de usuarios

**Como:** Administrador de soporte  
**Quiero:** Recibir, atender y resolver tickets de usuarios  
**Para que:** Pueda brindar atención personalizada y resolver problemas operativos

**Criterios de Aceptación:**
- [ ] Los usuarios pueden crear tickets con: categoría, prioridad, descripción, adjuntos
- [ ] Los tickets se asignan automáticamente por categoría a agentes disponibles
- [ ] Los agentes pueden: responder, cambiar estado, cambiar prioridad, escalar
- [ ] Los estados posibles: abierto, en progreso, pendiente respuesta usuario, resuelto, cerrado
- [ ] Se envía email al usuario en cada actualización de estado

**Tasks:**
- T-147: Crear endpoint POST /api/support/tickets (usuario)
- T-148: Crear endpoint GET /api/admin/support/tickets
- T-149: Crear endpoint PUT /api/admin/support/tickets/:id
- T-150: Implementar sistema de asignación por round-robin
- T-151: Enviar notificaciones por email en cambios de estado

---

#### US-033: Auditoría de seguridad y logs
**Título:** Registro y visualización de eventos de seguridad

**Como:** Administrador de seguridad  
**Quiero:** Consultar logs de eventos de seguridad  
**Para que:** Pueda investigar incidentes y mantener compliance

**Criterios de Aceptación:**
- [ ] Se registran: intentos de login, cambios de contraseña, cambios de permisos, transacciones
- [ ] Cada log tiene: timestamp, usuario, tipo evento, IP, user agent, datos relevantes
- [ ] Se pueden filtrar por tipo de evento, usuario, rango de fechas
- [ ] Los logs se retienen por 90 días y luego se archivan
- [ ] No se puede eliminar o modificar logs retrospectively

**Tasks:**
- T-152: Implementar servicio de logging centralizado
- T-153: Crear endpoint GET /api/admin/audit-logs
- T-154: Implementar filtros de búsqueda avanzados
- T-155: Configurar política de retención y archivado
- T-156: Implementar integridad de logs (hash chain)

---

## Anexos

### Priorización de Stories

| Prioridad | ID | Story |
|-----------|-----|-------|
| Alta | US-001, US-002, US-012, US-016, US-022 | Registro, Login, Pujas, Cierre, Cobro |
| Media | US-007, US-008, US-014, US-018, US-024 | Búsqueda, Detalle, ProxyBid, Wallet, Reviews |
| Baja | US-010, US-011, US-020, US-025, US-031 | Favoritos, Alertas, Historial, Respuestas, Config |

### Glosario

- **Epic:** Agrupación de alto nivel de funcionalidades relacionadas
- **Feature:** Agrupación de características que forman una unidad lógica
- **Story (User Story):** Descripción de una funcionalidad desde perspectiva de usuario
- **Task:** Unidad de trabajo técnica para implementar una story
- **3DS:** 3D Secure - protocolo de autenticación para pagos con tarjeta
- **Proxy Bidding:** Puja automática hasta un máximo definido por el usuario
- **Wallet:** Billetera virtual para depósitos y cobros dentro del sistema

---

*Documento generado: 2026-06-03*
*Versión: 1.0*
*Total de User Stories: 30*