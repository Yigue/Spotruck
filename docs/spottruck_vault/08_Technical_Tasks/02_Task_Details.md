---
title: "02_Task_Details"
description: "Detalle de tareas técnicas para cada sprint del proyecto Spottruck - Especificación completa de implementación"
date: 2026-06-04
type: technical_document
category: task_breakdown
version: 1.0
status: approved
authors:
  - Project Team
tags:
  - tasks
  - implementation
  - development
  - sprint-tasks
  - technical-specs
related_documents:
  - 01_Sprint_Plan.md
  - 03_Feature_Mapping.md
  - 04_Acceptance_Criteria.md
---

# Detalle de Tareas Técnicas — Spottruck

## 1. Introducción

Este documento desglosa cada sprint definido en el plan de desarrollo en tareas técnicas específicas que el equipo de ingeniería debe ejecutar. Cada tarea incluye una descripción del trabajo a realizar, los criterios técnicos de aceptación, las dependencias con otras tareas, y la estimación de esfuerzo en story points. Este desglose granular sirve como guía de implementación y como herramienta de seguimiento del progreso, permitiendo al equipo y a los stakeholders visualizar exactamente qué trabajo está en progreso y qué trabajo falta por completar.

Las tareas están organizadas por sprint y por módulo funcional, manteniendo trazabilidad con los requisitos funcionales correspondientes. Cada tarea tiene un identificador único que sigue la convención TASK-{SPRINT}-{MODULO}-{NUMERO}, permitiendo referenciar eindeutid tareas específicas en todas las comunicaciones del proyecto. Las estimaciones de esfuerzo se basan en el análisis técnico preliminar y se ajustarán conforme el equipo gane experiencia con el codebase y las tecnologías seleccionadas.

---

## 2. Sprint 1: Tareas Técnicas

### 2.1 Módulo de Infraestructura Base

**TASK-1.1.1: Configuración del API Gateway**
Descripción: Implementar el API Gateway utilizando Kong o similar tecnología de gateway de APIs. El gateway debe manejar autenticación centralizada interceptando todos los requests, validar tokens JWT y rechazar aquellos expirados o mal formados, aplicar rate limiting por tier de usuario (100/500/2000 requests por minuto), enrutar requests a los microservicios correspondientes basándose en el path de la URL, y registrar todos los requests en logs estructurados con correlation IDs para trazabilidad distribuida. El gateway debe ser el único punto de entrada al sistema, rechazando cualquier tráfico directo a los servicios internos.
Criterios de aceptación: El gateway responde correctamente a requests autenticados con token válido, rechaza requests con token expirado o ausente con código 401, aplica rate limiting y devuelve 429 cuando se excede el límite, enruta correctamente a cada microservicio según el path, y propaga correlation IDs a través de todos los servicios.
Dependencias: Ninguna
Estimación: 13 story points
Prioridad: P1

**TASK-1.1.2: Configuración de Pipeline de CI/CD**
Descripción: Establecer el pipeline de integración y deployment continuo utilizando GitHub Actions o similar herramienta de CI. El pipeline debe ejecutar automáticamente todas las pruebas unitarias y de integración en cada push a cualquier rama, ejecutar análisis estático de código con herramientas como SonarQube, generar reportes de coverage de código, construir imágenes Docker para cada microservicio, desplegar automáticamente a entornos de staging en pushes a la rama develop, y facilitar el deployment a producción mediante manual approval. El pipeline debe incluir stages de testing, building, y deployment con gates de calidad entre cada stage.
Criterios de aceptación: Todo push trigger the pipeline completo, las pruebas se ejecutan en isolation con base de datos temporales, el análisis estático no permite merging de código con code smells críticos, las imágenes Docker se almacenan en registry privado, y los deployments a staging son automáticos mientras producción requiere approval manual.
Dependencias: TASK-1.1.1 (API Gateway debe estar operativo para validar integraciones)
Estimación: 5 story points
Prioridad: P1

**TASK-1.1.3: Configuración de Infraestructura como Código**
Descripción: Implementar la configuración de infraestructura utilizando Terraform para AWS o el cloud provider seleccionado. El código debe definir VPCs, subnets, security groups, instancias de base de datos PostgreSQL con réplicas de lectura, clusters de Redis, buckets de S3 para almacenamiento de archivos estáticos, balanceadores de carga applicación, y tablas de DynamoDB si se requiere almacenamiento NoSQL para datos específicos. Toda la configuración debe estar versionada junto con el código de la aplicación y ser reproducible en cualquier entorno.
Criterios de aceptación: La infraestructura puede crearse desde cero ejecutando terraform apply, los recursos se destruyen completamente con terraform destroy, la configuración diferencia claramente entre entornos de development, staging y production mediante variables, y no hay secretos hardcodeados en el código de Terraform.
Dependencias: Ninguna (puede ejecutarse en paralelo con otras tareas del sprint)
Estimación: 8 story points
Prioridad: P1

### 2.2 Módulo de Autenticación

**TASK-1.2.1: Servicio de Registro de Usuarios**
Descripción: Implementar el microservicio de registro de usuarios con los siguientes endpoints: POST /v1/auth/register que reciba nombre de usuario único, email, contraseña y confirmación, valide que la contraseña cumpla con los requisitos de complejidad (mínimo 8 caracteres, al menos una mayúscula, un número, un carácter especial), genere un hash bcrypt con cost factor 12, almacene el usuario en PostgreSQL con estado pending, genere un token JWT de verificación con validez de 24 horas, y envíe email de verificación utilizando el servicio de email configurado. El endpoint de verificación GET /v1/auth/verify-email/:token debe marcar el usuario como verified y devolver una respuesta de confirmación.
Criterios de aceptación: El registro falla si el nombre de usuario o email ya existen, la contraseña se almacena únicamente como hash bcrypt, el token de verificación expira después de 24 horas, el usuario no puede hacer login hasta verificar su email, y los intentos de registro con datos inválidos devuelven mensajes de error específicos por tipo de error.
Dependencias: TASK-1.1.1 (API Gateway debe enrutar correctamente al servicio)
Estimación: 8 story points
Prioridad: P1

**TASK-1.2.2: Servicio de Inicio de Sesión**
Descripción: Implementar el endpoint POST /v1/auth/login que valide credenciales y genere tokens JWT. El servicio debe verificar que el usuario existe y está verificado, comparar la contraseña ingresada contra el hash almacenado, generar un access token JWT con claims de user_id, roles y expires_in de 15 minutos, generar un refresh token JWT con expires_in de 7 días, almacenar el refresh token en Redis para permitir revocation, registrar el intento de login en el log de auditoría incluyendo dirección IP y timestamp, bloquear la cuenta temporalmente después de 5 intentos fallidos consecutivos, y devolver el token en una cookie HttpOnly para seguridad. El endpoint POST /v1/auth/refresh debe aceptar el refresh token y devolver un nuevo par de access y refresh tokens.
Criterios de aceptación: Login exitoso devuelve access token válido que puede usarse para acceder a endpoints protegidos, login fallido incrementa el contador y eventual bloqueo, refresh token funciona hasta su expiración, logout invalidates the refresh token en Redis, y los tokens contienen los claims correctos del usuario.
Dependencias: TASK-1.2.1 (Estructura de usuario debe estar definida)
Estimación: 5 story points
Prioridad: P1

**TASK-1.2.3: Implementación de Autenticación de Dos Factores**
Descripción: Implementar el módulo de autenticación de dos factores utilizandoTime-based One-Time Password (TOTP). El endpoint POST /v1/auth/2fa/enable debe generar un secret de TOTP, almacenarlo encriptado en el perfil del usuario, y devolver un QR code para configurar la aplicación autenticadora. El endpoint POST /v1/auth/2fa/verify debe recibir el código de 6 dígitos generado por la app del usuario, validarlo contra el secret almacenado, y marcar el 2FA como habilitado en el perfil del usuario. El endpoint POST /v1/auth/login debe extenderse para, cuando 2FA está habilitado, requerir el código además de la contraseña y mostrar un segundo paso de autenticación. Esta funcionalidad es obligatoria para administradores y opcional para otros roles.
Criterios de aceptación: Los usuarios pueden habilitar 2FA escaneando el QR code, el login con 2FA habilitado requiere el código además de contraseña, los códigos TOTP expiran después de 30 segundos, un nuevo código es válido apenas se genera, y los administradores no pueden hacer login sin 2FA cuando está habilitado globalmente.
Dependencias: TASK-1.2.2 (Login básico debe estar funcionando)
Estimación: 8 story points
Prioridad: P1

**TASK-1.2.4: Sistema de Cierre por Inactividad**
Descripción: Implementar el middleware de sesión que valide el tiempo de inactividad y cierre la sesión automáticamente. El middleware debe verificar el timestamp del último request en cada petition protegida, mostrar warning a los 25 minutos de inactividad con un modal que permita continuar la sesión, cerrar automáticamente la sesión a los 30 minutos de inactividad, invalidar el refresh token en Redis al cerrar la sesión, y redirigir al usuario a la página de login con mensaje indicando que la sesión expiró por inactividad. El tracking de actividad debe actualizarse con cada request válido al API.
Criterios de aceptación: El usuario recibe warning a los 25 minutos, hacer click en continuar extiende la sesión correctamente, la sesión se cierra a los 30 minutos sin actividad, el cierre de sesión invalida todos los tokens asociados, y el comportamiento puede deshabilitarse por rol si el negocio lo requiere.
Dependencias: TASK-1.2.2 (Sistema de tokens debe estar operativo)
Estimación: 3 story points
Prioridad: P2

### 2.3 Módulo de Gestión de Usuarios y Roles

**TASK-1.3.1: CRUD de Usuarios con Validación**
Descripción: Implementar el microservicio de gestión de usuarios con endpoints para crear, leer, actualizar y desactivar usuarios. El servicio debe manejar POST /v1/users para crear nuevos usuarios con validación de datos, GET /v1/users/:id para consultar datos de un usuario específico, PUT /v1/users/:id para actualizar datos del perfil (nombre, email, teléfono, foto), PATCH /v1/users/:id/deactivate para desactivar un usuario sin eliminarlo, y GET /v1/users con paginación y filtros para listar usuarios. Todas las operaciones deben verificar que el solicitante tiene permisos RBAC para realizar la acción, y cada modificación debe generar un registro en el log de auditoría.
Criterios de aceptación: Los usuarios pueden actualizar su propio perfil sin permisos de administrador, solo administradores pueden cambiar roles, la desactivación no elimina datos sino que cambia el estado, y todas las operaciones quedan registradas en auditoría.
Dependencias: TASK-1.2.1 (Estructura de auth debe existir)
Estimación: 5 story points
Prioridad: P1

**TASK-1.3.2: Sistema de Roles y Permisos RBAC**
Descripción: Implementar el sistema de control de acceso basado en roles con los cuatro roles definidos: Administrador (acceso total), Despachador (gestión de flota y operaciones), Operador de Flota (monitoreo y reportes), y Conductor (acceso limitado a información propia y mensajería). Cada rol tendrá un conjunto de permissions específicas expresadas como recurso:acción. El sistema debe incluir endpoints para consultar los permisos de un rol, y middlewares para verificar permisos en cada endpoint protegido. Los permisos deben evaluarse en cada request antes de procesar la lógica de negocio.
Criterios de aceptación: Cada endpoint protegido verifica los permisos del usuario antes de ejecutar, un usuario sin permisos recibe respuesta 403 Forbidden, los permisos son consultables por API para debugging, y la estructura permite agregar nuevos roles sin modificar código del sistema de permisos.
Dependencias: TASK-1.3.1 (Estructura de usuarios)
Estimación: 8 story points
Prioridad: P1

**TASK-1.3.3: Restricción de Sesiones Simultáneas**
Descripción: Implementar la lógica que impide que un mismo usuario tenga más de una sesión activa simultáneamente. Cuando un usuario inicia sesión, cualquier sesión activa previa debe invalidarse. La implementación debe almacenar el session ID activo en Redis asociado al user ID, verificar y invalidar sesiones anteriores en el proceso de login, notificar al usuario cuya sesión fue reemplazada mediante email o push notification, y permitir que el usuario que recibió la notificación pueda revisar actividad suspicious si no reconoció la nueva sesión.
Criterios de aceptación: Un segundo login invalida la primera sesión, el usuario desconectado recibe notificación del nuevo login, la sesión nueva funciona correctamente inmediatamente, y no hayrace conditions en la invalidación de sesiones anteriores.
Dependencias: TASK-1.2.2 (Sistema de autenticación)
Estimación: 3 story points
Prioridad: P2

### 2.4 Módulo de Auditoría

**TASK-1.4.1: Sistema de Log de Auditoría**
Descripción: Implementar el servicio centralizado de log de auditoría que registra todas las acciones significativas realizadas en el sistema. Cada log debe incluir timestamp preciso en UTC, user ID del usuario que realizó la acción, acción performed en formato legible, módulo o recurso afectado, resultado de la operación (éxito, fallo, error), dirección IP del cliente, correlation ID del request, y datos adicionales relevantes en formato JSON estructurado. El sistema debe ser inmutable: una vez escrito, ningún registro puede modificarse o eliminarse, ni siquiera por administradores. La retención de logs debe configurarse según las políticas de compliance del cliente, con mínimo de dos años para datos financieros y regulatorios.
Criterios de aceptación: Toda acción significativa genera un registro en el log de auditoría, los logs no pueden modificarse ni eliminarse después de su escritura, los logs son consultables mediante API por usuarios con rol de administrador, los logs incluyen todos los campos requeridos, y el performance del logging no afecta significativamente la latencia de los requests principales.
Dependencias: TASK-1.1.1 (API Gateway con correlation IDs)
Estimación: 5 story points
Prioridad: P1

---

## 3. Sprint 2: Tareas Técnicas

### 3.1 Módulo de Gestión de Flota

**TASK-2.1.1: CRUD de Vehículos**
Descripción: Implementar el microservicio de gestión de vehículos con los endpoints necesarios para registrar y mantener el catálogo de unidades de la flota. El servicio debe manejar POST /v1/vehicles para registrar un nuevo vehículo con validación de datos requerida incluyendo matrícula como identificador único, marca, modelo, año de fabricación, tipo de vehículo según enumeración predefined, capacidad de carga en toneladas, capacidad del tanque en litros, tipo de combustible, número de serie VIN como identificador inmutable, número de póliza de seguro, y kilometraje actual. El GET /v1/vehicles/:id debe devolver todos los datos técnicos del vehículo incluyendo su estado actual. El PUT /v1/vehicles/:id debe permitir actualizar todos los campos excepto el VIN. El GET /v1/vehicles debe devolver la lista paginada de vehículos con filtros por estado, tipo, y rango de capacidad.
Criterios de aceptación: La matrícula debe ser única en el sistema, el VIN no puede modificarse después del registro inicial, los tipos de vehículo válidos se validan contra el enumerado predefined, y la información del seguro incluye fechas de vigencia.
Dependencias: TASK-1.1.1 (API Gateway)
Estimación: 8 story points
Prioridad: P1

**TASK-2.1.2: Máquina de Estados de Vehículo**
Descripción: Implementar el sistema de estados operativos del vehículo con la máquina de estados que gobierna las transiciones válidas. Los estados disponibles son Disponible, En Servicio, En Mantenimiento, Fuera de Servicio, y Dado de Baja. Las transiciones válidas son: Disponible a En Servicio cuando se asigna a una ruta, Disponible a En Mantenimiento cuando se programa servicio, Disponible a Fuera de Servicio por emergencia o falla detectada, Disponible a Dado de Baja cuando se retira definitivamente, En Servicio a Disponible cuando se completa la ruta, En Servicio a En Mantenimiento si se detecta falla en ruta, En Mantenimiento a Disponible cuando se completa el servicio, En Mantenimiento a Fuera de Servicio si el servicio revela daños mayores, Fuera de Servicio a Disponible cuando se repara y acredita, Fuera de Servicio a En Mantenimiento para corrección, Fuera de Servicio a Dado de Baja si no es factible la reparación. Cada transición debe validarse contra estas reglas y registrar el cambio en el historial del vehículo.
Criterios de aceptación: Las transiciones inválidas se rechazan con mensaje explicativo, cada cambio de estado genera registro con timestamp y usuario que realizó el cambio, el historial completo de estados es consultable para cualquier vehículo, y los estados impactan qué vehículos aparecen disponibles para asignación.
Dependencias: TASK-2.1.1 (CRUD de vehículos)
Estimación: 5 story points
Prioridad: P1

**TASK-2.1.3: Sistema de Asignaciones Vehículo-Conductor**
Descripción: Implementar el módulo que gestiona las asignaciones de vehículos a conductores. El sistema debe permitir asignar un vehículo a un conductor específico mediante POST /v1/assignments con vehicle_id, driver_id, y timestamp de inicio. La asignación debe validar que el vehículo no esté en estado de mantenimiento o fuera de servicio, que el conductor no tenga ya otra asignación activa, y registrar la fecha, hora y responsable de la asignación. El sistema debe permitir cerrar una asignación existente con fecha de fin y motivo mediante PATCH /v1/assignments/:id/close. El historial de asignaciones debe consultarse mediante GET /v1/vehicles/:id/assignments y GET /v1/drivers/:id/assignments.
Criterios de aceptación: No se pueden asignar vehículos en mantenimiento o fuera de servicio, un conductor no puede tener dos asignaciones activas simultáneas, el cierre de asignación requiere fecha de fin y motivo, y el historial muestra todas las asignaciones pasadas con su información completa.
Dependencias: TASK-2.1.2 (Estados de vehículo), TASK-1.3.1 (Gestión de usuarios)
Estimación: 5 story points
Prioridad: P1

### 3.2 Módulo de Tracking GPS

**TASK-2.2.1: Recepción y Procesamiento de Datos GPS**
Descripción: Implementar el servicio que recibe y procesa los datos de posición enviados por los dispositivos GPS instalados en cada vehículo. El servicio debe exponer POST /v1/gps/data como endpoint para que los dispositivos envíen datos de latitud, longitud, velocidad actual, dirección en grados, timestamp del dispositivo, y quality de la señal GPS. El procesamiento debe validar los datos recibidos, actualizar la posición actual del vehículo en la base de datos, publicar el evento de nueva posición para consumo por otros servicios (alertas, tracking web), y archivar los datos históricos para generación de reportes. La frecuencia de actualización configurada es de treinta segundos para vehículos en movimiento y cinco minutos para vehículos detenidos.
Criterios de aceptación: El endpoint acepta datos de múltiples dispositivos simultáneamente, los datos inválidos se rechazan con log de error para debugging, la latencia de procesamiento es menor a cinco segundos desde receipt hasta disponibilidad en base de datos, y los datos históricos se almacenan para permitir consultas de hasta un año.
Dependencias: TASK-1.1.1 (API Gateway)
Estimación: 8 story points
Prioridad: P1

**TASK-2.2.2: Servicio de Mapa Interactivo**
Descripción: Implementar el servicio que provee los datos para la interfaz de mapa interactivo del panel de monitoreo. El endpoint GET /v1/tracking/vehicles debe devolver la posición actual de todos los vehículos activos con su metadata incluyendo estado, conductor asignado, velocidad actual, y última actualización. El endpoint GET /v1/tracking/vehicles/:id/history debe permitir consultar el historial de posiciones en un rango de fechas con paginación, devolviendo los puntos de trayectoria junto con timestamps y velocidades en cada punto. Los datos deben optimizarse para consumo por bibliotecas de mapas como Leaflet o Google Maps, incluyendo la transformación de coordenadas al formato requerido.
Criterios de aceptación: Las posiciones se actualizan en tiempo real mediante polling eficiente cada treinta segundos, el historial permite rangos de hasta treinta días con paginación, la respuesta incluye todos los datos necesarios para renderizar markers en el mapa, y el consumo de recursos está optimizado paraHandle cientos de vehículos simultáneos.
Dependencias: TASK-2.2.1 (Recepción de datos GPS)
Estimación: 5 story points
Prioridad: P1

**TASK-2.2.3: Algoritmos de Detección y Geofencing**
Descripción: Implementar los servicios de detección de permanencia y geofencing. El servicio de detección de permanencia debe identificar cuando un vehículo permanece inmóvil en una ubicación por más de quince minutos, generando un evento de alerta que se envía al despachador asignado. El servicio de geofencing debe permitir crear, actualizar y eliminar geo-cercaos mediante endpoints CRUD, almacenar las coordenadas de los polígonos que definen cada geo-cercao, detectar cuando un vehículo entra o sale de una geo-cercao predefinida, y generar notificaciones automáticas especificando vehículo, tipo de evento, y hora. La detección de geofencing debe ejecutarse continuamente procesando los eventos de posición entrantes.
Criterios de aceptación: Las alertas de permanencia se generan exactamente a los quince minutos de inmovilidad, las notificaciones de geofencing se generan en máximo un minuto después del evento de entrada o salida, las geo-cercaos pueden definirse con cualquier forma poligonal, y el servicio maneja thousands de eventos por segundo sin perder datos.
Dependencias: TASK-2.2.1 (Datos GPS)
Estimación: 8 story points
Prioridad: P2

---

## 4. Sprint 3: Tareas Técnicas

### 4.1 Módulo de Gestión de Combustible

**TASK-3.1.1: Registro de Cargas de Combustible**
Descripción: Implementar el sistema de registro de consumo de combustible que captura cada carga asociada a un vehículo. El endpoint POST /v1/fuel/loads debe recibir litros cargados, costo por litro, estación de servicio seleccionada de un catálogo predefinido, fecha y hora de la carga, odómetro en el momento de la carga leído del panel del vehículo, y conductor responsable que reporta. El sistema debe calcular automáticamente el costo total de la carga, actualizar el kilometraje del vehículo si el odómetro reportado es superior al registrado, y almacenar el registro para cálculos de rendimiento posteriores. El historial de cargas consultable mediante GET /v1/vehicles/:id/fuel/history debe mostrar todas las cargas ordenadas cronológicamente con su costo asociado.
Criterios de aceptación: Los litros cargados deben ser positivos y razonables para el tamaño del tanque del vehículo, la fecha no puede ser futura, el odómetro no puede ser inferior al último registrado, y el costo total se calcula y almacena automáticamente.
Dependencias: TASK-2.1.1 (Gestión de vehículos)
Estimación: 5 story points
Prioridad: P1

**TASK-3.1.2: Cálculo de Rendimiento de Combustible**
Descripción: Implementar los algoritmos que calculan el rendimiento de combustible de cada vehículo. El cálculo debe tomar los kilómetros recorridos entre dos cargas de combustible y los litros consumidos en ese tramo para obtener el rendimiento en kilómetros por litro. El sistema debe mantener el promedio histórico de rendimiento por vehículo, compararlo con los parámetros de rendimiento esperado según el tipo de vehículo (por ejemplo, un camión de carga promedio debería rendir entre 3 y 4 km/L), y almacenar estas métricas para visualización y alerting. El endpoint GET /v1/vehicles/:id/fuel/efficiency debe devolver el rendimiento actual, el promedio histórico, y la desviación del esperado.
Criterios de aceptación: El rendimiento se calcula automáticamente después de cada carga de combustible, los promedios históricos incluyen datos de al menos los últimos treinta días, la comparación contra esperado permite configurar umbrales de tolerancia, y los cálculos son precisos incluso cuando hay múltiples cargas en un mismo día.
Dependencias: TASK-3.1.1 (Registro de cargas)
Estimación: 3 story points
Prioridad: P1

**TASK-3.1.3: Alertas de Consumo Anómalo**
Descripción: Implementar el sistema de alertas que detecta y notifica sobre consumos de combustible fuera de los parámetros normales. Cuando el rendimiento de un vehículo cae por debajo del ochenta y cinco por ciento del rendimiento promedio histórico, el sistema debe generar una alerta de consumo anómalo. La alerta debe incluir vehículo afectado, conductor asignado en el momento, rendimiento actual versus esperado, y fecha de la última carga que originó la alerta. Las alertas deben appearcer en el dashboard del despachador y puede configurarse envío por email o notificación push según preferencia del usuario.
Criterios de aceptación: Las alertas se generan automáticamente cuando el rendimiento cae por debajo del umbral, las alertas incluyen todos los datos requeridos para investigación, las alertas pueden configurarse con diferentes umbrales por tipo de vehículo, y el sistema aprende de los datos para refinar los promedios históricos.
Dependencias: TASK-3.1.2 (Cálculo de rendimiento)
Estimación: 3 story points
Prioridad: P2

### 4.2 Módulo de Mantenimiento

**TASK-3.2.1: Calendario de Mantenimiento Preventivo**
Descripción: Implementar el sistema de calendario de mantenimiento preventivo basado en kilómetros recorridos y tiempo transcurrido. Los parámetros de mantenimiento por tipo de vehículo incluyen: cambio de aceite cada diez mil kilómetros, rotación de neumáticos cada ocho mil kilómetros, revisión de frenos cada quince mil kilómetros, y servicio general cada veinte mil kilómetros. El sistema debe trackear el kilometraje actual de cada vehículo, calcular los kilómetros faltantes para el próximo servicio de cada tipo, generar alertas veinticinco por ciento antes de alcanzar el umbral de cada servicio, y permitir configurar parámetros custom por vehículo si el operador tiene necesidades específicas.
Criterios de aceptación: Los parámetros de mantenimiento son editables por administradores, las alertas se generan con suficiente anticipación para planificar el servicio, el calendario muestra todos los servicios próximos para toda la flota, y los cambios de kilometraje aktualizan automaticamente los cálculos de servicios.
Dependencias: TASK-2.1.1 (Gestión de vehículos), TASK-2.2.1 (Tracking GPS para kilometraje)
Estimación: 8 story points
Prioridad: P1

**TASK-3.2.2: Órdenes de Mantenimiento**
Descripción: Implementar el sistema de órdenes de trabajo para el taller de mantenimiento. El endpoint POST /v1/maintenance/work-orders debe permitir crear una orden especificando vehículo, tipo de servicio, fecha programada, taller asignado si es externo, descripción del trabajo a realizar, y piezas o materiales requeridos. El sistema debe permitir actualizar el estado de la orden (Programada, En Progreso, Completada, Cancelada), registrar la fecha de inicio real y fecha de finalización, capturar los costos reales incluyendo mano de obra y repuestos, y vincular la orden con los registros de consumo de combustible si el mantenimiento alteró el consumo. Las órdenes de mantenimiento preventivo se crean automáticamente según el calendario, mientras las correctivas se crean manualmente cuando se detecta una falla.
Criterios de aceptación: Las órdenes de mantenimiento preventivo se generan automáticamente según el calendario, el cierre de orden requiere información de costos reales, el historial de órdenes de cada vehículo es consultable con filtros por fecha y tipo de servicio, y las órdenes abiertas no permiten que el vehículo sea asignado a rutas.
Dependencias: TASK-3.2.1 (Calendario de mantenimiento)
Estimación: 5 story points
Prioridad: P1

---

## 5. Sprint 4: Tareas Técnicas

### 5.1 Módulo de Comunicación

**TASK-4.1.1: Sistema de Mensajería Conductor-Despachador**
Descripción: Implementar el sistema de mensajería que permite comunicación directa entre conductores en ruta y despachadores en la operación. El endpoint POST /v1/messages debe permitir enviar un mensaje especificando destinatario, contenido en texto, y tipo (mensaje directo, broadcast al equipo, emergencia). El endpoint GET /v1/messages/conversations/:driver_id debe devolver el historial de conversaciones de un conductor con paginación. El sistema debe soportar mensajes de emergencia con prioridad alta que aparecen inmediatamente en la interfaz del despachador, confirmación de lectura con timestamp, y templates de mensajes predefined para situaciones comunes que reducen el tiempo de captura en dispositivos móviles.
Criterios de aceptación: Los mensajes se entregan en menos de diez segundos desde envío, los mensajes de emergencia aparecen como notificaciones push inmediatas, los conductores pueden enviar mensajes desde una interfaz optimizada para uso con una mano mientras conducen, y el historial de conversaciones es consultable por fecha y por participante.
Dependencias: TASK-1.1.1 (API Gateway), TASK-2.1.3 (Asignaciones)
Estimación: 8 story points
Prioridad: P1

### 5.2 Módulo de Alertas

**TASK-4.2.1: Motor de Alertas Centralizado**
Descripción: Implementar el motor centralizado que recibe eventos de todos los módulos del sistema y genera alertas coordinadas. El motor debe recibir eventos del módulo de GPS (vehículo detenido, geo-cercao violado, velocidad excesiva), del módulo de combustible (consumo anómalo, tanque bajo), del módulo de mantenimiento (servicio próximo o vencido, avería reportada), y del módulo de mensajería (mensaje de emergencia). El motor debe correlacionar eventos relacionados para evitar duplicados, por ejemplo cuando múltiples eventos indicam la misma situación, priorizar las alertas por severidad (crítica, alta, media, baja), y enrutar cada alerta al responsable designado según reglas configurables que consideran rol, Assignment actual del vehículo, y turno de trabajo.
Criterios de aceptación: Las alertas críticas aparecen en el dashboard sin necesidad de refresh, las alertas se enrutan al despachador correcto basado en la asignación del vehículo, los eventos duplicados se consolidan en una sola alerta, y las reglas de enrutamiento son configurables sin código.
Dependencias: TASK-4.1.1 (Mensajería), TASK-2.2.3 (Geofencing), TASK-3.1.3 (Alertas de combustible)
Estimación: 8 story points
Prioridad: P1

---

## 6. Sprint 5: Tareas Técnicas

### 6.1 Módulo de Reportes

**TASK-5.1.1: Generador de Reportes Automatizados**
Descripción: Implementar el módulo de generación de reportes que produce documentos en formato PDF y Excel con datos consolidados de las operaciones. El sistema debe incluir reportes operativos de tracking y utilización de flota, reportes financieros de combustible y mantenimiento versus presupuestos, reportes de eficiencia de conductores basados en métricas de manejo, y exportación flexible con filtros combinables por fecha, vehículo, conductor, y cualquier campo relevante. Los reportes pueden generarse bajo demanda o programarse para ejecución automática con envío por email a stakeholders configurados.
Criterios de aceptación: Los reportes se generan en menos de treinta segundos para períodos de hasta un mes, los PDFs mantienen formato consistente con headers y footers, los archivos Excel contienen múltiples hojas con diferentes vistas de los datos, y los reportes programados se envían exactamente a la hora configurada.
Dependencias: TASK-2.2.1 (GPS), TASK-3.1.1 (Combustible), TASK-3.2.2 (Mantenimiento)
Estimación: 8 story points
Prioridad: P2

### 6.2 Módulo de Analíticas

**TASK-5.2.1: Dashboard de Métricas y KPIs**
Descripción: Implementar el dashboard interactivo que visualiza los KPIs principales de la operación de la flota. El dashboard debe mostrar número de vehículos activos versus inactivos, kilómetros totales recorridos en el período seleccionado, consumo total de combustible con costo asociado, cumplimiento de mantenimiento preventivo (porcentaje de servicios realizados a tiempo), y tendencia de eficiencia de combustible comparada contra períodos anteriores. Los gráficos deben ser interactivos permitiendo drill-down desde vistas agregadas hasta datos individuales, y exportables como imagen para inclusión en presentaciones ejecutivas.
Criterios de aceptación: El dashboard carga en menos de cinco segundos con datos de hasta treinta días, los gráficos permiten zoom y filtrado interactivo, los datos se actualizan automáticamente cada hora, y la exportación de gráficos funciona correctamente en los principales navegadores.
Dependencias: TASK-5.1.1 (Reportes)
Estimación: 5 story points
Prioridad: P2

---

## 7. Sprint 6: Tareas Técnicas

### 7.1 Integraciones Externas

**TASK-6.1.1: Integración con Sistemas de Tarjetas de Combustible**
Descripción: Implementar los conectores para importar automáticamente transacciones de sistemas de tarjetas de combustible de Ticket Car, Edenred y Fleetcor. El sistema debe consumir archivos en los formatos estándar de cada proveedor, normalizar los datos al formato interno de Spottruck, detectar duplicados basándose en número de transacción externo y fecha, crear automáticamente registros de carga de combustible en el sistema, y generar reportes de conciliación que comparen los datos importados contra los reportes manuales de los conductores. Esta integración reduce significativamente la captura manual de datos y mejora la precisión de los registros de consumo.
Criterios de aceptación: Las transacciones se importan sin intervención manual, los duplicados se detectan y no crean registros duplicados, los errores de formato se notifican al administrador con detalles para corrección, y la conciliación muestra diferencias entre datos de tarjetas y reportes manuales.
Dependencias: TASK-3.1.1 (Registro de cargas de combustible)
Estimación: 8 story points
Prioridad: P2

---

## 8. Resumen de Estimaciones por Sprint

| Sprint | Módulo | Tareas | Story Points |
|--------|--------|--------|--------------|
| Sprint 1 | Infraestructura | 3 | 26 |
| Sprint 1 | Autenticación | 4 | 24 |
| Sprint 1 | Usuarios y Roles | 3 | 16 |
| Sprint 1 | Auditoría | 1 | 5 |
| **Sprint 1 Total** | | **11** | **71** |
| Sprint 2 | Gestión de Flota | 3 | 18 |
| Sprint 2 | Tracking GPS | 3 | 21 |
| **Sprint 2 Total** | | **6** | **39** |
| Sprint 3 | Combustible | 3 | 11 |
| Sprint 3 | Mantenimiento | 2 | 13 |
| **Sprint 3 Total** | | **5** | **24** |
| Sprint 4 | Comunicación | 1 | 8 |
| Sprint 4 | Alertas | 1 | 8 |
| **Sprint 4 Total** | | **2** | **16** |
| Sprint 5 | Reportes | 1 | 8 |
| Sprint 5 | Analíticas | 1 | 5 |
| **Sprint 5 Total** | | **2** | **13** |
| Sprint 6 | Integraciones | 1 | 8 |
| **Sprint 6 Total** | | **1** | **8** |
| **TOTAL** | | **27** | **171** |

Las estimaciones finales de story points por sprint difieren de las originales del plan debido al desglose granular de tareas técnicas. El equipo utilizará estos datos granulares para el seguimiento semanal del sprint mientras el plan maestro mantiene las estimaciones agregadas para comunicación con stakeholders.

