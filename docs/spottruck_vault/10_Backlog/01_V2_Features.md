---
title: "Spottruck V2 - Feature Backlog"
date: 2026-06-04
author: "Spottruck Product Team"
status: "backlog"
tags:
  - spottruck
  - v2
  - mobile
  - analytics
  - ml
  - international
---

# Spottruck V2 — Feature Backlog

## Overview

This document outlines the strategic feature roadmap for Spottruck version 2 (V2). Moving beyond the MVP core functionality focused on auction-based cargo transport, V2 expands the platform into a full-featured logistics ecosystem. The goals for V2 are: native mobile experience, intelligent automation, business scalability, and regional expansion beyond Argentina.

---

## 1. Aplicación Móvil Nativa (iOS y Android)

### Descripción

La versión V2 prioriza una experiencia móvil nativa de alto rendimiento. Actualmente, Spottruck opera principalmente a través de una interfaz web progresiva (PWA). Para V2, se desarrollará una aplicación nativa en Swift (iOS) y Kotlin (Android) que exploje todas las capacidades del dispositivo móvil.

### Features Prioritarias

- **UI/UX dedicada**: Diseño mobile-first con navegación gestures, deep linking y animaciones fluidas adaptadas a cada plataforma.
- **Geolocalización en tiempo real**: Integración con GPS del dispositivo para tracking en vivo de flotas, optimización de rutas y notificaciones basadas en ubicación.
- **Modo offline para conductores**: Sincronización local de datos de carga, rutas asignadas y estados de viaje. El conductor puede operar en zonas sin cobertura y los datos se sincronizan cuando hay conectividad.
- **Integración con cámara**: Captura de fotos de mercadería en origen/destino, escaneo de documentos (DNI, CIT), firmado digital en pantalla táctil.
- **Autenticación biométrica**: Face ID / Touch ID y fingerprint para login rápido y seguro.
- **Push notifications enriquecidos**: Notificaciones push con contenido interactivo: aceptar/rechazar oferta, alertas de carga nueva, recordatorios de vencimientos.
- **Integración con redes sociales y contactos**: Login social (Apple, Google) para reducir fricción en onboarding.

### Prioridad

Crítica —MVP de V2.

---

## 2. Sistema de Notificaciones Push Avanzadas

### Descripción

El sistema de notificaciones de V2 evoluciona desde alerts básicos hacia un motor de comunicación contextual, multicanal y segmentado. El objetivo es aumentar la conversión en cada paso del funnel: puja, aceptación, recolección, entrega y post-servicio.

### Features

- **Motor de reglas segmentadas**: Configuración de reglas tipo if-this-then-that basadas en comportamiento del usuario, tipo de carga, zona geográfica y momento del día.
- **Notificaciones push enriquecidos (Rich Push)**: Soporte para imágenes, botones de acción inline, y datos estructurados (JSON payloads) directamente en la notificación.
- **Notificaciones multi-canal**: Push, SMS, email y WhatsApp Business API como canales de backup. Se prioriza el canal según preferencia del usuario y disponibilidad (ej: si push falla, enviar SMS).
- **Canal de comunicación operador-conductor**: Chat in-app en tiempo real con soporte para mensajes multimedia y ubicación compartida.
- **Notificaciones proactivas de demanda**: Alertar a transportistas cuando hay cargas disponibles en rutas frecuentes, incrementando la utiliación de capacidad.
- **Analytics de notificación**: Métricas de apertura, CTR, tiempo de respuesta promedio por tipo de notificación. Permite optimizar frecuencia y contenido.
- **Preferencias granulares por usuario**: Cada actor (cargador, transportista, operador) configura qué notificaciones recibe, en qué horarios y por qué canal.

### Prioridad

Alta — impacto directo en conversión y retention.

---

## 3. Dashboard de Analytics e Inteligencia de Negocios

### Descripción

Se introduce Spottruck Analytics, un módulo de business intelligence que permite a cargadores, transportistas y al equipo interno de Spottruck tomar decisiones basadas en datos. Este dashboard consolida información de auctions, operaciones, finanzas y mercado.

### Features

- **KPIs operativos en tiempo real**: Volumen de cargas publicadas, tasa de conversión de pujas, tiempo promedio de asignación, distancia recorrida, factor de ocupación de flota.
- **Reportes financieros**: Ingresos por período, costo promedio por tipo de carga, margen por ruta, comparativa de pricing vs. mercado spot.
- **Análisis de tendencias de mercado**: Evolución de precios de transporte por corredor, estacionalidad, demanda agregada. Gráficos interactivos con drill-down por región, tipo de carga y vehículo.
- **Segmentación de usuarios y behavior analytics**: Perfil de cargadores (frecuencia, volumen, rutas típicas) y transportistas (patrón de uso, scoring, idle time). Cohorte analysis para retention.
- **Heatmaps geoespaciales**: Mapa interactivo con densidad de carga por zona, popularidad de rutas, zonas con alta demanda no satisfecha.
- **Alertas y anomalías**: Notificaciones automáticas cuando métricas superan umbrales (ej: precio promedio de flete cae X% en cierta ruta, indicating market shift).
- **Exportación y APIs de datos**: Descarga de reportes en CSV/Excel, y API REST para integración con herramientas de terceros (Power BI, Tableau, Looker).
- **Role-based access control**: Cada stakeholder ve solo los dashboards y métricas relevantes a su rol.

### Prioridad

Alta — requiere MVP early para data-driven decision making en la expansión.

---

## 4. Pricing Dinámico Basado en Machine Learning

### Descripción

El módulo Spottruck Dynamic Pricing utiliza modelos de machine learning para predecir precios de equilibrio en cada auction y ajustar estrategias de pricing para maximizar fill rate y Revenue Management.

### Features

- **Modelo de predicción de precio de mercado**: Algoritmo de regression y series temporales entrenado con datos históricos de auctions, considerando variables como: distancia, tipo de carga, urgencia, temporada, región, tipo de vehículo, capacidad disponible en el mercado.
- **Estimación de precio recomendada para cargadores**: Al publicar una carga, el sistema sugiere un rango de precio óptimo basado en condiciones actuales del mercado. Esto reduce pujas fallidas y tiempo de asignación.
- **Demand forecasting**: Predicción de demanda agregada de transporte por corredor para los próximos días/semanas. Permite anticipar picos y ajustar capacidad.
- **Dynamic price adjustment (surge pricing)**: En períodos de alta demanda, el sistema ajusta umbrales mínimos de puja para reflejar condiciones de mercado, manteniendo competitividad y reduciendo auctions fallidas.
- **A/B testing framework para pricing**: Permite experimentar con modelos de pricing diferentes en segmentos geográficos o tipos de carga, midiendo impacto en fill rate y Revenue.
- **Explainability del modelo**: Cada predicción de precio incluye un breakdown de los factores que más influyen (SHAP values), generando confianza en usuarios y equipos internos.
- **Machine Learning Ops pipeline**: Infraestrutura para entrenar, validar, monitorear y desplegar modelos de forma continua con data fresca. Monitoreo de drift entre predicciones y precios reales.

### Prioridad

Alta — diferenciador competitivo clave para V2.

---

## 5. Soporte Multi-idioma (i18n)

### Descripción

Spottruck V2 implementa un sistema de internacionalización (i18n) completo que soporta múltiples idiomas, monedas, formatos de fecha/número y configuraciones regionales. Esto es requisito para la expansión internacional planificada.

### Features

- **Idiomas soportados inicialmente**: Español (AR, CL, UY), Portugués (BR), Inglés (para funcionalidades de soporte y B2B).
- **Framework de i18n escalable**: Arquitectura basada en keys con nesting jerárquico, pluralización, género gramatical y variables interpoladas. Soporte para RTL (right-to-left) no incluido inicialmente pero预留para futura expansión.
- **Traducción por contexto de usuario**: Detección automática de idioma del navegador/dispositivo, con override manual disponible. Transición de idioma sin necesidad de re-login.
- **Contenido estático y dinámico**: No solo UI labels, sino también emails transaccionales, SMS templates, push notifications y contenido en base de datos (ej: tips de ayuda, descripciones de servicios).
- **Formato regional de monedas y números**: Ajustes automáticos de símbolo de moneda, separador de miles/decimales según locale. Soporte para ARS, CLP, UYU, BRL.
- **Formato de fecha y hora**: Adaptación a formatos locales (DD/MM/YYYY vs MM/DD/YYYY), zona horaria del usuario.
- **Workflow de traducción profesional**: Integración con APIs de servicios de traducción (DeepL, Google Translate API) para flujos de traducción, con revisión humana para contenido crítico.
- **Fallback robusto**: Cadena de fallback (ej: es-AR → es → en) para que nunca haya contenido vacío.

### Prioridad

Media — habilita internacionalización pero no bloquea MVP de V2.

---

## 6. Integraciones B2B (SAP, Oracle)

### Descripción

Para clientes corporativos de alta relevancia, Spottruck V2 ofrece integración con sistemas ERP corporativos, principalmente SAP (S/4HANA, ECC) y Oracle (E-Business Suite, Fusion). Estas integraciones automatizan procesos de procurement y logística reduciendo intervención manual.

### Features

- **API REST/GraphQL robusta**: Endpoints documentados con OpenAPI/Swagger, autenticación OAuth 2.0, rate limiting, versionamiento de API y webhook support para eventos asíncronos.
- **Integración SAP**: 
  - Inbound purchase order (MM): Spottruck recibe órdenes de compra de SAP y publica automáticamente cargas asociadas.
  - Outbound delivery (LE): Confirma la entrega en Spottruck y actualiza el estado en SAP MM.
  - Master data sync: Sincronización de proveedores, centros de costo, materiales.
  - IDoc y RFC/BAPI support para comunicaciones síncronas.
- **Integración Oracle EBS / Fusion**:
  - Importación de requisiciones de compra como cargas en Spottruck.
  - Actualización de estado de órdenes de transporte en Oracle.
  - Sincronización de proveedores y sitios de entrega.
- **Middleware/Connector**: Componente interno que maneja mapping de datos, transformación, retry logic, y cola de mensajes. Potencial uso de SAP CPI o Oracle Integration Cloud como base.
- **Portal B2B self-service**: Interfaz donde el cliente corporativo puede configurar mappings, monitorear transacciones y gestionar credenciales de API sin depender de Spottruck DevOps.
- **SLA de disponibilidad**: Contrato de uptime 99.9% para APIs B2B con monitoreo activo y alerting.

### Prioridad

Media — depende de contratos con enterprise accounts.

---

## 7. Expansión Internacional (Chile, Uruguay, Brasil)

### Descripción

La expansión regional es un pilar estratégico de V2. Spottruck busca establecerse como plataforma líder de logística de carga por auction en el Cono Sur. Las regulaciones, moneda y cultura de cada mercado requieren adaptaciones específicas.

### Markets Prioritarios

1. **Chile**: Mercado madura para transporte terrestre de carga. Moneda estable (CLP), regulación de transporte de carga (Ley de Rentas route). Alta concentración de importadores en Valparaíso y San Antonio.
2. **Uruguay**: Mercado pequeño pero predecible. Moneda (UYU) indexada al USD. Operadores de transporte集中在 Montevideo. Oportunidad de integración con puertos.
3. **Brasil**: Mercado masivo con complejidades maiores (BRL, ICMS estatal, legislación estadual variable). Diferenciación entre mercados: San Pablo, Porto Alegre, Curitiba como nodos iniciales.

### Features de Expansión

- **Arquitectura multi-tenant por país**: Datos segregados por país, compliance con regulaciones locales de protección de datos (PDPA en Chile, LGPD en Brasil).
- **Pagos locales**: Integración con medios de pago locales: Webpay (Chile), mercadoPago (Argentina + Brasil), Paganza (Uruguay). Manejo de currency conversion y reconciliation.
- **Regulatory compliance por mercado**: Configuración de reglas de negocio por país (regulaciones de peso, restricciones de circulación, documentation requirements).
- **Localización de contenido y soporte**: Contenido de ayuda, términos y condiciones, soporte al cliente en idioma local.
- **Alianzas con operadores logísticos locales**: Integración con transportistas locales para asegurar cobertura inicial en cada mercado.
- **Analytics geolocalizado**: Reportes específicos por mercado incluyendo KPIs locales y benchmarks comparativos entre países.

### Prioridad

Baja para MVP de V2 — requiere haber completada al menos features 1-4 primero. Sin embargo, la arquitectura debe soportar multi-country desde el diseño inicial.

---

## Roadmap Tentativo

| Feature | Prioridad | Estimación de Esfuerzo |
|---------|-----------|------------------------|
| App Móvil Nativa | Crítica | Alto |
| Push Notifications Advanced | Alta | Medio |
| Analytics Dashboard | Alta | Alto |
| Dynamic Pricing ML | Alta | Alto |
| Multi-idioma (i18n) | Media | Medio |
| Integraciones B2B | Media | Alto |
| Expansión Internacional | Baja | Muy Alto |

---

## dependencias y riesgos

- **Dependencias técnicas**: La App Móvil depende de tener APIs REST robustas (feature de integraciones B2B). Analytics Dashboard requiere data warehouse modeling anticipado.
- **Riesgo de scope creep**: V2 tiene muchos features de alta complejidad. Se recomienda priorizar un MVP de V2 con App Móvil + Push + Analytics, y diferir ML Pricing, B2B e Internacional a fases posteriores.
- **Riesgo de regulación**: Expansión a Brasil tiene complejidad regulatoria alta. Considerar contratar counsel legal local antes de launch.
- **Recursos ML**: Dynamic Pricing requiere equipo de data science dedicado (mínimo 1 ML Engineer + 1 Data Engineer). Sin este equipo, el feature debe retrasarse.

---

*Documento creado: 2026-06-04*
*Versión: 0.1 — Draft*