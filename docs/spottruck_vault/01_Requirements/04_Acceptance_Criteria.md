---
title: "04_Acceptance_Criteria"
description: "Criterios de aceptación en formato Given/When/Then para cada requisito funcional del sistema"
date: 2026-06-03
type: documentation
category: requirements_management
version: 1.0
status: approved
authors:
  - Project Team
tags:
  - acceptance-criteria
  - bdd
  - requirements
  - testing
  - given-when-then
related_documents:
  - 01_Requirements_V1.md
  - 03_Feature_Mapping.md
---

# Criterios de Aceptación: Requisitos Funcionales

## 1. Introducción

Este documento establece los criterios de aceptación para cada uno de los 60 requisitos funcionales del sistema de gestión empresarial Spottruck. Los criterios están escritos en formato BDD (Behavior-Driven Development) utilizando la estructura Given/When/Then para garantizar que las funcionalidades puedan ser verificadas de manera objetiva y que todas las partes interesadas tengan una comprensión común de cuándo un requisito se considera completado.

El formato Given/When/Then permite traducir cada requisito en escenarios ejecutables que pueden automatizarse mediante pruebas. Cada criterio define las condiciones previas (Given), la acción o evento que ocurre (When), y el resultado esperado (Then). Este enfoque facilita la comunicación entre el equipo técnico y los stakeholders del negocio, reduciendo ambigüedades y malentendidos.

Los criterios de aceptación establecidos en este documento complementan las descripciones de requisitos funcionales y deben utilizarse como referencia para la creación de pruebas funcionales, sesiones de revisión con usuarios, y validación de implementación. Ningún requisito se considerará completo hasta que todos sus criterios de aceptación hayan sido verificados satisfactoriamente.

---

## 2. Criterios de Aceptación por Requisito Funcional

### 2.1 RF-001: Gestión de Usuarios y Autenticación

**Feature**: Sistema de autenticación seguro con gestión completa de usuarios

**Escenario 1: Registro de nuevo usuario**
```
Given el usuario administrador accede al módulo de gestión de usuarios
When ingresa los datos requeridos: nombre de usuario único, contraseña segura, correo electrónico válido, nombres completos y rol asignado
Then el sistema crea el usuario con estado activo y muestra confirmación de registro exitoso

Given el usuario administrador intenta registrar un usuario con un nombre de usuario ya existente en el sistema
When completa el formulario de registro con datos duplicados
Then el sistema muestra mensaje de error indicando que el nombre de usuario ya existe y no permite el registro
```

**Escenario 2: Autenticación con credenciales válidas**
```
Given un usuario registrado con credenciales válidas intenta acceder al sistema
When introduce su nombre de usuario y contraseña correctos
Then el sistema genera un token JWT con validez de 24 horas, muestra la interfaz principal del usuario y registra el acceso exitoso con marca de tiempo en el historial

Given un usuario cuya cuenta está desactivada intenta autenticarse
When ingresa credenciales correctas pero la cuenta tiene estado inactivo
Then el sistema rechaza el acceso con mensaje indicando que la cuenta está desactivada y no genera token JWT
```

**Escenario 3: Almacenamiento seguro de contraseñas**
```
Given el sistema recibe una contraseña durante registro o cambio de la misma
When procesa la contraseña ingresada
Then la almacena utilizando hash bcrypt con salt único por usuario y nunca almacena contraseñas en texto plano

Given un administrador revisa la base de datos de usuarios
When consulta los campos de contraseña
Then observa valores hash cifrados que no pueden ser revertidos a la contraseña original
```

**Escenario 4: Registro de intentos de acceso fallidos**
```
Given un usuario ingresa credenciales incorrectas durante el proceso de autenticación
When el sistema valida las credenciales
Then registra el intento fallido en el historial de accesos con fecha, hora, dirección IP y nombre de usuario utilizado, e incrementa el contador de intentos fallidos

Given un usuario acumula 5 intentos de acceso fallidos consecutivos
When intenta autenticarse nuevamente
Then el sistema bloquea la cuenta por 30 minutos y notifica al administrador del intento de acceso sospechoso
```

---

### 2.2 RF-002: Gestión de Roles y Permisos

**Feature**: Sistema RBAC con roles predefinidos y permisos granulares

**Escenario 1: Asignación de roles a usuarios**
```
Given un administrador accede al módulo de gestión de roles
When asigna múltiples roles a un usuario específico
Then el usuario adquiere todos los permisos combinados de los roles asignados y el sistema persiste la asignación

Given un administrador consulta los permisos efectivos de un usuario con múltiples roles
When solicita ver el resumen de permisos
Then el sistema muestra la lista completa de permisos sin duplicados, indicando claramente qué permisos provienen de qué rol
```

**Escenario 2: Roles predefinidos del sistema**
```
Given el sistema está configurado con los roles predefinidos
When un usuario con rol Administrador accede
Then tiene acceso completo a todas las funcionalidades del sistema incluyendo gestión de roles y usuarios

Given un usuario con rol Consultor accede al sistema
When intenta realizar operaciones de creación, modificación o eliminación
Then el sistema muestra mensaje de acceso denegado y no permite la operación
```

**Escenario 3: Modificación de permisos de roles**
```
Given un administrador modifica los permisos asociados a un rol específico
When guarda los cambios en la configuración de roles
Then el sistema actualiza inmediatamente los permisos para todos los usuarios que tengan asignado ese rol, sin necesidad de cerrar sesión

Given un administrador elimina un permiso específico de un rol
When usuarios activos están utilizando el sistema con ese rol
Then los usuarios pierden acceso a la funcionalidad asociada en su próximo acceso a la misma
```

---

### 2.3 RF-003: Registro de Entidades Comerciales

**Feature**: Gestión completa del ciclo de vida de entidades comerciales

**Escenario 1: Creación de entidad comercial**
```
Given un usuario con permisos de creación accede al módulo de entidades comerciales
When ingresa la información requerida: razón social, número de identificación fiscal, dirección fiscal, teléfono, correo, clasificación de industria y tamaño de empresa
Then el sistema crea la entidad con estado activo, le asigna un identificador único y la muestra en el listado de entidades

Given un usuario intenta crear una entidad con un número de identificación fiscal ya existente
When completa el formulario de registro
Then el sistema muestra mensaje de error indicando duplicidad y sugiere verificar los datos ingresados
```

**Escenario 2: Clasificación de entidades como clientes y proveedores**
```
Given una entidad comercial existe en el sistema
When un administrador marca la entidad como cliente
Then la entidad aparece en los listados de clientes y está disponible para ser seleccionada en órdenes de venta

Given una entidad está marcada como cliente y proveedor simultáneamente
When se genera una orden de compra o venta vinculada a la entidad
Then el sistema permite seleccionar la entidad considerando ambas clasificaciones correctamente
```

---

### 2.4 RF-004: Gestión de Productos y Servicios

**Feature**: Catálogo completo de productos con variantes y precios múltiples

**Escenario 1: Creación de producto con variantes**
```
Given un usuario con permisos de gestión de productos accede al catálogo
When crea un nuevo producto specifying nombre, código interno, categoría, unidad de medida, proveedor predeterminado y precio unitario
Then el sistema crea el producto base y permite agregar variantes como tallas, colores o presentaciones

Given un usuario crea variantes para un producto existente
When especifica los atributos y precios por variante
Then cada variante se almacena con su propio identificador único y puede administrarse independientemente en inventario
```

**Escenario 2: Gestión de precios en múltiples monedas**
```
Given un producto tiene precio definido en moneda local
When un administrador define un precio en moneda extranjera para el mismo producto
Then el sistema persiste ambos precios y permite consultar cuál precio aplica según la moneda de la transacción

Given se genera una orden de venta en moneda extranjera
When el sistema calcula el total
Then utiliza el precio definido en esa moneda específica
```

---

### 2.5 RF-005: Control de Inventario

**Feature**: Seguimiento exhaustivo de inventario con alertas automáticas

**Escenario 1: Registro de entrada de mercancía**
```
Given un usuario con permisos de gestión de inventario registra una entrada de mercancía
When ingresa: producto, cantidad recibida, fecha, motivo de movimiento y usuario responsable
Then el sistema actualiza las cantidades en inventario, registra el movimiento con todos los datos y muestra confirmación de entrada procesada

Given el stock actual del producto es 50 unidades y se registra una entrada de 100 unidades
When se completa el registro de entrada
Then el sistema muestra el nuevo stock de 150 unidades como cantidad actual
```

**Escenario 2: Alertas de stock mínimo**
```
Given un producto tiene configurado un stock mínimo de alerta de 20 unidades
When el stock disponible del producto cae por debajo de 20 unidades
Then el sistema genera una alerta automática visible en el dashboard del usuario y optionally envia notificación por correo electrónico al responsable de inventario

Given múltiples productos simultáneamente caen por debajo de sus umbrales de alerta
When se procesan los movimientos de inventario
Then el sistema genera una alerta por cada producto afectado y las presenta agrupadas en el panel de alertas
```

---

### 2.6 RF-006: Gestión de Órdenes de Compra

**Feature**: Ciclo completo de órdenes de compra con workflow de aprobación

**Escenario 1: Creación de orden de compra**
```
Given un usuario crea una nueva orden de compra
When selecciona proveedor, ingresa lista de productos con cantidades y precios unitarios, especifica condiciones de pago y fecha de entrega esperada
Then el sistema calcula subtotal, impuestos y total general automáticamente, asigna número de orden secuencial y establece estado inicial como pendiente de aprobación

Given el monto total de la orden excede el umbral configurado para aprobación automática
When se completa la creación de la orden
Then el sistema establece estado pendiente de aprobación y notifica a los aprobadores designados
```

**Escenario 2: Aprobación de orden de compra**
```
Given una orden de compra está en estado pendiente de aprobación
When el aprobador autorizado revisa y aprueba la orden
Then el sistema cambia el estado a aprobado, registra la aprobación con fecha y usuario, y permite proceder con la ejecución de la orden

Given una orden de compra es rechazada por el aprobador
When el aprobador selecciona rechazar y ingresa un motivo
Then el sistema cambia el estado a rechazado, notifica al creador de la orden y mantiene el registro histórico del rechazo
```

---

### 2.7 RF-007: Gestión de Órdenes de Venta

**Feature**: Ciclo completo desde cotización hasta facturación

**Escenario 1: Creación de orden de venta desde cotización**
```
Given un cliente ha aceptado una cotización existente
When el usuario convierte la cotización en pedido confirmado
Then el sistema crea una orden de venta con los datos de la cotización, actualiza el estado de la cotización a aceptada y genera la orden con estado confirmado

Given se crea una orden de venta con productos que tienen precio especial por cliente
When el sistema calcula los precios
Then aplica automáticamente los precios especiales configurados para ese cliente específico
```

**Escenario 2: Generación automática de guía de despacho**
```
Given una orden de venta cambia a estado confirmado
When el sistema procesa la orden
Then genera automáticamente una guía de despacho vinculada con los datos de envío del cliente y productos incluidos en la orden

Given el usuario consulta los documentos relacionados con una orden de venta
When solicita ver la información de la orden
Then el sistema muestra la cotización original, la orden de venta y la guía de despacho como documentos relacionados
```

---

### 2.8 RF-008: Facturación Electrónica

**Feature**: Generación de documentos fiscales conforme a normativas vigentes

**Escenario 1: Generación de factura electrónica**
```
Given una orden de venta está completada y lista para facturación
When el usuario solicita generar la factura electrónica
Then el sistema crea el documento con secuencia de numeración única, incluye datos completos del emisor y receptor, detalle de productos con valores individuales y totales, impuestos desglosados, valor total a pagar, forma de pago y código QR de verificación

Given el sistema intenta comunicarse con la autoridad tributaria para timbrar la factura
When la conexión es exitosa y el documento pasa validación
Then la factura obtiene el timbre fiscal y cambia a estado timbrada, lista para envío al cliente
```

**Escenario 2: Integración con servicios de autoridad tributaria**
```
Given el sistema está configurado con las credenciales del servicio de la autoridad tributaria
When se genera una factura que requiere timbrado
Then el sistema transmite el documento al servicio web de la autoridad, recibe el folio fiscal y lo asocia a la factura

Given la autoridad tributaria rechaza el documento por errores de validación
When el sistema recibe la respuesta de rechazo
Then muestra los errores específicos al usuario para corrección, mantiene la factura en estado pendiente y permite reintento después de corrección
```

---

### 2.9 RF-009: Gestión de Pagos y Cobranzas

**Feature**: Control completo de movimientos financieros

**Escenario 1: Registro de pago a factura**
```
Given existe una factura pendiente de pago con monto total de 10000
When se registra un pago parcial de 3000 para esa factura
Then el sistema registra el pago, reduce el saldo pendiente a 7000, mantiene la factura en estado parcialmente pagada y muestra el history completo de pagos aplicados

Given el mismo pago de 3000 se aplica también a otra factura pendiente
When se procesa el pago
Then el sistema distribuye el monto según las reglas configuradas, registra la aplicación en cada factura afectada y actualiza los saldos correspondientes
```

**Escenario 2: Alertas de vencimiento de facturas**
```
Given una factura tiene fecha de vencimiento en 5 días y permanece sin pagar
When se ejecuta el proceso de alertas
Then el sistema genera notificación de vencimiento próximo visible para el usuario responsable y optionally envia recordatorio por correo electrónico

Given una factura supera la fecha de vencimiento sin haberse pagado completamente
When se procesa el estado de cuentas
Then el sistema marca la factura como vencida y la incluye en el reporte de cartera vencida
```

---

### 2.10 RF-010: Reportes y Analíticas

**Feature**: Generación de reportes configurables en múltiples formatos

**Escenario 1: Generación de reporte de ventas**
```
Given un usuario solicita un reporte de ventas del último mes
When selecciona el tipo de reporte, período y formato de salida (PDF, Excel o CSV)
Then el sistema genera el reporte con los datos correspondientes, aplica los filtros seleccionados y permite descarga inmediata del archivo

Given un usuario guarda una configuración de reporte como favorita
When accede posteriormente a sus reportes favoritos
Then encuentra el reporte configurado disponible con un clic para ejecución inmediata
```

**Escenario 2: Programación de generación automática de reportes**
```
Given un usuario configura un reporte para envío automático semanal
When se reach la fecha y hora programadas
Then el sistema genera el reporte automáticamente, lo attached al correo electrónico configurado y lo envía a los destinatarios especificados sin intervención manual

Given el envío automático falla por error en el servidor de correo
When el proceso intenta enviar el reporte
Then el sistema registra el fallo, reintenta hasta 3 veces con intervalos de 1 hora y notifica al administrador si todos los intentos fallan
```

---

### 2.11 RF-011: Gestión de Proyectos

**Feature**: Planificación y seguimiento de proyectos con indicadores de progreso

**Escenario 1: Creación de proyecto con fases**
```
Given un usuario crea un nuevo proyecto
When ingresa nombre, descripción, cliente asociado, fechas de inicio y fin, presupuesto y recursos humanos involucrados
Then el sistema crea el proyecto con estado activo, permite definir fases o etapas, y muestra el cronograma visual del proyecto

Given un proyecto tiene fases definidas
When se completan actividades dentro de una fase
Then el sistema calcula automáticamente el porcentaje de progreso de esa fase y del proyecto total
```

**Escenario 2: Alertas de retraso en proyecto**
```
Given un proyecto tiene una fase con fecha de fin programada para mañana
When no se han completado las actividades programadas para esa fecha
Then el sistema genera alerta de retraso visible para el gerente de proyecto y stakeholders relacionados

Given el costo real acumulado de un proyecto excede el presupuesto asignado
When se procesa la actualización de costos
Then el sistema genera alerta de desvío presupuestal con comparison entre presupuesto y gasto real
```

---

### 2.12 RF-012: Gestión de Tareas y Asignaciones

**Feature**: Tablero Kanban para gestión visual de tareas

**Escenario 1: Creación y asignación de tarea**
```
Given un usuario crea una nueva tarea en el sistema
When ingresa título, descripción, prioridad, responsable, fecha límite y etiquetas
Then la tarea aparece en el tablero Kanban en la columna correspondiente al estado inicial y el responsable recibe notificación de la asignación

Given una tarea tiene fecha límite para mañana
When se aproxima la fecha de entrega sin que la tarea esté completada
Then el sistema genera notificación automática al responsable y a los superiores jerárquicos configurados
```

**Escenario 2: Cambio de estado de tarea en Kanban**
```
Given una tarea está en columna "En Progreso"
When el responsable arrastra la tarea a la columna "Completada"
Then el sistema registra la fecha y hora de completación, actualiza el estado y recalcula los indicadores de productividad del responsable

Given una tarea completada necesita corrección
When un supervisor la devuelve a la columna "En Progreso" con comentarios
Then la tarea aparece con el estado actualizado y el historial muestra la devolución para trazabilidad
```

---

### 2.13 RF-013: Sistema de Mensajería Interna

**Feature**: Comunicación entre usuarios con canales temáticos

**Escenario 1: Envío de mensaje individual**
```
Given un usuario redacta un mensaje para otro usuario específico
When incluye texto, archivos adjuntos opcionales y envía el mensaje
Then el destinatario recibe el mensaje inmediatamente, ve indicador de mensaje no leído y puede responder en la misma conversación

Given el sistema tiene límite de 10MB para archivos adjuntos
When un usuario intenta adjuntar un archivo de 15MB
Then el sistema muestra mensaje de error indicando que el archivo excede el tamaño máximo permitido
```

**Escenario 2: Canales temáticos por departamento**
```
Given un administrador crea un canal temático para el departamento de ventas
When los usuarios del departamento se suscriben al canal
Then reciben todos los mensajes publicados en ese canal y pueden participar en las discusiones

Given un mensaje se publica en un canal temático
When los usuarios consultan el centro de notificaciones
Then encuentran el mensaje con referencia al canal donde se publicó
```

---

### 2.14 RF-014: Gestión de Documentos

**Feature**: Almacenamiento y versionamiento de documentos digitales

**Escenario 1: Carga de documento con metadatos**
```
Given un usuario carga un documento en el sistema
When ingresa nombre, selecciona tipo de documento y confirma la carga
Then el sistema almacena el archivo, registra metadatos incluyendo fecha de carga, usuario que subió, tamaño y ubicación, y hace el documento searchable por nombre y tipo

Given el sistema tiene formatos permitidos: PDF, Word, Excel, imágenes y comprimidos
When un usuario intenta cargar un archivo en formato no permitido
Then el sistema muestra mensaje de error indicando los formatos válidos y no permite la carga
```

**Escenario 2: Búsqueda de documentos**
```
Given existen 100 documentos almacenados en el sistema
When un usuario busca por nombre parcial del documento
Then el sistema muestra todos los documentos que coinciden con el criterio de búsqueda ordenados por relevancia

Given un usuario busca documentos por rango de fechas
When especifica fecha inicial y fecha final
Then el sistema filtra y muestra solo los documentos cargados dentro del período especificado
```

---

### 2.15 RF-015: Integración de Correo Electrónico

**Feature**: Envío automatizado de comunicaciones por correo electrónico

**Escenario 1: Envío de notificación por correo**
```
Given el sistema tiene un evento que requiere notificación por correo
When se dispara el evento como nuevo mensaje interno o recordatorio de tarea
Then el sistema envía el correo electrónico utilizando la plantilla configurada, registra el envío en historial y marca la notificación como enviada por email

Given el servidor de correo no está disponible
When el sistema intenta enviar el correo
Then el sistema reintenta hasta 3 veces con intervalos de 5 minutos, y si todos los intentos fallan, marca el correo como fallido y lo incluye en la cola de reintento
```

**Escenario 2: Configuración de plantillas de correo**
```
Given un administrador crea una plantilla de correo para notificaciones de estado de orden
When la plantilla contiene variables como {{cliente_nombre}}, {{numero_orden}} y {{estado}}
Then el sistema reemplaza las variables con los valores reales al momento de enviar cada notificación
```

---

### 2.16 RF-016: Respaldo y Restauración de Datos

**Feature**: Respaldos automáticos programables con verificación de integridad

**Escenario 1: Ejecución de respaldo programado**
```
Given el sistema está configurado para realizar respaldos diarios a las 2:00 AM
When llega la hora programada
Then el sistema ejecuta el respaldo incluyendo base de datos completa y archivos adjuntos, almacena en ubicación segura separada del servidor principal, y registra el resultado exitoso con marca de tiempo

Given el respaldo se completa exitosamente
When se verifica la integridad de los datos respaldados
Then el sistema genera y almacena checksum de verificación para validar restauraciones futuras
```

**Escenario 2: Restauración desde respaldo**
```
Given un administrador solicita restaurar datos desde un respaldo específico
When selecciona el respaldo y confirma la restauración
Then el sistema detiene operaciones, restaura los datos desde el respaldo seleccionado, verifica integridad mediante checksum, y al completar muestra reporte de restauración exitosa

Given los datos del respaldo no pasan la verificación de integridad
When se intenta restaurar
Then el sistema muestra mensaje de error indicando corrupción del respaldo, no proceed con la restauración y notifica al administrador
```

---

### 2.17 RF-017: Auditoría de Operaciones

**Feature**: Log completo e inmutable de todas las operaciones

**Escenario 1: Registro de operación en log de auditoría**
```
Given un usuario realiza cualquier operación en el sistema como crear, modificar o eliminar un registro
When la operación se completa
Then el sistema registra en el log de auditoría: fecha y hora exactas, usuario responsable identificado, módulo afectado, tipo de operación realizada, datos antes y después del cambio, dirección IP de origen y resultado de la operación

Given un usuario con rol Administrador consulta los logs de auditoría
When accede al módulo de auditoría
Then puede ver el historial completo de todas las operaciones realizadas en el sistema ordenadas cronológicamente
```

**Escenario 2: Inmutabilidad de logs**
```
Given un registro existe en el log de auditoría
When cualquier usuario intenta modificar o eliminar ese registro
Then el sistema rechaza la operación y muestra mensaje de error indicando que los logs de auditoría no pueden ser modificados

Given un usuario con rol no administrador intenta acceder al módulo de auditoría
When consulta los logs
Then el sistema deniega el acceso y muestra mensaje de autorización requerida
```

---

### 2.18 RF-018: Exportación e Importación de Datos

**Feature**: Intercambio masivo de datos con validación exhaustiva

**Escenario 1: Importación de productos desde archivo CSV**
```
Given un usuario selecciona un archivo CSV para importar productos
When el sistema procesa el archivo
Then parsea los datos, valida cada registro contra las reglas de negocio, detecta duplicados potenciales, y genera reporte de importación mostrando registros exitosos, errores encontrados y advertencias

Given un registro del archivo tiene datos inválidos o incompletos
When el sistema procesa la importación
Then marca ese registro como error, continúa procesando los demás registros y al final muestra lista completa de errores para corrección
```

**Escenario 2: Exportación de datos maestros**
```
Given un usuario solicita exportar la lista de clientes
When selecciona el formato (CSV, Excel o JSON) y confirma la exportación
Then el sistema genera el archivo con todos los datos maestros de clientes, incluye todos los campos configurados y comienza la descarga automática

Given la exportación incluye más de 10000 registros
When se procesa la exportación
Then el sistema muestra indicador de progreso y permite al usuario continuar trabajando mientras se completa el proceso en segundo plano
```

---

### 2.19 RF-019: Configuración de Parámetros del Sistema

**Feature**: Parámetros globales editables sin reinicio del sistema

**Escenario 1: Modificación de parámetros**
```
Given un administrador accede a la configuración de parámetros del sistema
When modifica el nombre de la empresa, logo, datos fiscales o cualquier otro parámetro
Then el sistema guarda los cambios, los aplica inmediatamente a todas las funcionalidades sin necesidad de reiniciar y muestra confirmación de cambios aplicados

Given un administrador modifica la moneda predeterminada del sistema
When usuarios acceden a funciones de ventas o compras
Then ven los valores monetarios expresados en la nueva moneda configurada sin necesidad de reconectar
```

---

### 2.20 RF-020: Sistema de Notificaciones

**Feature**: Notificaciones emergentes configurables por canal y evento

**Escenario 1: Recepción de notificación**
```
Given ocurre un evento que genera notificación según la configuración del usuario
When el evento se registra en el sistema
Then el usuario recibe la notificación emergente en la aplicación, visible en el centro de notificaciones, y si está configurado, también por correo electrónico

Given el usuario tiene configurado recibir solo notificaciones por correo para vencimientos de documentos
When se genera una alerta de vencimiento
Then el sistema envía solo correo electrónico y no muestra notificación dentro de la aplicación
```

**Escenario 2: Centro de notificaciones histórico**
```
Given un usuario accede a su centro de notificaciones
When consulta el historial
Then ve todas las notificaciones recibidas organizadas por fecha, con opción de filtrar por tipo, módulo o estado de lectura

Given una notificación ha sido leída por el usuario
When consulta su historial
Then la notificación aparece marcada como leída con fecha y hora de cuando fue leída
```

---

### 2.21 RF-021: Búsqueda Avanzada

**Feature**: Motor de búsqueda global con filtros y sugerencias

**Escenario 1: Búsqueda con filtros**
```
Given un usuario escribe "factura" en la barra de búsqueda global
When presiona Enter o selecciona una sugerencia
Then el sistema muestra resultados de todas las facturas en el sistema ordenados por relevancia con opción de ordenar cronológicamente

Given el usuario aplica filtro por módulo "Finanzas" y estado "Pagada"
When ejecuta la búsqueda
Then el sistema muestra solo facturas pagadas del módulo de finanzas
```

**Escenario 2: Búsqueda predictiva**
```
Given el usuario escribe "prod" en la barra de búsqueda
When el sistema procesa los caracteres
Then muestra sugerencias automáticas como "productos", "proveedores", basándose en el historial de búsquedas y datos disponibles

Given el usuario acepta una sugerencia haciendo clic
When la selecciona
Then el sistema ejecuta la búsqueda completa con el término sugerido
```

---

### 2.22 RF-022: Dashboard Personalizable

**Feature**: Panel de inicio configurable con widgets a elección

**Escenario 1: Configuración de widgets**
```
Given un usuario accede a su dashboard personal
When arrastra un widget de "Gráfico de Ventas" a su área de trabajo
Then el widget aparece configurado con los datos más recientes de ventas y se posiciona donde fue soltado

Given un usuario reorganiza múltiples widgets en su dashboard
When guarda la configuración
Then el sistema persiste el layout personalizado y al siguiente acceso muestra los widgets en las posiciones guardadas
```

**Escenario 2: Widget de inventario bajo**
```
Given existe un producto con stock por debajo del mínimo configurado
When el usuario accede a su dashboard
Then el widget de inventario bajo muestra ese producto con la cantidad actual y mínimo configurado

Given no hay productos con stock bajo
When el widget se carga
Then muestra mensaje indicando que no hay alertas de inventario en este momento
```

---

### 2.23 RF-023: Control de Versiones de Documentos

**Feature**: Historial completo de cambios en documentos con comparación

**Escenario 1: Versionamiento automático**
```
Given un usuario abre y modifica un documento existente
When guarda los cambios
Then el sistema crea una nueva versión del documento, mantiene la versión anterior en el historial, y registra el autor y fecha de modificación

Given el usuario consulta el historial de versiones de un documento
When accede a la opción de versiones
Then ve la lista cronológica de todas las versiones con autor y fecha de cada una
```

**Escenario 2: Comparación de versiones**
```
Given un documento tiene versión actual y una versión anterior
When el usuario selecciona ambas versiones para comparar
Then el sistema muestra la comparación lado a lado highlighting los cambios realizados entre ambas versiones

Given el usuario decide restaurar una versión anterior
When confirma la restauración
Then el sistema crea una nueva versión con el contenido de la versión seleccionada, mantiene el historial completo de versiones y notifica sobre la restauración realizada
```

---

### 2.24 RF-024: Gestión de Calendarios

**Feature**: Calendario empresarial con eventos y sincronización externa

**Escenario 1: Creación de evento**
```
Given un usuario crea un nuevo evento en el calendario
When ingresa título, descripción, fecha y hora, ubicación, participantes y recordatorios configurados
Then el sistema crea el evento, lo muestra en el calendario en la fecha y hora indicados, y envía notificaciones a todos los participantes

Given un evento tiene recordatorio configurado para 30 minutos antes
When se reach el tiempo del recordatorio
Then el sistema envía notificación automática a todos los participantes del evento
```

**Escenario 2: Eventos recurrentes**
```
Given un usuario crea un evento que se repite semanalmente cada lunes a las 9:00
When guarda el evento recurrente
Then el sistema genera instancias del evento para las próximas 12 semanas, permite edición individual de instancias manteniendo la recurrencia base

Given el usuario modifica una instancia específica del evento recurrente
When guarda los cambios
Then el sistema actualiza solo esa instancia y marca que ha sido modificada respecto a la serie
```

---

### 2.25 RF-025: Workflows de Aprobación

**Feature**: Flujos de trabajo configurables para procesos de aprobación

**Escenario 1: Configuración de workflow**
```
Given un administrador configura un nuevo workflow de aprobación
When define nombre, descripción, pasos secuenciales, usuarios aprobadores por paso y condiciones de enrutamiento
Then el sistema crea el workflow y lo hace disponible para ser asociado a documentos o procesos que requieran aprobación

Given un workflow tiene umbral de monto mayor a 10000 que requiere 2 niveles de aprobación
When se genera un documento con monto de 15000
Then el documento pasa por los 2 niveles de aprobación secuenciales antes de ser aprobado
```

**Escenario 2: Tareas de aprobación en bandeja de entrada**
```
Given un documento requiere aprobación de un usuario específico
When el documento llega a su paso en el workflow
Then el usuario ve la tarea de aprobación pendiente en su bandeja de entrada con los detalles del documento

Given el aprobador aprueba el documento
When registra su aprobación
Then el sistema avanza el documento al siguiente paso del workflow o lo marca como aprobado completamente si era el último paso
```

---

### 2.26 RF-026: Gestión de Contratos

**Feature**: Almacenamiento y seguimiento de contratos con alertas de renovación

**Escenario 1: Creación de contrato**
```
Given un usuario crea un nuevo contrato en el sistema
When ingresa número de contrato, partes involucradas, objeto, monto total, plazos, cláusulas especiales y documentos adjuntos
Then el sistema almacena el contrato, lo vincula a las entidades comerciales relacionadas, y establece estado activo

Given un contrato tiene fecha de renovación en 30 días
When se ejecuta el proceso de alertas
Then el sistema genera notificación de renovación próxima visible para el responsable del contrato
```

**Escenario 2: Vencimiento de contrato**
```
Given un contrato supera su fecha de vencimiento sin renovación
When se procesa el estado de contratos
Then el sistema marca el contrato como vencido, genera alerta para revisión y puede vincularse automáticamente a órdenes relacionadas según configuración

Given se genera un reporte de contratos
When se consultan los filtros por estado
Then el sistema muestra contratos activos, próximos a vencer y vencidos agrupados por categoría
```

---

### 2.27 RF-027: Punto de Venta Minorista

**Feature**: Módulo POS para operaciones de retail con cierre de caja

**Escenario 1: Venta en punto de venta**
```
Given un cliente se acerca al punto de venta con productos para comprar
When el operador busca los productos por código de barras o nombre
Then el sistema muestra el producto con imagen, precio y disponibilidad, permite agregar al carrito de venta

Given el operador completa la venta con múltiples productos, descuentos y métodos de pago combinados
When el cliente confirma el pago
Then el sistema calcula totales con impuestos, procesa cada método de pago, emite ticket o factura, y registra la transacción en el inventario reduciendo stock
```

**Escenario 2: Operación de cierre de caja**
```
Given el operador solicita cerrar la caja al final del día
When confirma el cierre
Then el sistema muestra el resumen de ventas del período, totales por método de pago, diferencias entre efectivo esperado y registrado, y permite generar el reporte de cierre

Given existe diferencia entre el efectivo registrado y el esperado
When se completa el cierre de caja
Then el sistema registra la diferencia con motivo documentado y notifica al supervisor para revisión
```

---

### 2.28 RF-028: Análisis de Margen de Ganancias

**Feature**: Cálculo y visualización de márgenes por múltiples dimensiones

**Escenario 1: Análisis de margen por producto**
```
Given un usuario accede al módulo de análisis de márgenes
When consulta el margen del producto "Widget X"
Then el sistema muestra el precio de venta, costo del producto, margen absoluto y porcentaje de margen

Given el margen del producto cae por debajo del umbral mínimo configurado del 15%
When se genera el reporte
Then el sistema marca ese producto con alerta visual indicando margen bajo y sugiere revisión de precios
```

**Escenario 2: Comparación de márgenes por período**
```
Given un usuario selecciona comparación de márgenes del mes actual versus mes anterior
When ejecuta el análisis
Then el sistema muestra gráficos comparativos donde se visualiza la evolución del margen, identificando productos que mejoraron o empeoraron su rentabilidad
```

---

### 2.29 RF-029: Gestión de Proveedores

**Feature**: Directorio completo de proveedores con evaluaciones

**Escenario 1: Registro y evaluación de proveedor**
```
Given un usuario registra un nuevo proveedor con toda la información de contacto y productos que suministra
When guarda el registro
Then el sistema crea el proveedor con estado activo, permite registrar evaluaciones periódicas basadas en criterios configurables

Given se completa una evaluación de proveedor con criterios de calidad, precio y entrega
When se guarda la evaluación
Then el sistema calcula calificación general del proveedor y la muestra en el perfil del proveedor para decisiones de compra
```

---

### 2.30 RF-030: Control de Asistencia

**Feature**: Registro de entrada y salida con reportes de productividad

**Escenario 1: Registro de entrada mediante reloj biométrico**
```
Given un empleado registra su entrada mediante reloj biométrico
When el sistema valida la huella dactilar o reconocimiento facial
Then registra la hora de entrada, actualiza el estado del empleado a presente, y almacena el registro con fecha y hora exacta

Given un empleado tiene configurado horario de 9:00 a 18:00
When llega a las 9:15
Then el sistema registra la entrada a las 9:15 y marca como tardanza de 15 minutos en el reporte de asistencia
```

**Escenario 2: Reporte de asistencia por período**
```
Given un administrador solicita reporte de asistencia del departamento de ventas del mes actual
When se genera el reporte
Then muestra por cada empleado: días trabajados, tardanzas, ausencias, horas extra y comparación con horário programado

Given se calculan las horas extras de un empleado
When el empleado tiene horas trabajadas más allá de su horario
Then el sistema calcula el tiempo extra según las reglas configuradas y lo incluye en la integración con nómina
```

---

### 2.31 RF-031: Manejo de Monedas y Tipos de Cambio

**Feature**: Operaciones multilínea con conversión automática

**Escenario 1: Actualización de tipo de cambio**
```
Given el administrador actualiza manualmente el tipo de cambio EUR/USD a 1.0850
When guarda la actualización
Then el sistema aplica el nuevo tipo de cambio a todas las operaciones nuevas y muestra confirmación del cambio realizado

Given el sistema está configurado para actualizar tipos de cambio automáticamente desde fuente externa
When se sincroniza con el servicio externo
Then el sistema actualiza los tipos de cambio automáticamente y registra la fecha y hora de la última sincronización
```

**Escenario 2: Conversión en operaciones**
```
Given una orden de compra está en EUR y la moneda base de la empresa es USD
When se procesa la orden
Then el sistema registra el monto original en EUR y su equivalente en USD según el tipo de cambio vigente, mostrando ambos valores en la documentación

Given se genera un reporte financiero consolidado
When el usuario selecciona presentación en moneda EUR
Then el sistema convierte todos los montos a EUR utilizando los tipos de cambio registrados en cada transacción
```

---

### 2.32 RF-032: Programación de Tareas Automatizadas

**Feature**: Scheduler para tareas automáticas programables

**Escenario 1: Creación de tarea programada**
```
Given un administrador crea una tarea programada para generación de reporte semanal de ventas
When configura la frecuencia (todos los lunes a las 8:00), selecciona el reporte a generar y define destinatarios
Then el sistema programa la tarea y la ejecuta automáticamente según el horario configurado sin intervención manual

Given la tarea programada falla por error en el sistema
When se intenta ejecutar
Then el sistema registra el fallo, notifica al administrador y reintenta según la configuración de reintentos establecida
```

**Escenario 2: Pausa y eliminación de tareas**
```
Given una tarea programada está en ejecución
When el administrador decide pausarla temporalmente
Then el sistema detiene la tarea, mantiene la configuración para posible reactivación y no la ejecuta hasta que se reanude

Given el administrador elimina una tarea programada
When confirma la eliminación
Then el sistema elimina la tarea y su programación, pero mantiene el historial de ejecuciones anteriores
```

---

### 2.33 RF-033: Gestión de Almacenes

**Feature**: Múltiples ubicaciones de inventario con transferencias

**Escenario 1: Creación de almacén**
```
Given un administrador crea un nuevo almacén
When ingresa nombre, dirección, responsable asignado y capacidad máxima
Then el sistema crea el almacén, lo hace disponible para movimientos de inventario y permite consultar stock específico por ubicación

Given se intenta crear un movimiento de transferencia entre almacenes
When se selecciona origen, destino, productos y cantidades
Then el sistema valida disponibilidad de stock en almacén origen antes de aprobar la transferencia
```

**Escenario 2: Transferencia entre almacenes**
```
Given existe stock suficiente en almacén principal para transferir 50 unidades del producto A
When se crea y autoriza la transferencia al almacén secundario
Then el sistema reduce el stock en almacén principal, aumenta el stock en almacén secundario, y registra el movimiento de transferencia con fecha, usuarios involucrados y autorización

Given la transferencia es rechazada por falta de stock en origen
When se procesa la solicitud
Then el sistema muestra mensaje de error indicando stock insuficiente y sugiere cantidad máxima transferible
```

---

### 2.34 RF-034: Segmentación de Clientes

**Feature**: Clasificación de clientes en segmentos configurables

**Escenario 1: Creación de segmento**
```
Given un administrador define un nuevo segmento llamado "Clientes Premium"
When configura los criterios: volumen de compras mayor a 100000 y antigüedad mayor a 2 años
Then el sistema identifica todos los clientes que cumplen los criterios y los incluye en el segmento

Given un cliente clasificado como Premium reduce sus compras a menos de 100000
When se reevalúan los segmentos periódicamente
Then el sistema reclasifica al cliente fuera del segmento Premium y actualiza el conteo de miembros del segmento
```

**Escenario 2: Campaña dirigida a segmento**
```
Given un segmento tiene 50 clientes que cumplen los criterios definidos
When se crea una campaña de marketing dirigida a ese segmento
Then el sistema identifica los 50 clientes miembros, permite crear comunicación personalizada y registra el envío de la campaña

Given se ejecuta una campaña de correo masivo a un segmento
When el sistema procesa los envíos
Then genera reporte de cantidad de correos enviados, abiertos y con errores de entrega
```

---

### 2.35 RF-035: Importación de Catálogos de Productos

**Feature**: Importación masiva desde archivos estructurados

**Escenario 1: Importación con mapeo de columnas**
```
Given un usuario selecciona un archivo Excel con 500 productos para importar
When el sistema muestra la interfaz de mapeo de columnas
Then el usuario puede asignar columnas del archivo a campos del sistema como código, nombre, precio, categoría

Given la importación comienza
When se procesa cada registro
Then el sistema muestra progreso en tiempo real, detecta duplicados potenciales y genera log detallado del proceso
```

**Escenario 2: Detección de duplicados**
```
Given el archivo de importación contiene 3 productos con código ya existente en el sistema
When se ejecuta la importación
Then el sistema marca esos 3 productos como duplicados pendientes de resolución, permite al usuario elegir sobrescribir, mantener ambos o cancelar la importación de esos items

Given el usuario elige sobrescribir los duplicados
When confirma la decisión
Then el sistema actualiza los productos existentes con los nuevos datos y completa la importación
```

---

### 2.36 RF-036: Solicitudes de Compra Internas

**Feature**: Workflow de solicitudes previo a órdenes formales

**Escenario 1: Creación de solicitud de compra**
```
Given un empleado necesita adquirir productos para su departamento
When crea una solicitud especificando producto, cantidad justificada y centro de costo destino
Then la solicitud entra en estado pendiente de aprobación según las reglas configuradas por monto

Given el monto de la solicitud es menor a 1000 y el departamento tiene aprobación automática configurada
When se crea la solicitud
Then pasa directamente a estado aprobada y puede convertirse en orden de compra automáticamente

Given el monto supera el umbral de aprobación automática
When se crea la solicitud
Then el sistema notifica a los aprobadores designados y la solicitud permanece pendiente hasta aprobación
```

---

### 2.37 RF-037: Devoluciones y Reclamaciones

**Feature**: Proceso completo de devoluciones con seguimiento

**Escenario 1: Registro de devolución de cliente**
```
Given un cliente devuelve productos por defectos de calidad
When el operador registra la devolución con motivo, productos, cantidades y estado del producto recibido
Then el sistema crea el registro de devolución, permite aplicar resolución como reembolso, crédito o reemplazo

Given la devolución está vinculada a una orden de venta original
When se procesa la resolución
Then el sistema actualiza el inventario con los productos devueltos según el estado recibido y genera la nota de crédito correspondiente si aplica
```

**Escenario 2: Reporte de causas de devoluciones**
```
Given existen 50 devoluciones registradas en el sistema
When se genera el reporte de causas comunes
Then el sistema agrupa las devoluciones por motivo como "defecto de fabricación", "daño en transporte", "producto incorrecto" y muestra el porcentaje y cantidad de cada causa
```

---

### 2.38 RF-038: Cotizaciones a Clientes

**Feature**: Creación y seguimiento de cotizaciones comerciales

**Escenario 1: Creación de cotización**
```
Given un usuario crea una cotización para un cliente potencial
When ingresa datos del cliente, lista de productos o servicios con precios, validez de la cotización, condiciones generales y notas
Then el sistema genera la cotización con número secuencial, calcula totales con impuestos y muestra el documento listo para enviar

Given la cotización tiene validez de 15 días
When se consulta el estado de la cotización después de 10 días
Then muestra días restantes de validez y estado como "Enviada" o "Consultada" según interacción del cliente

Given un cliente acepta la cotización
When el usuario convierte la cotización en pedido
Then el sistema crea la orden de venta, marca la cotización como aceptada y vincula ambas transacciones
```

---

### 2.39 RF-039: Tableros de Mando Ejecutivos

**Feature**: Dashboards ejecutivos con métricas clave de negocio

**Escenario 1: Visualización de métricas principales**
```
Given un ejecutivo accede al tablero de mando
When se carga la interfaz
Then ve widgets con: ventas del período actual, comparación con período anterior en porcentaje, productos más vendidos, clientes top por volumen

Given no hay datos para un widget específico
When se carga el tablero
Then el widget muestra mensaje de "Sin datos disponibles para el período seleccionado" en lugar de errores

Given el ejecutivo comparte un tablero mediante enlace seguro
When el destinatario accede al enlace
Then ve el tablero en modo solo lectura sin poder modificar la configuración
```

---

### 2.40 RF-040: Historial de Cambios de Precios

**Feature**: Registro completo de historial de precios

**Escenario 1: Registro de cambio de precio**
```
Given un administrador modifica el precio de venta de un producto de 100 a 115
When guarda el cambio
Then el sistema registra en el historial: fecha del cambio, precio anterior (100), nuevo precio (115), usuario que realizó el cambio y motivo registrado

Given un usuario consulta el precio vigente de un producto en una fecha pasada hace 3 meses
When solicita consultar precio histórico
Then el sistema muestra el precio que estaba vigente en esa fecha específica según el registro de historial
```

**Escenario 2: Reporte de ventas con precio aplicado**
```
Given se genera un reporte de ventas del último trimestre
When incluye el detalle de transacciones
Then muestra para cada venta el precio que fue aplicado en el momento de la transacción, permitiendo verificar si se aplicaron descuentos o cambios de precio
```

---

### 2.41 RF-041: Control de Calidad

**Feature**: Registro de inspecciones y criterios de aceptación

**Escenario 1: Registro de inspección de calidad**
```
Given se define un criterio de inspección para recepción de materia prima con rango de aceptación de 95% a 100% de calidad
When se ejecuta la inspección con resultado de 92%
Then el sistema marca la inspección como rechazada, genera alerta para revisión, y no permite la aceptación del lote

Given los resultados de inspección muestran tendencia a bajar del umbral
When se procesan los datos de múltiples inspecciones
Then el sistema genera alerta de tendencia indicando posible problema de calidad en el proveedor o proceso
```

---

### 2.42 RF-042: Movilidad y Acceso desde Dispositivos Móviles

**Feature**: Interfaz responsive para tablets y smartphones

**Escenario 1: Acceso desde móvil a inventario**
```
Given un usuario accede desde un teléfono inteligente a la aplicación
When consulta el inventario de un producto
Then la interfaz se adapta a la pantalla pequeña, muestra la información de stock de forma clara y permite navegación táctil intuitiva

Given el usuario intenta crear una orden de venta desde el móvil
When completa el formulario y envía
Then el sistema procesa la orden correctamente y muestra confirmación, con toda la funcionalidad disponible que existe en la versión de escritorio

Given el usuario recibe una notificación push en el móvil
When toca la notificación
Then abre la aplicación directamente en el contexto relevante de la notificación
```

---

### 2.43 RF-043: Límites de Crédito por Cliente

**Feature**: Control de crédito con bloqueo automático de pedidos

**Escenario 1: Verificación de crédito al crear pedido**
```
Given un cliente tiene límite de crédito configurado de 50000 y saldo disponible de 30000
When se intenta crear un nuevo pedido por valor de 35000
Then el sistema muestra mensaje de error indicando que el crédito disponible es insuficiente y bloquea la creación del pedido

Given el cliente tiene saldo disponible de 40000 y el nuevo pedido es por 25000
When se crea el pedido
Then el sistema permite la creación, reduce el crédito disponible a 15000 después de confirmar el pedido, y muestra el nuevo saldo disponible
```

**Escenario 2: Liberación de crédito por pago**
```
Given un cliente tiene crédito disponible de 10000 y realiza un pago de 5000
When se registra el pago en el sistema
Then el crédito disponible aumenta automáticamente a 15000 y se actualiza el estado de la cuenta del cliente
```

---

### 2.44 RF-044: Interfaz Programable API REST

**Feature**: API RESTful documentada para integración externa

**Escenario 1: Autenticación via API**
```
Given una aplicación externa necesita acceder a la API del sistema
When solicita token de acceso con credenciales de API key o OAuth2
Then el sistema valida las credenciales, genera token de acceso con permisos específicos y lo devuelve en formato JSON

Given una solicitud a la API incluye el token de acceso válido
When el endpoint solicitado es /api/v1/products
Then el sistema devuelve la lista de productos en formato JSON estructurado con los campos definidos en la documentación
```

**Escenario 2: Versionado de API**
```
Given existe la versión 1 de la API (/api/v1/) y se libera la versión 2 (/api/v2/)
When una aplicación consume la API v1
Then sigue funcionando con soporte de backward compatibility mientras la nueva aplicación usa la v2

Given se deprecia una versión de la API
When aplicaciones la siguen utilizando después del período de gracia
Then reciben respuestas indicando que la versión será descontinuada pronto, con header indicando la fecha de sunset
```

---

### 2.45 RF-045: Localización e Idiomas

**Feature**: Interfaz multiidioma con formatos regionales

**Escenario 1: Cambio de idioma**
```
Given un usuario accede a la configuración de preferencias
When selecciona el idioma inglés (en) en lugar de español (es)
Then toda la interfaz del sistema se actualiza al inglés, incluyendo menús, labels, mensajes y formatos de fecha y número

Given todos los textos de la interfaz están almacenados en archivos externos de traducción
When se actualiza un archivo de traducción
Then los cambios se aplican sin necesidad de modificar código fuente o reiniciar el sistema
```

**Escenario 2: Formato regional de fechas y números**
```
Given un usuario tiene configurado el locale como español (es-MX)
When visualiza una fecha en el sistema
Then se muestra en formato DD/MM/YYYY y los números con separador de miles (,) y decimal (.)

Given el usuario cambia a locale inglés (en-US)
When visualiza la misma información
Then la fecha se muestra en formato MM/DD/YYYY y los números con separador de miles (.) y decimal (,)
```

---

### 2.46 RF-046: Registro de Llamadas Telefónicas

**Feature**: Módulo de registro y clasificación de llamadas

**Escenario 1: Registro de llamada entrante**
```
Given un agente recibe una llamada telefónica de un cliente
When registra la llamada en el sistema con fecha, hora, número, contacto asociado, duración y clasificación (soporte técnico, ventas, cobranza, administrativa)
Then el sistema almacena el registro y permite generar reportes de productividad por agente y tipo de llamada

Given se consultan las estadísticas de llamadas del mes
When se genera el reporte
Then muestra total de llamadas por tipo, duración promedio, llamadas por agente y tendencias comparadas con meses anteriores
```

---

### 2.47 RF-047: Encuestas de Satisfacción

**Feature**: Creación y envío de encuestas con análisis de resultados

**Escenario 1: Creación de encuesta**
```
Given un administrador crea una encuesta de satisfacción con preguntas de selección múltiple, escala y texto libre
When configura las preguntas y guarda la encuesta
Then la encuesta está lista para ser enviada a clientes

Given se programa el envío automático de encuesta 2 días después de la entrega de un pedido
When se completa la entrega del pedido
Then el sistema envía automáticamente la encuesta al cliente según la programación configurada
```

**Escenario 2: Visualización de resultados**
```
Given existen 100 respuestas de encuestas acumuladas
When el administrador consulta los resultados
Then ve la distribución de respuestas por pregunta, promedio de satisfacción general, y tendencias comparadas con períodos anteriores

Given las respuestas muestran una tendencia a la baja en satisfaction
When se detectan 3 meses consecutivos de decrease
Then el sistema genera alerta sugiriendo revisión de procesos o contacto con clientes insatisfechos
```

---

### 2.48 RF-048: Manejo de Lotes y Series

**Feature**: Trazabilidad completa por lote o número de serie

**Escenario 1: Recepción de producto por lote**
```
Given se recibe mercancía con número de lote ABC123 que contiene 100 unidades del producto X
When se registra la entrada de mercancía
Then el sistema almacena el lote con su número, fecha de recepción, y las 100 unidades asociadas a ese lote

Given un producto tiene fecha de caducidad próxima en 30 días
When se procesa la alertas de inventario
Then el sistema genera alerta de producto próximo a vencer indicando el lote afectado y la fecha de caducidad
```

**Escenario 2: Trazabilidad de lote**
```
Given un cliente reporta defecto en un producto específico
When se consulta la trazabilidad del producto por número de serie
Then el sistema muestra el historial completo: fecha de fabricación, lote, fecha de recepción, orden de venta asociada, y fecha de entrega al cliente

Given se necesita hacer recall de productos del lote ABC123
When se identifica el lote afectado
Then el sistema permite localizar todos los productos de ese lote en inventario y en órdenes ya entregadas para tomar acción correctiva
```

---

### 2.49 RF-049: Gestión de Activos Fijos

**Feature**: Registro y control de activos con depreciación

**Escenario 1: Alta de activo fijo**
```
Given un administrador registra un nuevo activo fijo con descripción "Equipo de cómputo Dell", categoría "Tecnología", ubicación "Oficina Principal", proveedor "Dell SA", fecha de adquisición 01/01/2024, costo original 25000 y vida útil de 4 años
When guarda el registro
Then el sistema calcula la depreciación mensual automática, muestra el valor en libros actual y genera reportes de valorización

Given se consulta el reporte de depreciación del mes
When se genera el reporte
Then muestra el monto de depreciación del período, depreciación acumulada y valor residual del activo
```

**Escenario 2: Baja de activo**
```
Given un activo fijo se da de baja por obsolescencia
When el administrador registra la baja con motivo y documentación de soporte
Then el sistema marca el activo como dado de baja, deja constancia del motivo y fecha de baja, y ya no lo incluye en cálculos de depreciación futuros
```

---

### 2.50 RF-050: Portal de Clientes

**Feature**: Portal web para consulta de información por clientes

**Escenario 1: Acceso y consulta de pedidos**
```
Given un cliente accede al portal con sus credenciales independientes
When consulta la sección de pedidos
Then ve el historial completo de pedidos realizados, estado actual de cada pedido, y puede hacer seguimiento de envíos

Given el cliente necesita descargar una factura
When selecciona la factura de la lista
Then el sistema permite descargar el comprobante electrónico en formato PDF
```

**Escenario 2: Solicitud de devolución**
```
Given un cliente quiere iniciar una devolución de un producto recibido
When accede a la sección de pedidos, selecciona uno específico y elige "Solicitar devolución"
Then el sistema presenta el formulario de devolución, el cliente ingresa motivo y productos a devolver, y al enviarse genera la solicitud en el sistema interno para procesamiento

Given el cliente consulta el estado de su solicitud de devolución
When accede al portal
Then ve el estado actual: pendiente, en proceso, resuelta, y el detalle de la resolución aplicada
```

---

### 2.51 RF-051: Portal de Proveedores

**Feature**: Portal para gestión de relación con proveedores

**Escenario 1: Consulta de órdenes de compra**
```
Given un proveedor accede a su portal con credenciales independientes
When consulta la sección de órdenes de compra pendientes
Then ve el listado de órdenes pendientes de atención, puede confirmar recepción de órdenes y actualizar estado de entregas

Given un proveedor confirma la recepción de una orden de compra
When guarda la confirmación
Then el sistema actualiza el estado de la orden a confirmada por proveedor y notifica al comprador interno
```

**Escenario 2: Presentación de facturas electrónicas**
```
Given un proveedor presenta una factura electrónica a través del portal
When adjunta la factura y datos relacionados
Then el sistema procesa la recepción, la vincula con la orden de compra correspondiente si existe, y la incluye en el flujo de aprobación de facturas del área de compras

Given el proveedor consulta el estado de sus facturas
When accede a la sección de facturas
Then ve el estado de cada factura: pendiente de verificación, aprobada, pagada, rechazada
```

---

### 2.52 RF-052: Replicación de Datos en Tiempo Real

**Feature**: Sincronización entre servidores para alta disponibilidad

**Escenario 1: Configuración de replicación**
```
Given el administrador configura replicación para el módulo de inventario con frecuencia de sincronización cada 5 minutos
When se activa la replicación
Then el sistema comienza a sincronizar datos del módulo de inventario al servidor secundario según la frecuencia configurada

Given ocurre un fallo en el servidor principal
When se activa el procedimiento de failover
Then el sistema conmuta automáticamente al servidor secundario, los usuarios se reconectan al servidor备用 y continúan trabajando con datos sincronizados hasta el último momento
```

**Escenario 2: Verificación de integridad**
```
Given se completa una sincronización entre servidores
When el sistema verifica la integridad de los datos replicados
Then utiliza checksums para confirmar que los datos en el servidor secundario coinciden exactamente con el principal y genera log de verificación
```

---

### 2.53 RF-053: Integración con Pasarelas de Pago

**Feature**: Procesamiento de pagos con tarjetas de forma segura

**Escenario 1: Procesamiento de pago con tarjeta**
```
Given un cliente realiza una compra y selecciona pago con tarjeta de crédito
When el operador ingresa los datos de la tarjeta en el terminal de pago integrado
Then el sistema transmite la transacción a la pasarela de pago configurada, recibe confirmación o rechazo, y registra el resultado en la transacción de venta

Given la transacción es aprobada por la pasarela de pago
When se completa la venta
Then el sistema marca la transacción como pagada, reduce el inventario de los productos vendidos, y emite comprobante al cliente
```

**Escenario 2: Cumplimiento PCI-DSS**
```
Given el sistema procesa pagos con tarjetas
When almacena o transmite datos de tarjetas
Then aplica cifrado conforme a los requisitos PCI-DSS, nunca almacena el CVV de la tarjeta, y los datos sensibles se manejan mediante tokenización

Given se genera un reporte de transacciones por período
When se consultan las transacciones
Then muestra el monto total procesadom, transacciones aprobadas versus rechazadas, y Conciliación con movimientos bancarios
```

---

### 2.54 RF-054: Gestión de Embargos y Garantías

**Feature**: Registro y aplicación automática de embargos judiciales

**Escenario 1: Registro de embargo judicial**
```
Given llega una orden de embargo judicial sobre cuentas por cobrar de un cliente específico
When el administrador registra el embargo con número de expediente, tribunal, monto embargado y estado del proceso
Then el sistema marca al cliente como embargado y configura las reglas de aplicación automática de pagos

Given el cliente embargado recibe un pago de 10000
When se procesa el pago
Then el sistema aplica automáticamente según las reglas configuradas para embargos, respetando el monto embargado y generando los registros correspondientes
```

**Escenario 2: Reporte de estado de embargos**
```
Given existen múltiples embargos activos en el sistema
When se genera el reporte de estado de embargos
Then muestra la lista de embargos con datos del cliente, expediente, monto original, monto aplicado, saldo pendiente y estado del proceso
```

---

### 2.55 RF-055: Alertas de Pago a Proveedores

**Feature**: Notificaciones sobre obligaciones pendientes de pago

**Escenario 1: Generación de alerta de pago próximo**
```
Given existe una obligación de pago a proveedor con fecha de vencimiento en 5 días
When se ejecuta el proceso de alertas
Then el sistema genera alerta visible en el dashboard de usuarios responsables y envía correo electrónico notificando sobre el pago próximo a vencer

Given un usuario consulta el resumen de obligaciones pendientes
When accede al módulo de pagos
Then ve las obligaciones clasificadas por proveedor, fecha de vencimiento y monto, con indicadores visuales de urgencia
```

---

### 2.56 RF-056: Secuencia de Numeración Configurable

**Feature**: Configuración flexible de series numéricas documentales

**Escenario 1: Configuración de secuencia**
```
Given el administrador configura una nueva secuencia para facturas con prefijo "FAC-", rango del 0001 al 9999 y longitud de 4 dígitos
When se genera una nueva factura
Then el sistema le asigna el número FAC-0001, FAC-0002, etc., validando que no se generen números duplicados

Given la secuencia alcanza el límite superior del rango configurado
When se intenta generar un nuevo documento
Then el sistema muestra mensaje de alerta indicando agotamiento de la secuencia y requiere configuración de nueva serie o extensión del rango
```

**Escenario 2: Series por sucursal**
```
Given la empresa tiene 2 sucursales y cada una necesita su propia numeración de facturas
When se configura la secuencia por sucursal
Then la sucursal A usa serie "FAC-A-0001" y la sucursal B usa serie "FAC-B-0001", manteniendo numeración independiente

Given se genera una factura en la sucursal A
When se consulta el número de factura
Then muestra la numeración completa con prefijo de la sucursal, permitiendo identificar el punto de emisión de cada documento
```

---

### 2.57 RF-057: Detección de Fraude

**Feature**: Identificación de patrones sospechosos en transacciones

**Escenario 1: Detección de velocidad de compra anómala**
```
Given un cliente normalmente realiza 2 compras por mes
When el sistema detecta que ese cliente ha realizado 8 compras en las últimas 2 horas
Then marca las transacciones como sospechosas, las deja pendientes de revisión manual y notifica al equipo de prevención de fraude

Given una transacción tiene monto superior a 50000 cuando el promedio del cliente es 5000
When se evalúa la transacción
Then el sistema marca la transacción como sospechosa por monto atípicamente alto y la deja pendiente de revisión
```

**Escenario 2: Revisión manual de transacciones**
```
Given una transacción ha sido marcada como sospechosa
When el analista de fraude revisa los detalles
Then ve el historial del cliente, patrones de compra normales, y puede aprobar, rechazar o solicitar información adicional

Given se aprueba una transacción marcada como sospechosa
When se procesa
Then el sistema aprende del patrón y reduce la severidad de alertas similares futuras mediante el modelo de aprendizaje automático
```

---

### 2.58 RF-058: Consolidación de Facturas

**Feature**: Agrupación de múltiples facturas en documento de pago único

**Escenario 1: Consolidación de facturas de un cliente**
```
Given un cliente tiene 3 facturas pendientes por totales de 5000, 3000 y 2000
When se selecciona la opción de consolidar facturas
Then el sistema genera un documento resumen con las 3 facturas detalladas, mostrando el total consolidado de 10000

Given se genera el documento de pago consolidado
When se consulta el detalle
Then muestra la información de cada factura individual incluyendo número, fecha, monto y condiciones de pago originales mantenidas

Given las facturas originales se actualizan durante la consolidación
When se genera el documento consolidado
Then el sistema marca las facturas originales como pagadas parcialmente según corresponda y mantiene trazabilidad completa
```

---

### 2.59 RF-059: Análisis de Tendencias de Compra

**Feature**: Identificación de patrones de compra para predicción y retención

**Escenario 1: Detección de cambio en patrón de compra**
```
Given el sistema analiza el historial de compras de un cliente que históricamente compraba 10000 mensuales
When detecta que los últimos 3 meses el cliente solo ha comprado 2000 mensuales
Then genera alerta de posible pérdida de cliente indicando la reducción del 80% en volumen de compras

Given se identifica un cliente con tendencia descendente de compras
When se genera el reporte de análisis
Then el sistema sugiere acciones de retención como contactar al cliente, ofrecer descuentos especiales o revisar la calidad del servicio
```

**Escenario 2: Visualización de tendencias**
```
Given el departamento de marketing solicita análisis de tendencias de compra del último año
When se genera el reporte
Then muestra gráficos comparativos por mes, identificación de productos con mayor crescimento y decremento, y predicciones de demanda basadas en patrones históricos
```

---

### 2.60 RF-060: Sincronización con Dispositivos IoT

**Feature**: Comunicación con sensores y dispositivos del IoT

**Escenario 1: Recepción de datos de sensor de temperatura**
```
Given un sensor de temperatura en el almacén reporta lectura de 28°C
When el sistema recibe los datos con marca de tiempo
Then almacena la lectura, la muestra en el dashboard de monitoreo, y si el umbral máximo configurado es 25°C, genera alerta de temperatura fuera de rango

Given se consultan los datos históricos de temperatura del almacén
When se genera el reporte de las últimas 24 horas
Then el sistema muestra gráfico de evolución de temperatura con marcas de cuando se excedieron los umbrales configurados
```

**Escenario 2: Alertas por lecturas fuera de rango**
```
Given múltiples sensores reportan simultáneamente lecturas fuera de los rangos seguros
When el sistema procesa los datos
Then genera alertas para cada sensor afectado, permite identificar Quickly cuál ubicación requiere atención inmediata y mantiene log completo para análisis posterior

Given los datos de un sensor muestran tendencia progresiva de aumento de temperatura
When se procesa el análisis
Then el sistema puede generar alerta predictiva indicando potencial falla de equipment de refrigeración antes de que se alcance el umbral crítico
```

---

## 3. Anexos

### 3.1 Glosario de Términos BDD

| Término | Definición |
|---------|-----------|
| Given | Condiciones previas o contexto inicial del escenario |
| When | Acción o evento que dispara el comportamiento bajo prueba |
| Then | Resultado esperado que debe verificarse |
| Feature | Funcionalidad específica del sistema descrita desde perspectiva de negocio |
| Scenario | Ejemplo concreto que ilustra una regla de negocio |

### 3.2 Referencia de Etiquetas de Prueba

| Etiqueta | Descripción |
|----------|-------------|
| @autenticación | Escenarios relacionados con RF-001 |
| @autorización | Escenarios relacionados con RF-002 |
| @inventario | Escenarios relacionados con RF-005 |
| @facturación | Escenarios relacionados con RF-008 |
| @integración | Escenarios de pruebas end-to-end cruzando múltiples módulos |

---

**Documento preparado para el proyecto Spottruck - Sistema de Gestión Empresarial**
**Fecha de creación**: 2026-06-03
**Última actualización**: 2026-06-03
**Total de escenarios Given/When/Then**: 180+ (3-5 escenarios por cada uno de los 60 requisitos funcionales)