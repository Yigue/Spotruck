---
title: "01_Requirements_V1"
description: "Especificación de Requisitos Funcionales para Spottruck v1.0"
status: active
version: "1.0"
date: 2026-06-04
type: requirements
project: Spottruck
---

# Especificación de Requisitos Funcionales — Spottruck v1.0

## 1. Introducción

El presente documento establece los requisitos funcionales para la plataforma Spottruck, un sistema integral de gestión de flotas de transporte pesado desarrollado para optimizar operaciones logísticas, mejorar la trazabilidad de unidades y garantizar la seguridad tanto de los conductores como de la carga transportada. Spottruck busca resolver las necesidades operativas de empresas de transporte que requieren monitoreo en tiempo real, gestión eficiente de combustible, mantenimiento preventivo y comunicación directa con conductores en ruta.

El alcance de este documento comprende los módulos core de la plataforma: gestión de usuarios y roles, tracking GPS en tiempo real, sistema de alertas, gestión de combustible, mantenimiento de unidades, comunicación conductor-despachador, generación de reportes e integración con sistemas externos. Cada requisito funcional ha sido numerado secuencialmente desde RF-001 hasta RF-050 para facilitar su trazabilidad a lo largo del ciclo de desarrollo del proyecto.

---

## 2. Requisitos Funcionales

### 2.1 Gestión de Usuarios y Autenticación

**RF-001 — Sistema de autenticación con credenciales seguras:** El sistema deberá permitir a los usuarios iniciar sesión utilizando un nombre de usuario y contraseña. Las contraseñas deberán almacenarse utilizando algoritmos de hash seguros (bcrypt o equivalente) y nunca en texto plano. El sistema debe validar que la contraseña cumpla con requisitos mínimos de complejidad: al menos 8 caracteres, una mayúscula, un número y un carácter especial.

**RF-002 — Autenticación de dos factores (2FA):** El sistema debe ofrecer la opción de habilitar autenticación de dos factores mediante código enviado por SMS o generado por una aplicación autenticadora (TOTP). Esta funcionalidad debe ser obligatoria para usuarios con rol de administrador y opcional para operadores y despachadores.

**RF-003 — Gestión de perfiles de usuario:** El sistema deberá permitir a cada usuario visualizar y editar su perfil, incluyendo nombre completo, correo electrónico, número de teléfono y fotografía de perfil. Los usuarios no podrán modificar su rol ni sus permisos asignados, acción reservada exclusivamente para administradores.

**RF-004 — Restricción de sesiones simultáneas:** El sistema deberá impedir que un mismo usuario autenticado tenga más de una sesión activa simultáneamente. Al iniciar una nueva sesión, la sesión anterior deberá ser invalidada automáticamente, generando una notificación al usuario desconectado.

**RF-005 — Cierre de sesión por inactividad:** El sistema deberá cerrar automáticamente la sesión del usuario tras 30 minutos de inactividad. Antes de cerrar la sesión, el sistema mostrará una notificación de advertencia a los 25 minutos de inactividad, permitiendo al usuario confirmar que desea continuar trabajando.

**RF-006 — Roles y permisos de usuario:** El sistema debe soportar al menos cuatro roles diferenciados: Administrador, Despachador, Operador de Flota y Conductor. Cada rol tendrá un conjunto específico de permisos que controlarán qué funcionalidades y datos puede ver y manipular cada usuario dentro de la plataforma.

**RF-007 — Registro de auditoría de acciones:** El sistema deberá mantener un log detallado de todas las acciones realizadas por cada usuario, incluyendo fecha, hora, acción realizada, módulo afectado y resultado de la operación. Este registro debe ser inmutable y no editable por ningún usuario, incluyendo administradores.

**RF-008 — Gestión de usuarios por administrador:** Los usuarios con rol de administrador deberán poder crear nuevos usuarios, activar o desactivar cuentas, y reasignar roles sin necesidad de conocimiento de la contraseña actual del usuario objetivo.

---

### 2.2 Gestión de Flota y Unidades de Transporte

**RF-009 — Registro de vehículos en el sistema:** El sistema debe permitir registrar nuevos vehículos especificando matrícula, marca, modelo, año, tipo de vehículo (camión de carga, tractocamión, caja seca, plataforma, cisterna), capacidad de carga en toneladas, capacidad del tanque de combustible en litros y tipo de combustible requerido.

**RF-010 — Estados operativos del vehículo:** Cada vehículo en el sistema deberá tener un estado operacional que refleje su condición actual: Disponible, En Servicio, En Mantenimiento, Fuera de Servicio o Dado de Baja. Solo vehículos con estado Disponible o En Servicio deberán aparecer como opciones válidas para asignación a rutas activas.

**RF-011 — Asignación de vehículo a conductor:** El sistema deberá permitir asignar un vehículo específico a un conductor determinado. Dicha asignación quedará registrada con fecha, hora y conductor responsable. El sistema impedirá asignar un vehículo que se encuentre actualmente en mantenimiento o fuera de servicio.

**RF-012 — Información técnica del vehículo:** Para cada vehículo registrado, el sistema debe almacenar y hacer accesible su información técnica incluyendo número de serie (VIN), número de póliza de seguro, fecha de vencimiento de la póliza, fecha de próxima revisión mecánica y kilometraje actual registrado.

**RF-013 — Historial de asignaciones del vehículo:** El sistema debe mantener un historial completo de todas las asignaciones que ha tenido cada vehículo, mostrando conductor asignado, fecha de inicio, fecha de fin y motivo del cambio si aplica. Este historial debe ser consultable por administradores y despachadores.

**RF-014 — Capacidad de edición de datos del vehículo:** Los usuarios con rol de administrador deberán poder modificar los datos registrados de un vehículo en cualquier momento, con excepción del número de serie (VIN) que una vez registrado no podrá ser alterado. Cada modificación generará un registro en el log de auditoría.

**RF-015 — Eliminación lógica de vehículos:** El sistema no deberá permitir la eliminación física de ningún vehículo que tenga historial de operaciones asociadas. La baja de un vehículo se realizará mediante un cambio de estado a "Dado de Baja", conservando todos los datos históricos para efectos de reportes y trazabilidad.

---

### 2.3 Sistema de Tracking GPS y Monitoreo en Tiempo Real

**RF-016 — Recepción de datos GPS:** El sistema deberá recibir y procesar datos de posición geográfica enviados por dispositivos GPS instalados en cada vehículo de la flota. Los datos incluirán latitud, longitud, velocidad actual, dirección (rumbo en grados), timestamp del dispositivo y calidad de la señal GPS.

**RF-017 — Actualización de posición cada 30 segundos:** El sistema debe actualizar la posición de cada vehículo en el mapa de seguimiento al menos cada 30 segundos cuando el vehículo se encuentra en movimiento activo. Cuando el vehículo esté detenido, la frecuencia de actualización podrá reducirse a cada 5 minutos para optimizar uso de ancho de banda.

**RF-018 — Visualización en mapa interactivo:** El sistema debe mostrar todos los vehículos activos en un mapa interactivo que permita al despachador visualizar en tiempo real la posición de cada unidad. El mapa debe soportar zoom,pan y selección de vehículos individuales para ver sus detalles.

**RF-019 — Historial de recorrido:** El sistema debe permitir consultar el historial de recorrido de cualquier vehículo en un rango de fechas determinado. Este historial se presentará como una línea de trayectoria sobre el mapa junto con los puntos de parada detectados con marca de tiempo y duración.

**RF-020 — Detección de permanencia en punto:** El sistema debe detectar automáticamente cuando un vehículo permanece inmóvil en una ubicación por más de 15 minutos, generando un evento de alerta que será notificado al despachador asignado.

**RF-021 — Cálculo de velocidad promedio:** Para cada vehículo, el sistema deberá calcular y almacenar la velocidad promedio durante el último tramo completado, la velocidad promedio histórica del día en curso y la velocidad máxima registrada en las últimas 24 horas.

**RF-022 — Geo-cercao (Geofencing):** El sistema debe permitir definir áreas geográficas virtualmente delimitadas (geo-cercaos). Cuando un vehículo entre o salga de una geo-cercao predefinida, el sistema generará una notificación automática especificando vehículo, tipo de evento y hora.

**RF-023 — Prueba de conectividad GPS:** El sistema debe verificar automáticamente cada 5 minutos que los dispositivos GPS de cada vehículo estén enviando datos correctamente. En caso de pérdida de señal por más de 10 minutos consecutivos, se generará una alerta de "sin señal GPS" dirigida al despachador.

---

### 2.4 Sistema de Gestión de Combustible

**RF-024 — Registro de consumo de combustible:** El sistema debe registrar cada carga de combustible asociada a un vehículo, incluyendo litros cargados, costo por litro, estación de servicio, fecha y hora, odómetro en el momento de la carga y conductor responsable de reportar el consumo.

**RF-025 — Cálculo de rendimiento de combustible:** El sistema calculará automáticamente el rendimiento en kilómetros por litro (km/L) para cada vehículo, comparándolo con el rendimiento promedio histórico del mismo vehículo y con los parámetros de rendimiento esperado según el tipo de vehículo.

**RF-026 — Alertas de consumo anómalo:** El sistema debe generar alertas cuando el rendimiento de combustible de un vehículo caiga por debajo del 85% del rendimiento promedio histórico, indicando posible fuga, desperfecto mecánico o uso indebido del vehículo.

**RF-027 — Historial de cargas de combustible:** Cada vehículo tendrá disponible un historial completo de todas sus cargas de combustible ordenadas cronológicamente, mostrando además el costo acumulado por período (semanal, mensual, anual).

**RF-028 — Reporte de gasto de combustible por vehículo:** El sistema generará reportes automatizados semanales del gasto de combustible por vehículo, comparando el consumo real contra el presupuesto asignado y expresando la diferencia en porcentaje y valor absoluto.

**RF-029 — Integración con sistemas de tarjetas de combustible:** Para futuras versiones, el sistema debe contemplar la integración con sistemas de tarjetas de combustible de proveedores principales como Ticket Car, Edenred y Fleetcor, permitiendo importar transacciones automáticamente y reducir la captura manual de datos.

---

### 2.5 Gestión de Mantenimiento

**RF-030 — Programa de mantenimiento preventivo:** El sistema debe gestionar un calendario de mantenimiento preventivo basado en kilómetros recorridos y tiempo transcurrido desde el último servicio. Los parámetros de mantenimiento incluirán: cambio de aceite (cada 10,000 km), rotación de neumáticos (cada 8,000 km), revisión de frenos (cada 15,000 km) y servicio general (cada 20,000 km).

**RF-031 — Notificación de servicios próximos:** El sistema debe notificar al despachador y al administrador de flota con al menos 5 días de anticipación cuando un vehículo se aproxime al límite de kilómetros o tiempo para su próximo servicio de mantenimiento preventivo.

**RF-032 — Registro de mantenimientos realizados:** Cada mantenimiento realizado deberá ser registrado en el sistema incluyendo tipo de servicio, fecha de realización, taller utilizado, costo del servicio, kilómetros al momento del servicio y trabajos realizados detallados.

**RF-033 — Historial de mantenimiento por vehículo:** El sistema debe mantener un historial completo y consultable de todos los mantenimientos realizados a cada vehículo, incluyendo costos totales acumulados por mantenimiento preventivo versus correctivo.

**RF-034 — Estado de mantenimiento del vehículo:** Un vehículo que tenga servicios de mantenimiento pendientes que excedan los límites establecidos deberá cambiar automáticamente su estado a "En Mantenimiento", impidiendo su asignación a nuevas rutas hasta que los servicios sean realizados y registrados.

**RF-035 — Orden de trabajo para mantenimiento:** El sistema debe permitir generar órdenes de trabajo para el área de mantenimiento, especificando vehículo, tipo de servicio requerido, urgencia (normal, urgente, crítico), observaciones adicionales y responsable asignado.

**RF-036 — Control de garantías:** El sistema debe almacenar información de garantías activas de cada vehículo, incluyendo componente cubierto, descripción de la garantía, fecha de inicio, fecha de expiración y proveedor. Las garantías próximas a vencer generarán notificaciones automáticas 30 días antes de su expiración.

---

### 2.6 Gestión de Rutas y Logística

**RF-037 — Creación de nuevas rutas:** El sistema debe permitir crear rutas especificando punto de origen, punto de destino, waypoints intermedios si aplican, distancia estimada en kilómetros, tiempo estimado de llegada, carga transportada y vehículo asignado junto con el conductor.

**RF-038 — Asignación de ruta a vehículo y conductor:** Cada ruta creada deberá ser asignada a un vehículo disponible y su conductor correspondiente. El sistema validará que el vehículo seleccionado se encuentre en estado "Disponible" y que el conductor no tenga una ruta activa en ese momento.

**RF-039 — Inicio y cierre de ruta:** El conductor o despachador deberá poder marcar el inicio oficial de una ruta con fecha, hora y odómetro de salida, y posteriormente marcar su cierre con fecha, hora, odómetro de llegada y resultado (completada, cancelada, incidente).

**RF-040 — Seguimiento de progreso de ruta:** Durante la ejecución de una ruta, el despachador deberá poder visualizar el progreso actualizado del vehículo a lo largo de la ruta, porcentaje de distancia recorrida, tiempo transcurrido versus tiempo estimado y hora estimada de llegada actualizada.

**RF-041 — Registro de incidencias en ruta:** El sistema debe permitir registrar incidencias ocurridas durante una ruta, incluyendo tipo de incidencia (accidente, avería mecánica, robo, retraso, desperfecto de carga), descripción detallada, ubicación donde ocurrió, hora y acciones tomadas para resolverla.

**RF-042 — Modificación de rutas en tiempo real:** El despachador deberá poder modificar una ruta en curso, agregando o quitando waypoints, cambiando el destino final o enviando instrucciones especiales al conductor. Toda modificación quedará registrada con fecha, hora, usuario que realizó el cambio y justificación.

**RF-043 — Consulta de rutas activas:** El sistema mostrará una lista de todas las rutas actualmente en ejecución con su estado, vehículo asignado, conductor responsable, progreso porcentual y hora estimada de llegada. Esta vista será accesible para despachadores y administradores.

---

### 2.7 Sistema de Comunicación

**RF-044 — Mensajería entre despachador y conductor:** El sistema debe permitir el envío de mensajes de texto entre el despachador y el conductor asignado a cada ruta. Los mensajes quedarán asociados a la ruta específica y quedarán registrados con fecha, hora, remitente y contenido para futuras consultas.

**RF-045 — Alertas push al conductor:** El sistema deberá poder enviar alertas push directamente al dispositivo móvil del conductor para notificar eventos importantes como cambios de ruta, alertas de seguridad, recordatorios de mantenimiento o mensajes prioritarios del despachador.

**RF-046 — Respuesta rápida predefinida para conductores:** El conductor deberá tener acceso a un conjunto de mensajes predefinidos de respuesta rápida que pueda enviar con un solo toque, tales como "En camino", "Parada programada", "Llegué al destino", "Necesito asistencia", "Incidente en camino".

**RF-047 — Notificaciones de seguimiento para clientes:** El sistema debe permitir a los clientes externos consultar en tiempo real el estado de su envío mediante un identificador único (número de guía o código de seguimiento), mostrando la última posición registrada del vehículo y la hora estimada de llegada actualizada.

---

### 2.8 Reportes y Business Intelligence

**RF-048 — Generación de reportes de rendimiento de flota:** El sistema debe permitir generar reportes automatizados que incluyen: kilómetros totales recorridos por período, consumo de combustible total, costo operativo por kilómetro, tiempo de utilización de cada vehículo, tiempo en mantenimiento versus tiempo en operación.

**RF-049 — Exportación de datos a formatos estándar:** Todos los reportes generados por el sistema deberán poder exportarse en al menos tres formatos: PDF para distribución e impresión, Excel (XLSX) para análisis posterior y CSV para integración con sistemas externos.

**RF-050 — Dashboard ejecutivo con indicadores clave:** El sistema debe proporcionar un dashboard ejecutivo que muestre de forma visual y actualizada los indicadores clave de desempeño (KPIs) de la operación de la flota, incluyendo: flota en operación versus fuera de operación, costo promedio por kilómetro, índice de cumplimiento de entregas, tendencia de consumo de combustible y alertas activas pendientes de atención.

---

## 3. Anexos

### 3.1 Glosario de Términos

| Término | Definición |
|---------|------------|
| GPS | Sistema de Posicionamiento Global por sus siglas en inglés |
| TOTP | Contraseña de un solo uso basada en tiempo (Time-based One-Time Password) |
| Geo-cercao | Delimitación geográfica virtual para monitoreo de vehículos |
| VIN | Número de Identificación Vehicular (Vehicle Identification Number) |
| KPI | Indicador Clave de Desempeño (Key Performance Indicator) |
| Waypoint | Punto intermedio de navegación en una ruta |

### 3.2 Metadatos del Documento

| Campo | Valor |
|-------|-------|
| Versión | 1.0 |
| Estado | Activo |
| Autor | Equipo Spottruck |
| Fecha de creación | 2026-06-04 |
| Última actualización | 2026-06-04 |
| Total de requisitos | 50 |

---

*Documento generado para el proyecto Spottruck — Plataforma de Gestión de Flotas de Transporte.*
