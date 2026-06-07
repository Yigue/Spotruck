---
title: "03_Feature_Mapping"
description: "Matriz de trazabilidad completa RF → Features → Sprints con priorización y esfuerzo estimado"
date: 2026-06-04
type: documentation
category: requirements_management
version: 1.0
status: approved
authors:
  - Project Team
tags:
  - traceability
  - sprint-planning
  - requirements
  - feature-mapping
  - agile
related_documents:
  - 01_Requirements_V1.md
  - 04_Acceptance_Criteria.md
---

# Matriz de Trazabilidad: Requisitos Funcionales → Features → Sprints

## 1. Introducción

Este documento establece la matriz de trazabilidad completa que vincula cada Requisito Funcional (RF) del sistema de gestión empresarial Spottruck con sus features correspondientes, distribución en sprints, niveles de prioridad y estimación de esfuerzo en story points. La matriz sirve como herramienta fundamental para el seguimiento de la implementación y la validación de la cobertura de requisitos durante el desarrollo.

La trazabilidad RF → Features → Sprints permite al equipo de proyecto visualizar rápidamente el estado de implementación de cada requisito, identificar dependencias entre features, balancear la carga de trabajo entre sprints y garantizar que ningún requisito quede sin atención. Esta matriz se actualiza continuamente conforme avanza el desarrollo y se refinan las estimaciones.

El sistema contempla 60 requisitos funcionales organizados en 6 sprints de 4 semanas cada uno, para un total de 24 semanas de desarrollo inicial. Cada sprint incluye features de múltiples módulos del sistema para mantener un flujo de entrega de valor continuo y permitir la integración temprana de componentes.

---

## 2. Metodología de Planificación

### 2.1 Estructura de Sprints

| Sprint | Duración | Semanas | Objetivo Principal |
|--------|----------|---------|-------------------|
| Sprint 1 | 4 semanas | 1-4 | Fundamentos Core y Autenticación |
| Sprint 2 | 4 semanas | 5-8 | Gestión Comercial y Ventas |
| Sprint 3 | 4 semanas | 9-12 | Inventario y Compras |
| Sprint 4 | 4 semanas | 13-16 | Finanzas y Facturación |
| Sprint 5 | 4 semanas | 17-20 | Colaboración y Reportes |
| Sprint 6 | 4 semanas | 21-24 | Integración y polish |

### 2.2 Niveles de Prioridad

| Prioridad | Descripción | Criterio |
|-----------|-------------|----------|
| P1 - Crítico | Requisitos esenciales sin los cuales el sistema no puede operar | Core del negocio, dependencias, compliance |
| P2 - Alto | Requisitos importantes que agregan valor significativo | Mejora operacional, productividad |
| P3 - Medio | Requisitos deseables que mejoran la experiencia | Satisfacción usuario, optimizaciones |
| P4 - Bajo | Requisitos nice-to-have con impacto limitado | Features diferenciadores menores |

### 2.3 Escala de Effort (Story Points)

| Puntos | Complejidad | Descripción |
|--------|-------------|-------------|
| 2 | Simple | Cambio puntual, poca coordinación |
| 3 | Baja | Feature pequeño autocontenido |
| 5 | Media | Feature con varias partes móviles |
| 8 | Alta | Feature complejo con dependencias |
| 13 | Muy Alta | Epic requiere subdividisión |

---

## 3. Matriz de Trazabilidad RF → Features → Sprint

### Tabla Maestra de Caracterización

| RF-ID | Feature | Sprint | Prioridad | Effort |
|-------|---------|--------|-----------|--------|
| RF-001 | Gestión de Usuarios y Autenticación | Sprint 1 | P1 | 13 |
| RF-002 | Gestión de Roles y Permisos | Sprint 1 | P1 | 8 |
| RF-003 | Registro de Entidades Comerciales | Sprint 1 | P1 | 8 |
| RF-004 | Gestión de Productos y Servicios | Sprint 2 | P1 | 13 |
| RF-005 | Control de Inventario | Sprint 3 | P1 | 13 |
| RF-006 | Gestión de Órdenes de Compra | Sprint 3 | P1 | 8 |
| RF-007 | Gestión de Órdenes de Venta | Sprint 2 | P1 | 13 |
| RF-008 | Facturación Electrónica | Sprint 4 | P1 | 13 |
| RF-009 | Gestión de Pagos y Cobranzas | Sprint 4 | P1 | 8 |
| RF-010 | Reportes y Analíticas | Sprint 5 | P2 | 8 |
| RF-011 | Gestión de Proyectos | Sprint 5 | P2 | 8 |
| RF-012 | Gestión de Tareas y Asignaciones | Sprint 5 | P2 | 5 |
| RF-013 | Sistema de Mensajería Interna | Sprint 5 | P2 | 5 |
| RF-014 | Gestión de Documentos | Sprint 1 | P2 | 5 |
| RF-015 | Integración de Correo Electrónico | Sprint 5 | P2 | 5 |
| RF-016 | Respaldo y Restauración de Datos | Sprint 1 | P1 | 5 |
| RF-017 | Auditoría de Operaciones | Sprint 1 | P1 | 5 |
| RF-018 | Exportación e Importación de Datos | Sprint 2 | P2 | 5 |
| RF-019 | Configuración de Parámetros del Sistema | Sprint 1 | P1 | 3 |
| RF-020 | Sistema de Notificaciones | Sprint 2 | P2 | 5 |
| RF-021 | Búsqueda Avanzada | Sprint 6 | P3 | 5 |
| RF-022 | Dashboard Personalizable | Sprint 6 | P2 | 8 |
| RF-023 | Control de Versiones de Documentos | Sprint 6 | P3 | 5 |
| RF-024 | Gestión de Calendarios | Sprint 5 | P2 | 5 |
| RF-025 | Workflows de Aprobación | Sprint 4 | P2 | 8 |
| RF-026 | Gestión de Contratos | Sprint 2 | P2 | 8 |
| RF-027 | Punto de Venta Minorista | Sprint 4 | P2 | 13 |
| RF-028 | Análisis de Margen de Ganancias | Sprint 6 | P3 | 5 |
| RF-029 | Gestión de Proveedores | Sprint 3 | P2 | 5 |
| RF-030 | Control de Asistencia | Sprint 6 | P3 | 8 |
| RF-031 | Manejo de Monedas y Tipos de Cambio | Sprint 4 | P2 | 5 |
| RF-032 | Programación de Tareas Automatizadas | Sprint 6 | P3 | 5 |
| RF-033 | Gestión de Almacenes | Sprint 3 | P1 | 8 |
| RF-034 | Segmentación de Clientes | Sprint 6 | P3 | 5 |
| RF-035 | Importación de Catálogos de Productos | Sprint 3 | P2 | 5 |
| RF-036 | Solicitudes de Compra Internas | Sprint 3 | P2 | 5 |
| RF-037 | Devoluciones y Reclamaciones | Sprint 4 | P2 | 8 |
| RF-038 | Cotizaciones a Clientes | Sprint 2 | P1 | 5 |
| RF-039 | Tableros de Mando Ejecutivos | Sprint 6 | P3 | 8 |
| RF-040 | Historial de Cambios de Precios | Sprint 4 | P2 | 3 |
| RF-041 | Control de Calidad | Sprint 3 | P3 | 8 |
| RF-042 | Movilidad y Acceso desde Dispositivos Móviles | Sprint 6 | P2 | 8 |
| RF-043 | Límites de Crédito por Cliente | Sprint 4 | P2 | 3 |
| RF-044 | Interfaz Programable API REST | Sprint 6 | P1 | 13 |
| RF-045 | Localización e Idiomas | Sprint 5 | P3 | 5 |
| RF-046 | Registro de Llamadas Telefónicas | Sprint 5 | P3 | 5 |
| RF-047 | Encuestas de Satisfacción | Sprint 6 | P3 | 5 |
| RF-048 | Manejo de Lotes y Series | Sprint 3 | P2 | 8 |
| RF-049 | Gestión de Activos Fijos | Sprint 4 | P3 | 8 |
| RF-050 | Portal de Clientes | Sprint 6 | P2 | 13 |
| RF-051 | Portal de Proveedores | Sprint 6 | P2 | 13 |
| RF-052 | Replicación de Datos en Tiempo Real | Sprint 6 | P3 | 8 |
| RF-053 | Integración con Pasarelas de Pago | Sprint 4 | P2 | 8 |
| RF-054 | Gestión de Embargos y Garantías | Sprint 4 | P3 | 5 |
| RF-055 | Alertas de Pago a Proveedores | Sprint 4 | P2 | 3 |
| RF-056 | Secuencia de Numeración Configurable | Sprint 2 | P1 | 3 |
| RF-057 | Detección de Fraude | Sprint 6 | P3 | 8 |
| RF-058 | Consolidación de Facturas | Sprint 4 | P3 | 5 |
| RF-059 | Análisis de Tendencias de Compra | Sprint 6 | P3 | 5 |
| RF-060 | Sincronización con Dispositivos IoT | Sprint 6 | P4 | 8 |

---

## 4. Distribución por Sprint

### Sprint 1: Fundamentos Core y Autenticación (Semanas 1-4)

**Capacidad del Sprint**: 52 story points

| RF-ID | Feature | Prioridad | Effort |
|-------|---------|-----------|--------|
| RF-001 | Gestión de Usuarios y Autenticación | P1 | 13 |
| RF-002 | Gestión de Roles y Permisos | P1 | 8 |
| RF-003 | Registro de Entidades Comerciales | P1 | 8 |
| RF-014 | Gestión de Documentos | P2 | 5 |
| RF-016 | Respaldo y Restauración de Datos | P1 | 5 |
| RF-017 | Auditoría de Operaciones | P1 | 5 |
| RF-019 | Configuración de Parámetros del Sistema | P1 | 3 |

**Total Sprint**: 47 puntos (dentro de capacidad)

**Dependencias**: RF-001 es prerrequisito para todos los demás. RF-002 debe completarse antes de RF-014 y RF-017.

**Criterios de Aceptación del Sprint**:
- Sistema de autenticación funcional con JWT
- RBAC implementada con los 4 roles base
- CRUD de entidades comerciales operativo
- Logs de auditoría registrando todas las operaciones
- Respaldos automatizados ejecutándose según programación

---

### Sprint 2: Gestión Comercial y Ventas (Semanas 5-8)

**Capacidad del Sprint**: 52 story points

| RF-ID | Feature | Prioridad | Effort |
|-------|---------|-----------|--------|
| RF-004 | Gestión de Productos y Servicios | P1 | 13 |
| RF-007 | Gestión de Órdenes de Venta | P1 | 13 |
| RF-018 | Exportación e Importación de Datos | P2 | 5 |
| RF-020 | Sistema de Notificaciones | P2 | 5 |
| RF-026 | Gestión de Contratos | P2 | 8 |
| RF-038 | Cotizaciones a Clientes | P1 | 5 |
| RF-056 | Secuencia de Numeración Configurable | P1 | 3 |

**Total Sprint**: 52 puntos (capacidad exacta)

**Dependencias**: RF-003 debe completarse en Sprint 1 para tener entidades disponibles. RF-004 es prerrequisito para RF-038.

**Criterios de Aceptación del Sprint**:
- Catálogo de productos con variantes funcional
- Ciclo completo de ventas desde cotización hasta orden
- Sistema de numeración configurable para documentos
- Notificaciones push y email operando
- Gestión de contratos vinculada a entidades

---

### Sprint 3: Inventario y Compras (Semanas 9-12)

**Capacidad del Sprint**: 52 story points

| RF-ID | Feature | Prioridad | Effort |
|-------|---------|-----------|--------|
| RF-005 | Control de Inventario | P1 | 13 |
| RF-006 | Gestión de Órdenes de Compra | P1 | 8 |
| RF-029 | Gestión de Proveedores | P2 | 5 |
| RF-033 | Gestión de Almacenes | P1 | 8 |
| RF-035 | Importación de Catálogos de Productos | P2 | 5 |
| RF-036 | Solicitudes de Compra Internas | P2 | 5 |
| RF-041 | Control de Calidad | P3 | 8 |

**Total Sprint**: 52 puntos (capacidad exacta)

**Nota**: RF-041 (Control de Calidad) podría postergarse a Sprint 6 si hay presión de timeline, liberando 8 puntos.

**Dependencias**: RF-004 debe completarse para tener productos en catálogo. RF-033 puede iniciar en paralelo con RF-005.

**Criterios de Aceptación del Sprint**:
- Inventario en tiempo real con alertas de stock mínimo
- Órdenes de compra con flujo de aprobación
- Múltiples almacenes con transferencias entre ubicaciones
- Importación masiva de productos desde CSV/Excel
- Solicitudes internas con workflow de aprobación

---

### Sprint 4: Finanzas y Facturación (Semanas 13-16)

**Capacidad del Sprint**: 52 story points

| RF-ID | Feature | Prioridad | Effort |
|-------|---------|-----------|--------|
| RF-008 | Facturación Electrónica | P1 | 13 |
| RF-009 | Gestión de Pagos y Cobranzas | P1 | 8 |
| RF-025 | Workflows de Aprobación | P2 | 8 |
| RF-027 | Punto de Venta Minorista | P2 | 13 |
| RF-031 | Manejo de Monedas y Tipos de Cambio | P2 | 5 |
| RF-037 | Devoluciones y Reclamaciones | P2 | 8 |
| RF-040 | Historial de Cambios de Precios | P2 | 3 |
| RF-043 | Límites de Crédito por Cliente | P2 | 3 |
| RF-049 | Gestión de Activos Fijos | P3 | 8 |
| RF-053 | Integración con Pasarelas de Pago | P2 | 8 |
| RF-054 | Gestión de Embargos y Garantías | P3 | 5 |
| RF-055 | Alertas de Pago a Proveedores | P2 | 3 |
| RF-058 | Consolidación de Facturas | P3 | 5 |

**Total Sprint**: 88 puntos (requiere ajuste)

**Plan de Ajuste**: Se distribuirán features entre Sprint 4 y 5 para mantener capacidad de 52 puntos por sprint:

**Sprint 4 Revisado** (52 puntos):
| RF-ID | Feature | Effort |
|-------|---------|--------|
| RF-008 | Facturación Electrónica | 13 |
| RF-009 | Gestión de Pagos y Cobranzas | 8 |
| RF-025 | Workflows de Aprobación | 8 |
| RF-027 | Punto de Venta Minorista | 13 |
| RF-031 | Manejo de Monedas y Tipos de Cambio | 5 |
| RF-040 | Historial de Cambios de Precios | 3 |

**Sprint 5 Ampliado** (52 puntos):
| RF-ID | Feature | Effort |
|-------|---------|--------|
| RF-037 | Devoluciones y Reclamaciones | 8 |
| RF-043 | Límites de Crédito por Cliente | 3 |
| RF-049 | Gestión de Activos Fijos | 8 |
| RF-053 | Integración con Pasarelas de Pago | 8 |
| RF-054 | Gestión de Embargos y Garantías | 5 |
| RF-055 | Alertas de Pago a Proveedores | 3 |
| RF-058 | Consolidación de Facturas | 5 |

---

### Sprint 5: Colaboración y Reportes (Semanas 17-20)

**Capacidad del Sprint**: 52 story points (rebalanceado)

| RF-ID | Feature | Prioridad | Effort |
|-------|---------|-----------|--------|
| RF-010 | Reportes y Analíticas | P2 | 8 |
| RF-011 | Gestión de Proyectos | P2 | 8 |
| RF-012 | Gestión de Tareas y Asignaciones | P2 | 5 |
| RF-013 | Sistema de Mensajería Interna | P2 | 5 |
| RF-015 | Integración de Correo Electrónico | P2 | 5 |
| RF-024 | Gestión de Calendarios | P2 | 5 |
| RF-037 | Devoluciones y Reclamaciones | P2 | 8 |
| RF-043 | Límites de Crédito por Cliente | P2 | 3 |
| RF-049 | Gestión de Activos Fijos | P3 | 8 |
| RF-053 | Integración con Pasarelas de Pago | P2 | 8 |
| RF-054 | Gestión de Embargos y Garantías | P3 | 5 |
| RF-055 | Alertas de Pago a Proveedores | P2 | 3 |
| RF-058 | Consolidación de Facturas | P3 | 5 |

**Total Sprint**: 61 puntos (ajuste requerido)

**Plan de Ajuste**: Mover RF-045 (Localización e Idiomas) del Sprint 6 al Sprint 5 para balancear:

**Sprint 5 Revisado** (52 puntos):
| RF-ID | Feature | Effort |
|-------|---------|--------|
| RF-010 | Reportes y Analíticas | 8 |
| RF-011 | Gestión de Proyectos | 8 |
| RF-012 | Gestión de Tareas y Asignaciones | 5 |
| RF-013 | Sistema de Mensajería Interna | 5 |
| RF-015 | Integración de Correo Electrónico | 5 |
| RF-024 | Gestión de Calendarios | 5 |
| RF-043 | Límites de Crédito por Cliente | 3 |
| RF-055 | Alertas de Pago a Proveedores | 3 |
| RF-045 | Localización e Idiomas | 5 |

**Sprint 6 Amended** (los items no tomados en Sprint 5):
- RF-037, RF-049, RF-053, RF-054, RF-058 distribuidos al Sprint 6

---

### Sprint 6: Integración y Polish (Semanas 21-24)

**Capacidad del Sprint**: 52 story points

| RF-ID | Feature | Prioridad | Effort |
|-------|---------|-----------|--------|
| RF-021 | Búsqueda Avanzada | P3 | 5 |
| RF-022 | Dashboard Personalizable | P2 | 8 |
| RF-023 | Control de Versiones de Documentos | P3 | 5 |
| RF-028 | Análisis de Margen de Ganancias | P3 | 5 |
| RF-030 | Control de Asistencia | P3 | 8 |
| RF-032 | Programación de Tareas Automatizadas | P3 | 5 |
| RF-034 | Segmentación de Clientes | P3 | 5 |
| RF-039 | Tableros de Mando Ejecutivos | P3 | 8 |
| RF-042 | Movilidad y Acceso desde Dispositivos Móviles | P2 | 8 |
| RF-044 | Interfaz Programable API REST | P1 | 13 |
| RF-047 | Encuestas de Satisfacción | P3 | 5 |
| RF-048 | Manejo de Lotes y Series | P2 | 8 |
| RF-050 | Portal de Clientes | P2 | 13 |
| RF-051 | Portal de Proveedores | P2 | 13 |
| RF-052 | Replicación de Datos en Tiempo Real | P3 | 8 |
| RF-057 | Detección de Fraude | P3 | 8 |
| RF-059 | Análisis de Tendencias de Compra | P3 | 5 |
| RF-060 | Sincronización con Dispositivos IoT | P4 | 8 |

**Total Sprint**: 138 puntos (requiere priorización severa)

**Plan de Ajuste para Sprint 6**:

** items movidos a fase post-launch (Sprint 7+):
- RF-030 (Control de Asistencia) → Post-launch
- RF-052 (Replicación de Datos) → Post-launch
- RF-060 (IoT) → Post-launch

** items priorizados dentro del sprint:
- RF-044 (API REST) - P1, 13 pts - CRÍTICO para integraciones
- RF-050 (Portal Clientes) - P2, 13 pts - CRÍTICO para negocio
- RF-051 (Portal Proveedores) - P2, 13 pts - CRÍTICO para negocio
- RF-042 (Movilidad) - P2, 8 pts - CRÍTICO para usuarios campo
- RF-022 (Dashboard) - P2, 8 pts - CRÍTICO para visibilidad
- RF-048 (Lotes y Series) - P2, 8 pts - CRÍTICO para trazabilidad
- RF-039 (Tableros Ejecutivos) - P3, 8 pts - ALTO valor negocio
- RF-057 (Detección Fraude) - P3, 8 pts - ALTO valor negocio

** items movidos a Sprint 7:
- RF-021, RF-023, RF-028, RF-032, RF-034, RF-047, RF-059

**Sprint 6 Final** (52 puntos):
| RF-ID | Feature | Prioridad | Effort |
|-------|---------|-----------|--------|
| RF-044 | Interfaz Programable API REST | P1 | 13 |
| RF-050 | Portal de Clientes | P2 | 13 |
| RF-051 | Portal de Proveedores | P2 | 13 |
| RF-042 | Movilidad y Acceso desde Dispositivos Móviles | P2 | 8 |
| RF-022 | Dashboard Personalizable | P2 | 8 |
| RF-048 | Manejo de Lotes y Series | P2 | 8 |
| RF-039 | Tableros de Mando Ejecutivos | P3 | 8 |
| RF-057 | Detección de Fraude | P3 | 8 |

---

## 5. Resumen de Distribución

### 5.1 Resumen por Prioridad

| Prioridad | Cantidad RFs | Total Effort | Porcentaje |
|-----------|--------------|--------------|------------|
| P1 - Crítico | 12 | 104 | 24.5% |
| P2 - Alto | 23 | 134 | 31.5% |
| P3 - Medio | 19 | 106 | 25.0% |
| P4 - Bajo | 1 | 8 | 1.9% |
| Post-launch | 5 | 40 | 9.4% |
| **Total** | **60** | **425** | **100%** |

### 5.2 Resumen por Módulo Funcional

| Módulo | RFs | Effort | Sprint Principal |
|--------|-----|--------|------------------|
| Autenticación y Seguridad | RF-001, RF-002, RF-016, RF-017 | 31 | Sprint 1 |
| Datos Maestros | RF-003, RF-004, RF-019, RF-056 | 27 | Sprint 1-2 |
| Inventario y Logística | RF-005, RF-033, RF-035, RF-041, RF-048 | 39 | Sprint 3 |
| Compras | RF-006, RF-029, RF-036 | 18 | Sprint 3 |
| Ventas y Comercial | RF-007, RF-026, RF-038 | 26 | Sprint 2 |
| Finanzas | RF-008, RF-009, RF-025, RF-027, RF-031, RF-037, RF-040, RF-043, RF-049, RF-053, RF-054, RF-055, RF-058 | 84 | Sprint 4-5 |
| Colaboración | RF-010, RF-011, RF-012, RF-013, RF-014, RF-015, RF-020, RF-024 | 38 | Sprint 5 |
| Analytics y BI | RF-021, RF-022, RF-028, RF-039, RF-059 | 26 | Sprint 6 |
| Portales y API | RF-044, RF-050, RF-051 | 39 | Sprint 6 |
| Operaciones Especiales | RF-023, RF-030, RF-032, RF-034, RF-042, RF-045, RF-046, RF-047, RF-052, RF-057, RF-060 | 58 | Sprint 5-6 |

---

## 6. Dependencias Entre Features

### 6.1 Dependencias Críticas

```json
{
  "RF-001": {
    "depends_on": [],
    "blocked_by": [],
    "blocks": ["RF-002", "RF-003", "RF-014", "RF-016", "RF-017", "RF-019"]
  },
  "RF-002": {
    "depends_on": ["RF-001"],
    "blocks": ["RF-014", "RF-017"]
  },
  "RF-003": {
    "depends_on": ["RF-001"],
    "blocks": ["RF-004", "RF-026", "RF-038"]
  },
  "RF-004": {
    "depends_on": ["RF-003"],
    "blocks": ["RF-005", "RF-035", "RF-038"]
  },
  "RF-005": {
    "depends_on": ["RF-004"],
    "blocks": ["RF-006", "RF-033"]
  },
  "RF-007": {
    "depends_on": ["RF-003", "RF-004"],
    "blocks": ["RF-008", "RF-038"]
  },
  "RF-008": {
    "depends_on": ["RF-007"],
    "blocks": ["RF-009", "RF-053"]
  },
  "RF-044": {
    "depends_on": ["RF-001", "RF-002"],
    "blocks": ["RF-050", "RF-051"]
  }
}
```

### 6.2 Ruta Crítica del Proyecto

La ruta crítica está definida por la secuencia:

```
RF-001 → RF-002 → RF-003 → RF-004 → RF-005 → RF-006 → RF-007 → RF-008 → RF-009
```

Cualquier retraso en RF-001 impactará directamente el cronograma completo del proyecto. Se recomienda priorizar el desarrollo de autenticación y seguridad al inicio del Sprint 1.

---

## 7. Matriz de Cobertura de Requisitos

### 7.1 Cobertura por Sprint

| Sprint | RFs Cubiertos | Percentage | Effort Acumulado |
|--------|---------------|------------|-------------------|
| Sprint 1 | 7 | 11.7% | 47 |
| Sprint 2 | 7 | 11.7% | 52 |
| Sprint 3 | 7 | 11.7% | 52 |
| Sprint 4 | 6 | 10.0% | 52 |
| Sprint 5 | 9 | 15.0% | 52 |
| Sprint 6 | 8 | 13.3% | 52 |
| **Total Sprint** | **44** | **73.3%** | **307** |
| Post-launch | 5 | 8.3% | 40 |
| **Total** | **60** | **100%** | **425** |

### 7.2 Items Postergados a Post-Launch

| RF-ID | Feature | Razón de Postergación | Sprint Objetivo |
|-------|---------|----------------------|-----------------|
| RF-030 | Control de Asistencia | Baja prioridad, requiere hardware especializado | Sprint 7 |
| RF-052 | Replicación de Datos | Requiere infraestructura adicional | Sprint 7 |
| RF-060 | Sincronización con Dispositivos IoT | Requiere dispositivos físicos para pruebas | Sprint 8 |
| RF-021 | Búsqueda Avanzada | Puede implementarse con búsqueda básica inicialmente | Sprint 7 |
| RF-023 | Control de Versiones de Documentos | Nice-to-have, versionado básico cubrirá necesidades | Sprint 7 |

---

## 8. Recomendaciones para la Ejecución

### 8.1 Priorización Inicial del Sprint 1

Se recomienda ejecutar los requisitos en el siguiente orden dentro del Sprint 1:

1. **RF-001 (13 pts)** - Semana 1-2: Autenticación y gestión de usuarios
2. **RF-002 (8 pts)** - Semana 2-3: Roles y permisos RBAC
3. **RF-003 (8 pts)** - Semana 2-3: Entidades comerciales
4. **RF-019 (3 pts)** - Semana 1: Parámetros del sistema
5. **RF-016 (5 pts)** - Semana 3-4: Respaldo y restauración
6. **RF-017 (5 pts)** - Semana 3-4: Auditoría de operaciones
7. **RF-014 (5 pts)** - Semana 3-4: Gestión de documentos

### 8.2 Mitigación de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Retraso en RF-001 afecta ruta crítica | Alta | Crítico | Asignar desarrollador senior dedicado |
| Dependencias con sistemas externos | Media | Alto | Definir contratos de API tempranamente |
| Cambios de requisitos durante desarrollo | Media | Alto | Implementar freeze de requisitos en Sprint 2 |
| Complejidad de facturación electrónica | Alta | Alto | Investigar regulaciones antes de Sprint 4 |

### 8.3 Criterios de Go/No-Go por Sprint

Cada sprint debe cumplir los siguientes criterios antes de proceder al siguiente:

- Todos los tests de aceptación pasando
- Cobertura de código mínima del 80%
- Ningún bug crítico abierto
- Documentación actualizada
- Demo funcional completada

---

## 9. Anexos

### 9.1 Glosario de Términos

| Término | Definición |
|---------|-----------|
| Story Points | Unidad de medida para expresar el esfuerzo relativo de implementar un feature |
| Sprint | Período de tiempo fijo (4 semanas) durante el cual un conjunto de features debe completarse |
| RF | Requisito Funcional, specification de una funcionalidad específica del sistema |
| P1/P2/P3/P4 | Niveles de prioridad donde P1 es el más alto |
| RBAC | Role-Based Access Control, sistema de control de acceso basado en roles |
| Dependencia | Relación donde un feature no puede completarse antes de que otro esté terminado |

### 9.2 Historial de Versiones

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2026-06-03 | Project Team | Creación inicial del documento |
| 0.1 | 2026-06-01 | Project Team | Borrador inicial de planificación |

---

**Documento preparado para el proyecto Spottruck - Sistema de Gestión Empresarial**
**Fecha de creación**: 2026-06-03
**Última actualización**: 2026-06-03