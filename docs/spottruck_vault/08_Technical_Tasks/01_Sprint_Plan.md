---
title: "01_Sprint_Plan"
description: "Plan de Sprints para Spottruck - Estructura de 6 sprints con objetivos, entregables y timeline"
date: 2026-06-04
type: technical文档
category: sprint_planning
version: 1.0
status: approved
authors:
  - Project Team
tags:
  - sprint
  - planning
  - roadmap
  - milestones
  - timeline
related_documents:
  - 02_Task_Details.md
  - 03_Feature_Mapping.md
  - 04_Acceptance_Criteria.md
---

# Plan de Sprints — Spottruck

## 1. Introducción y Visión General

Este documento establece el plan de sprints para el desarrollo de Spottruck, una plataforma integral de gestión de flotas de transporte pesado. El plan contempla seis ciclos de desarrollo iterativos de cuatro semanas cada uno, totalizando veinticuatro semanas hasta el lanzamiento oficial de la versión uno punto cero del sistema. Cada sprint está diseñado para entregar valor measurable al negocio, permitiendo validaciones tempranas con stakeholders y ajustes de dirección basados en feedback real de usuarios.

La filosofía detrás de esta planificación es entregar un producto mínimo viable en el Sprint 3 que permita a usuarios selectos comenzar a operar con las funcionalidades core, mientras se continúa desarrollando el resto de la plataforma en sprints subsiguientes. Esta aproximación reduce el riesgo de construir un sistema completo que no satisfaga las necesidades reales del mercado, y permite generar revenue tempranamente para autofinanciar las fases finales de desarrollo.

El equipo de desarrollo está compuesto por ocho personas: un tech lead, dos senior developers, dos mid-level developers, un QA engineer, un devops engineer, y un product owner dedicado. La capacidad del equipo se estima en aproximadamente cuarenta story points por sprint en condiciones normales, con capacidad para absorber hasta cincuenta puntos en sprints donde sea necesario recuperar terreno perdido. Se asume una velocidad promedio de treinta y cinco story points para efectos de planificación inicial, ajustando según datos reales de las primeras iteraciones.

---

## 2. Estructura de Sprints

### 2.1 Sprint 1: Fundamentos Core y Sistema de Autenticación

**Duración:** 4 semanas (Junio 30 — Julio 27, 2026)  
**Capacidad estimada:** 35 story points  
**Focus principal:** Establecer las bases técnicas del proyecto y el sistema de autenticación robusto

**Objetivo del Sprint:**  
Este sprint tiene como meta establecer la infraestructura técnica fundamental sobre la cual se construirá todo el sistema Spottruck. El objetivo principal es crear una arquitectura de microservicios funcional con API Gateway, implementar el sistema de autenticación completo con todas sus capas de seguridad, y establecer las bases del sistema de gestión de usuarios y roles. Sin estos cimientos sólidos, el resto del desarrollo carecería de la seguridad y escalabilidad requeridas para una plataforma de gestión de flotas en producción.

**Módulos objetivo:**  
El sprint aborda la implementación completa del módulo de autenticación, incluyendo el registro de usuarios, inicio de sesión con contraseña, autenticación de dos factores opcional, cierre automático por inactividad, y restricción de sesiones simultáneas. Simultáneamente, se establecerán los servicios base de usuarios y perfiles, el sistema de roles y permisos RBAC, y el módulo de auditoría que registrará todas las acciones realizadas en el sistema. La configuración del API Gateway con rate limiting y manejo centralizado de errores completará los trabajos de infraestructura.

**Entregables clave:**  
El equipo entregará al finalizar este sprint un API Gateway operativo que maneje autenticación centralizada, routing de requests y rate limiting por tier de usuario. El servicio de autenticación funcionará completamente con soporte para login, logout, registro, recuperación de contraseña y autenticación de dos factores mediante TOTP. El módulo de gestión de usuarios permitirá CRUD completo con validación de datos y persistencia en PostgreSQL. El sistema de roles proveerá cuatro roles base con permisos granulares configurables. El módulo de auditoría almacenará logs inmutables de todas las operaciones del sistema. Finalmente, el pipeline de CI/CD estará configurado para ejecución automática de pruebas y deployment a entornos de staging.

**Criterios de Done:**  
Se considera que el sprint está completo cuando el sistema pasa todas las pruebas unitarias y de integración relacionadas, cuando el coverage de código supera el ochenta por ciento, cuando el API Gateway handles correctamente al menos quinientos requests concurrentes sin degradación, cuando el sistema de autenticación ha sido validado mediante pruebas de penetración básicas, y cuando la documentación de las APIs está actualizada y accesible para equipos consumidores.

---

### 2.2 Sprint 2: Gestión de Flota y Tracking GPS

**Duración:** 4 semanas (Julio 28 — Agosto 24, 2026)  
**Capacidad estimada:** 40 story points  
**Focus principal:** Implementación del módulo de gestión de vehículos y sistema de tracking GPS en tiempo real

**Objetivo del Sprint:**  
Este sprint se concentra en los módulos operativos core de Spottruck: la gestión completa de la flota de vehículos y el sistema de tracking GPS que permite el monitoreo en tiempo real de todas las unidades. Estos módulos constituyen el corazón funcional de la plataforma, ya que sin ellos Spottruck no puede cumplir su propuesta de valor principal de optimización de operaciones logísticas y mejora de la trazabilidad de unidades.

**Módulos objetivo:**  
El sprint aborda la implementación del módulo de registro de vehículos con todos sus datos técnicos incluyendo matrícula, marca, modelo, año, tipo de vehículo, capacidad de carga, capacidad del tanque y tipo de combustible. El sistema de estados operativos permitirá transitionscontroladas entre Disponible, En Servicio, En Mantenimiento, Fuera de Servicio y Dado de Baja. El módulo de asignaciones vehículo-conductor registrará todas las asignaciones con trazabilidad completa. El sistema de tracking GPS recibirá y procesará datos de posición con actualización cada treinta segundos para vehículos en movimiento, implementará el mapa interactivo para visualización, el historial de recorrido con representación gráfica, la detección de permanencias prolongadas, y el cálculo de velocidades promedio. Finalmente, el módulo de geofencing permitirá definir áreas delimitadas y generar notificaciones automáticas por eventos de entrada y salida.

**Entregables clave:**  
El equipo entregará al finalizar este sprint el módulo CRUD de vehículos completamente funcional con validaciones de datos y constraints de negocio, el sistema de estados operativos con reglas de transición validadas, el módulo de asignaciones con historial completo consultable, el servicio de tracking GPS que procese datos en tiempo real con latencia menor a cinco segundos, la interfaz de mapa interactivo para monitoreo de flota, el sistema de historial de recorrido con exportación a formatos estándar, los algoritmos de detección de permanencia y cálculo de velocidades, y el módulo de geofencing con gestión de áreas y generación de alertas.

---

### 2.3 Sprint 3: Gestión de Combustible y Mantenimiento

**Duración:** 4 semanas (Agosto 25 — Septiembre 21, 2026)  
**Capacidad estimada:** 38 story points  
**Focus principal:** Completar los módulos de control de costos operativos: combustible y mantenimiento

**Objetivo del Sprint:**  
Con los módulos de flota y tracking operativos, este sprint se enfoca en los sistemas que permiten a los operadores reducir costos y prolongar la vida útil de los activos: el sistema de gestión de combustible y el módulo de mantenimiento preventivo. Estos dos módulos juntas representan la propuesta de valor de optimización de operaciones que diferencia a Spottruck de sistemas de tracking genéricos.

**Módulos objetivo:**  
El sprint aborda la implementación del sistema de registro de consumo de combustible con captura de litros, costo, estación de servicio, fecha, hora, odómetro y conductor responsable. El módulo de cálculo de rendimiento implementará los algoritmos de km/L con comparativas contra promedios históricos y parámetros esperados. El sistema de alertas de consumo anómalo detectará desviaciones superiores al quince por ciento del rendimiento esperado. El módulo de reportes de gasto proverá vistas semanales, mensuales y anuales con comparativas presupuestales. El sistema de mantenimiento preventivo implementará el calendario basado en kilómetros y tiempo, con notificaciones de servicios próximos. El módulo de órdenes de mantenimiento permitirá crear, asignar y trackear órdenes de servicio tanto preventivas como correctivas. Finalmente, el historial de mantenimiento de cada vehículo será consultable con todos los servicios realizados.

**Entregables clave:**  
El equipo entregará al finalizar este sprint el módulo de registro de combustible con interfaz de captura optimizada para uso en campo, el dashboard de rendimiento de combustible con alertas configurables, los reportes automatizados de gastos comparing against presupuestos asignados, el calendario de mantenimiento preventivo con configuración de parámetros por tipo de vehículo, el sistema de órdenes de trabajo para taller con flujo de aprobación, las notificaciones automáticas para servicios próximos y vencidos, y el historial consolidado de cada vehículo accesible desde su perfil.

---

### 2.4 Sprint 4: Comunicación y Sistema de Alertas

**Duración:** 4 semanas (Septiembre 22 — Octubre 19, 2026)  
**Capacidad estimada:** 36 story points  
**Focus principal:** Implementar los canales de comunicación conductor-despachador y el sistema centralizado de alertas

**Objetivo del Sprint:**  
Este sprint aborda los aspectos de comunicación y coordinación que permiten que la información fluya eficientemente entre los conductores en ruta y los despachadores en la operación. El sistema de mensajería interna y las notificaciones push complementan el tracking GPS al proporcionar canales activos de comunicación bidireccional, mientras que el sistema de alertas centralizado asegura que eventos críticos reciban atención inmediata.

**Módulos objetivo:**  
El sprint aborda la implementación del sistema de mensajería conductor-despachador con soporte para mensajes de texto y predefined templates, historial de conversaciones accesible por vehículo y por fecha, y confirmación de lectura. El módulo de notificaciones push implementará el envío a dispositivos móviles con soporte para iOS y Android, preferencias de canal por tipo de alerta, y configuración de silent hours. El sistema de alertas centralizado recibirá eventos de todos los módulos (GPS, combustible, mantenimiento) y los correlacionará para evitar duplicates, priorizará alertas por severidad, y routingará al responsable designado según reglas configurables. El módulo de templates de notificación permitirá predefined respuestas rápidas para situaciones comunes como demoras, incidentes en ruta, o solicitudes de información.

**Entregables clave:**  
El equipo entregará al finalizar este sprint la aplicación de mensajería integrada en el cliente móvil del conductor, el panel de comunicación del despachador con vista consolidada de todas las conversaciones activas, el motor de notificaciones push con soporte multiplataforma, el sistema de reglas de enrutamiento de alertas con configuración de umbrales y destinatarios, la consola de alertas con dashboard de eventos pendientes y resolved, y el sistema de templates para respuestas rápidas que reduzca el tiempo de comunicación en situaciones críticas.

---

### 2.5 Sprint 5: Reportes y Módulo Administrativo

**Duración:** 4 semanas (Octubre 20 — Noviembre 16, 2026)  
**Capacidad estimada:** 34 story points  
**Focus principal:** Construir el sistema de reportes analíticos y el panel de administración completa

**Objetivo del Sprint:**  
Este sprint se concentra en las funcionalidades que permiten a los administradores y gerentes obtener visibilidad sobre las operaciones de la flota, tomar decisiones basadas en datos, y configurar el sistema según las necesidades específicas de cada cliente. El módulo de reportes y analíticas transforma los datos capturados en sprints anteriores en información accionable, mientras que el panel administrativo proporciona las herramientas de configuración que hacen de Spottruck una plataforma adaptable a diferentes contextos operativos.

**Módulos objetivo:**  
El sprint aborda la implementación del módulo de reportes que incluirá reportes operativos de tracking y utilization de flota, reportes financieros de combustible y mantenimiento con comparativas presupuestales, reportes de eficiencia de conductores con métricas de comportamiento al volante, y exportación a PDF y Excel con filtros configurables. El módulo de analíticas implementará dashboards con KPIs principales visualizados en gráficos interactivos, tendencias históricas con comparativas de período, y alertas predictivas basadas en patrones de consumo y desgaste. El panel administrativo incluirá gestión de parámetros del sistema, configuración de umbrales de alerta, gestión de integraciones externas, y herramientas de soporte remoto.

**Entregables clave:**  
El equipo entregará al finalizar este sprint el módulo de reportes automatizados con programación de envío por email, la biblioteca de templates de reportes adaptadas a diferentes roles, los dashboards de analítica con drill-down hasta nivel de evento individual, las herramientas de exportación flexible con filtros combinados, el sistema de alertas predictivas con configuración de sensibilidad, y el panel administrativo completo con todas las herramientas de configuración descritas.

---

### 2.6 Sprint 6: Integración, Polish y Preparación para Producción

**Duración:** 4 semanas (Noviembre 17 — Diciembre 14, 2026)  
**Capacidad estimada:** 32 story points  
**Focus principal:** Completar integraciones con sistemas externos, pulir la experiencia de usuario, y preparar el deployment a producción

**Objetivo del Sprint:**  
El sprint final tiene como objetivo consolidar todos los módulos desarrollados en un sistema cohesivo, completar las integraciones que fueron marcadas como future para versiones anteriores, realizar las optimizaciones de rendimiento identificadas durante el desarrollo, y preparar la plataforma para el lanzamiento a producción. Este sprint incluye una intensa fase de testing de aceptación con usuarios selectos, corrección de bugs encontrados, y refinamiento de detalles de UX que los tests de usuarios revelen como problemáticos.

**Módulos objetivo:**  
El sprint aborda la integración con sistemas de tarjetas de combustible como Ticket Car, Edenred y Fleetcor para importación automática de transacciones. El refinamiento de UX mencakup ajustes de navegación basados en feedback de usuarios, optimización de flows de captura de datos para reducir fricción, y polish visual de interfaces para asegurar una experiencia consistente. La optimización de rendimiento incluirá profiling y tuning de queries a base de datos, optimización de tiempos de carga en interfaces web, y reducción de consumo de recursos en el cliente móvil. Finalmente, se preparará la documentación de operación incluyendo manuales de usuario, documentación técnica de API, y guías de troubleshooting para el equipo de soporte.

**Entregables clave:**  
El equipo entregue al finalizar este sprint los conectores funcionales para los principales sistemas de tarjetas de combustible, la plataforma completa con todos los módulos integrados, el sistemaoptimizado parahandle al menos mil vehículos simultáneos con tracking activo, la documentación completa de usuario y técnico, los materiales de training para el equipo de implementación y soporte, y la plataforma lista para deployment a producción con todas las configuraciones de entorno preparadas.

---

## 3. Timeline Consolidado

| Sprint | Fechas | Semanas | Objetivo Principal | Story Points |
|--------|--------|---------|-------------------|--------------|
| Sprint 1 | Jun 30 - Jul 27, 2026 | 4 | Fundamentos Core y Autenticación | 35 |
| Sprint 2 | Jul 28 - Ago 24, 2026 | 4 | Gestión de Flota y Tracking GPS | 40 |
| Sprint 3 | Ago 25 - Sep 21, 2026 | 4 | Combustible y Mantenimiento | 38 |
| Sprint 4 | Sep 22 - Oct 19, 2026 | 4 | Comunicación y Alertas | 36 |
| Sprint 5 | Oct 20 - Nov 16, 2026 | 4 | Reportes y Admin | 34 |
| Sprint 6 | Nov 17 - Dic 14, 2026 | 4 | Integración y Polish | 32 |
| **Total** | | **24** | | **215** |

---

## 4. Matriz de Dependencias entre Sprints

El éxito de cada sprint depends de la entrega oportuna de los anteriores. Sprint 2 no puede iniciar sin que el API Gateway y el sistema de autenticación del Sprint 1 estén operativos, ya que todos los servicios se autentican a través de este componente central. Sprint 3 depende de Sprint 2 para los datos de tracking que alimentan los cálculos de consumo y las métricas de utilisation. Sprint 4 recibe eventos de todos los módulos anteriores para alimentar su sistema de alertas centralizado. Sprint 5 consume datos de todos los módulos para generar los reportes consolidados. Sprint 6 integra todos los componentes desarrollados.

Cualquier atraso en los sprints iniciales causará un efecto cascada en los subsiguientes. El plan contempla una semana de buffer entre sprints para absorbedeltas de hasta tres días sin impactar el timeline general. Para atrasos mayores, se activará el protocolo de descoping que prioriza los features críticos sobre los nice-to-have, manteniendo siempre la entrega de un producto funcional al final del Sprint 3.

---

## 5. Métricas de Seguimiento de Sprint

Cada sprint será medido utilizando las siguientes métricas que se trackearán semanalmente y se consolidarán al cierre de cada ciclo:

**Velocity:** Story points completados por sprint, utilizado para calibrar las estimaciones de sprints futuros. Se espera que la velocidad se estabilice después del Sprint 2 una vez que el equipo haya desarrollado un ritmo de trabajo习惯了.

**Burndown Chart:** Representación visual del trabajo remaining versus tiempo, que permite identificar si el sprint está en track o si se requiere intervención para recuperar el ritmo.

**Bug Rate:** Número de bugs reportados por story point implementado. Un rate superior a cero punto cinco bugs por story point indica problemas de calidad que deben abordarse.

**Code Coverage:** Porcentaje del código cubierto por pruebas automatizadas. Se mantiene un mínimo de ochenta por ciento como requirement para cada sprint.

**Escope Creep:** Número de story points agregados después de la planificación del sprint. Medici Baselines se compararán contra las planificaciones originais para identificar patrones de estimación incorrecta.

---

## 6. Protocolo de Ajuste de Plan

Este plan se revisa al final de cada sprint basándose en los datos reales de velocity y feedback de stakeholders. Los ajustes posibles incluyen repriorización de features dentro de sprints, extensión de timelines individuales si el backlog lo requiere, descoping de features de baja prioridad si el equipo no puede absorber la carga de trabajo, y adición de recursos si el presupuesto lo permite y el análisis indica que mejoraría el timeline significativamente.

Ningún cambio que afecte el alcance del Sprint 3 o anterior podrá realizarse sin aprobación del product owner y al menos un stakeholder senior. Cambios en sprints posteriores pueden gestionarse con aprobación del product owner solo.

