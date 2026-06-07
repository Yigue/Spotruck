---
title: Spottruck - Diagrama de Componentes v1.0
date: 2026-06-04
author: Jarvis AI Agent
status: approved
tags: [componentes, diagrama, spottruck, arquitectura]
---

# Spottruck — Diagrama de Componentes v1.0

## 03_Diagrams/Component_Diagram.md

---

## Descripción de la Estructura de Componentes

Este documento presenta una vista detallada de todos los componentes que conforman la plataforma Spottruck. El diseño de componentes sigue el patrón de arquitectura de microservicios, donde cada servicio tiene responsabilidad exclusiva sobre un dominio de negocio específico. Esta separación permite el desarrollo independiente de equipos, despliegues autónomos y escalabilidad granular.

La plataforma Spottruck está orientada a la compraventa de vehículos pesados incluyendo camiones, semirremolques, furgones refrigerados, cisternas y equipos de construcción pesada. El sistema soporta subastas en tiempo real, seguimiento GPS de entregas, sistema de mensajería entre usuarios y procesamiento de pagos integrado.

---

## Jerarquía de Componentes Principal

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                           SPOTTRUCK COMPONENT HIERARCHY                              ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              SPOTTRUCK PLATFORM                                       │
│                                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                             FRONTEND LAYER                                      │ │
│  │                                                                                 │ │
│  │   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐             │ │
│  │   │   Web Client    │   │   Mobile App    │   │   Admin Panel   │             │ │
│  │   │   (React SPA)   │   │ (React Native)  │   │   (React)       │             │ │
│  │   │                 │   │                 │   │                 │             │ │
│  │   │ ├─ Router       │   │ ├─ Navigator    │   │ ├─ Dashboard    │             │ │
│  │   │ ├─ Auth Module  │   │ ├─ Auth Module  │   │ ├─ User Mgmt    │             │ │
│  │   │ ├─ Trip Module  │   │ ├─ Trip Module  │   │ ├─ Dispute Mgmt │             │ │
│  │   │ ├─ Bid Module   │   │ ├─ Bid Module   │   │ ├─ Reports      │             │ │
│  │   │ ├─ Map Module   │   │ ├─ Map Module   │   │ ├─ Moderation   │             │ │
│  │   │ └─ User Module  │   │ └─ User Module  │   │ └─ Config       │             │ │
│  │   └─────────────────┘   └─────────────────┘   └─────────────────┘             │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                         │                                            │
│  ┌──────────────────────────────────────┼──────────────────────────────────────────┐ │
│  │                                      │          API GATEWAY LAYER                │ │
│  │                                      │                                          │ │
│  │   ┌──────────────────────────────────▼──────────────────────────────────────┐  │ │
│  │   │                          NGINX REVERSE PROXY                            │  │ │
│  │   │                                                                       │  │ │
│  │   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │ │
│  │   │   │ SSL Handler │  │Rate Limiter │  │ Load Balance│  │ WSS Proxy  │  │  │ │
│  │   │   │  (TLS 1.3) │  │  (Leaky     │  │  (Round    │  │  (Socket.io│  │  │ │
│  │   │   │             │  │   Bucket)   │  │   Robin)    │  │   Upgrade)  │  │  │ │
│  │   │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │ │
│  │   └───────────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                         │                                            │
│  ┌──────────────────────────────────────┼──────────────────────────────────────────┐ │
│  │                                      │           SERVICE LAYER                   │ │
│  │                                      │                                          │ │
│  │   ┌─────────────────┐ ┌──────────────▼──────────────┐ ┌─────────────────┐       │ │
│  │   │  AUTH SERVICE   │ │        CORE API             │ │ NOTIFY SERVICE │       │ │
│  │   │    (:3001)     │ │          (:3000)             │ │    (:3002)     │       │ │
│  │   │                 │ │                              │ │                 │       │ │
│  │   │ ┌─────────────┐ │ │ ┌───────┐ ┌───────┐ ┌──────┐ │ │ ┌─────────────┐ │       │ │
│  │   │ │JWT Generator│ │ │ │Users  │ │Trips  │ │Bids  │ │ │ │WebSocket    │ │       │ │
│  │   │ └─────────────┘ │ │ │Module │ │Module │ │Module│ │ │ │Handler      │ │       │ │
│  │   │ ┌─────────────┐ │ │ └───────┘ └───────┘ └──────┘ │ │ └─────────────┘ │       │ │
│  │   │ │OAuth2 Handler│ │ │ ┌───────┐ ┌───────┐ ┌──────┐ │ │ ┌─────────────┐ │       │ │
│  │   │ └─────────────┘ │ │ │Auction│ │Payments│ │Ratings│ │ │ │Push Notif   │ │       │ │
│  │   │ ┌─────────────┐ │ │ │Module │ │Module  │ │Module │ │ │ │Manager      │ │       │ │
│  │   │ │2FA Manager  │ │ │ └───────┘ └───────┘ └──────┘ │ │ └─────────────┘ │       │ │
│  │   │ └─────────────┘ │ │ ┌───────┐ ┌───────┐        │ │ ┌─────────────┐ │       │ │
│  │   │ ┌─────────────┐ │ │ │Track  │ │Search │        │ │ │Room Manager │ │       │ │
│  │   │ │Session Mgr  │ │ │ │Module │ │Module │        │ │ └─────────────┘ │       │ │
│  │   │ └─────────────┘ │ │ └───────┘ └───────┘        │ │                 │       │ │
│  │   │ ┌─────────────┐ │ │ ┌───────┐                │ │                 │       │ │
│  │   │ │Rate Limiter │ │ │ │Admin  │                │ │                 │       │ │
│  │   │ └─────────────┘ │ │ │Module │                │ │                 │       │ │
│  │   │ ┌─────────────┐ │ │ └───────┘                │ │                 │       │ │
│  │   │ │Audit Logger │ │ │                           │ │                 │       │ │
│  │   │ └─────────────┘ │ │                           │ │                 │       │ │
│  │   └─────────────────┘ └────────────────────────────┘ └─────────────────┘       │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                         │                                            │
│  ┌──────────────────────────────────────┼──────────────────────────────────────────┐ │
│  │                                      │           DATA LAYER                       │ │
│  │                                      │                                          │ │
│  │      ┌─────────────────┐  ┌──────────▼──────────┐  ┌─────────────────┐          │ │
│  │      │   PostgreSQL    │  │       Redis         │  │  Elasticsearch  │          │ │
│  │      │   (Primary DB)  │  │   (Cache/Sessions)  │  │  (Search Index) │          │ │
│  │      │                  │  │                     │  │                 │          │ │
│  │      │ ┌─────────────┐ │  │ ┌─────────────────┐ │  │ ┌─────────────┐ │          │ │
│  │      │ │Users Schema │ │  │ │Session Store    │ │  │ │Vehicle Index│ │          │ │
│  │      │ │Trips Schema │ │  │ └─────────────────┘ │  │ │Auction Index│ │          │ │
│  │      │ │Bids Schema  │ │  │ ┌─────────────────┐ │  │ │Search Logs  │ │          │ │
│  │      │ │Auction Sch  │ │  │ │Cache Layer     │ │  │ └─────────────┘ │          │ │
│  │      │ │Payments Sch │ │  │ └─────────────────┘ │  │                 │          │ │
│  │      │ │Ratings Sch  │ │  │ ┌─────────────────┐ │  │                 │          │ │
│  │      │ └─────────────┘ │  │ │Pub/Sub Channels│ │  │                 │          │ │
│  │      │                  │  │ └─────────────────┘ │  │                 │          │ │
│  │      └─────────────────┘  └─────────────────────┘  └─────────────────┘          │ │
│  │                                                                                 │ │
│  │      ┌─────────────────────────────────────────────────────────────────┐        │ │
│  │      │                         S3/CDN Storage                          │        │ │
│  │      │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │        │ │
│  │      │   │Vehicle Images│  │Documents   │  │Static Assets│           │        │ │
│  │      │   └─────────────┘  └─────────────┘  └─────────────┘           │        │ │
│  │      └─────────────────────────────────────────────────────────────────┘        │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Componentes de la Capa de Presentación

### Cliente Web (React SPA)

El cliente web está construido como una Aplicación de Página Única (SPA) utilizando React como biblioteca principal de interfaz de usuario. La arquitectura del cliente se organiza en módulos funcionales independientes que se comunican a través de una tienda de estado centralizada basada en Redux o Context API.

El módulo de enrutamiento gestiona la navegación entre las diferentes secciones de la aplicación sin necesidad de recargar la página completa. Esto proporciona una experiencia de usuario fluida y reducen los tiempos de espera percibidos. El módulo de autenticación maneja el ciclo de vida completo de la sesión del usuario incluyendo login, logout, recuperación de contraseña y verificación de correo electrónico.

El módulo de viajes permite a los usuarios visualizar el estado actual de sus envíos, acceder al historial de entregas y comunicarse con el transportista asignado. El módulo de ofertas gestiona todo el proceso de puja en subastas incluyendo visualización de precio actual, historial de ofertas, configuración de ofertas automáticas y recepción de notificaciones de sobrepujas.

El módulo de mapas integra servicios de localización para mostrar la posición estimada de los vehículos en transporte, calcular rutas óptimas de entrega y proporcionar estimaciones de tiempo de llegada basadas en condiciones de tráfico en tiempo real.

### Aplicación Móvil (React Native)

La aplicación móvil comparte la misma arquitectura base que el cliente web pero está optimizada para dispositivos táctiles y funcionalidades específicas de móvil como notificaciones push locales, acceso a la cámara para escanear códigos QR de vehículos y uso del GPS para seguimiento de entregas.

El módulo de navegación implementa patrones de navegación nativos específicos de cada plataforma (iOS y Android) para proporcionar una experiencia familiar a los usuarios. El módulo de autenticación soporta biometría (Touch ID y Face ID) para un acceso más rápido y seguro a la aplicación.

### Panel de Administración (React)

El panel de administración proporciona funcionalidades de gestión completa de la plataforma para el equipo de Spottruck. El módulo de gestión de usuarios permite crear, modificar y eliminar cuentas de usuario, así como aplicar restricciones o suspensiones en caso de comportamiento inapropiado.

El módulo de gestión de disputas procesa conflictos entre compradores y vendedores, permitiendo a los administradores revisar evidencia, mediar en disputas y tomar decisiones vinculantes. El módulo de reportes genera visualizaciones y exportaciones de datos sobre el rendimiento de la plataforma, ingresos, usuarios activos y métricas de subastas.

El módulo de moderación facilita la revisión de contenido publicado por usuarios incluyendo imágenes de vehículos, descripciones y mensajes, asegurando el cumplimiento de las políticas de la plataforma.

---

## Componentes de la Capa de API Gateway

### Gestor SSL/TLS

El componente de terminación SSL gestiona certificados digitales de Let's Encrypt para proporcionar conexiones cifradas a todos los usuarios. Implementa TLS 1.3 para máxima seguridad y compatibilidad con navegadores modernos. Renueva automáticamente los certificados antes de su expiración para garantizar disponibilidad continua.

### Limitador de Tasa

El limitador de tasa implementa el algoritmo de cubeta con fugas (leaky bucket) para controlar el número de solicitudes que cada usuario puede realizar en un período de tiempo determinado. Protege contra ataques de denegación de servicio y previene el uso abusivo de la API por parte de usuarios individuales.

### Balanceador de Carga

El balanceador de carga distribuye las solicitudes entrantes entre múltiples instancias de cada servicio backend utilizando el algoritmo de robin redondo (round-robin) con consideraciones de peso para instancias con mayor capacidad. Mantiene persistencia de sesión para garantizar que las solicitudes de un mismo usuario sean procesadas por la misma instancia cuando sea necesario.

### Proxy WebSocket

El proxy WebSocket gestiona el protocolo de conexión persistente que permite comunicación bidireccional en tiempo real entre el servidor y los clientes. Utiliza Socket.io para abstracción de transporte, cayendo gracefully a métodos alternativos cuando WebSocket nativo no está disponible.

---

## Componentes de la Capa de Servicios

### Servicio de Autenticación

El servicio de autenticación se compone de múltiples subcomponentes especializados. El generador JWT crea tokens de acceso y refresh con tiempos de vida configurables y algoritmos de firma seguros (HS256 para tokens internos, RS256 para tokens expuestos a clientes).

El manejador OAuth2 implementa el flujo de autorización estándar para autenticación con proveedores externos. Actualmente soporta integración con Google y Facebook, permitiendo a los usuarios registrarse e iniciar sesión utilizando sus cuentas existentes en estas plataformas.

El administrador 2FA gestiona la configuración y verificación de autenticación multifactor. Genera secretos TOTP, produce códigos QR para configuración simplificada en aplicaciones de autenticación como Google Authenticator o Authy, y valida códigos de verificación durante el proceso de login.

El administrador de sesiones rastrea todas las sesiones activas de cada usuario, permitiendo visualización de dispositivos conectados, invalidación remota de sesiones individuales y configuración de límite de sesiones simultáneas.

### API Principal

La API principal encapsula la lógica de negocio central de la plataforma en módulos especializados por dominio.

El módulo de usuarios gestiona el ciclo de vida completo de las cuentas de usuario incluyendo registro, verificación de correo, actualización de perfil, gestión de direcciones y preferencias de notificación. El módulo de viajes coordina toda la logística asociada con el transporte de vehículos comprados, incluyendo asignación de transportista, seguimiento GPS y confirmaciones de entrega.

El módulo de ofertas procesa las ofertas realizadas en subastas, validando contra reglas de negocio como monto mínimo de incremento, saldo disponible del usuario y estado actual de la subasta. El módulo de subastas gestiona la configuración, inicio, duración y finalización de subastas, incluyendo mecanismos de extensión automática cuando se reciben ofertas en los últimos minutos.

El módulo de pagos integra con múltiples pasarelas de pago (Stripe, PayPal) para procesar transacciones de manera segura. Maneja整个人流程 desde la autorización del pago hasta el cobro y la devolución en caso necesario. El módulo de calificaciones permite a compradores y vendedores evaluarse mutuamente después de completar una transacción,构建 un sistema de reputación que ayuda a construir confianza en la plataforma.

### Servicio de Notificaciones

El servicio de notificaciones mantiene conexiones WebSocket persistentes con los clientes para enviar actualizaciones en tiempo real. El manejador de WebSocket gestiona el handshake inicial, heartbeats para mantener conexiones vivas y reconexión automática en caso de pérdida de conexión.

El administrador de notificaciones push se integra con Firebase Cloud Messaging (FCM) para iOS y Android, y con servicios de notificación web para navegadores que soportan el estándar. Permite envío de notificaciones segmentadas basadas en preferencias de usuario y comportamiento.

El administrador de salas permite la creación de canales de comunicación privados para mensajería directa entre compradores y vendedores, así como salas de grupo para subastas con múltiples participantes activos.

---

## Componentes de la Capa de Datos

### PostgreSQL

PostgreSQL almacena todos los datos transaccionales del sistema en un esquema relacional bien estructurado. El esquema de usuarios incluye tablas para perfiles básicos, direcciones de envío, métodos de pago registrados y preferencias de notificación. El esquema de subastas contiene configuraciones de subastas, historial de ofertas, estados de auction y resultados finales.

La base de datos implementa procedimientos almacenados para operaciones complejas que requieren atomicidad, como el proceso de cierre de subasta que debe actualizar múltiples tablas de manera simultánea. Los índices optimizados garantizan tiempos de respuesta rápidos incluso con grandes volúmenes de datos.

### Redis

Redis proporciona almacenamiento de sesiones de alto rendimiento que permite acceso sub-milisegundo a datos de sesión de usuario. El almacén de sesiones incluye información de autenticación, preferencias temporales y estado de aplicación del lado del cliente.

La capa de caché almacena resultados de consultas frecuentes para reducir la carga en PostgreSQL. Las claves de caché incluyen prefijos que identifican el tipo de dato y sufijos que permiten invalidación selectiva cuando los datos subyacentes cambian.

Los canales pub/sub permiten comunicación asíncrona entre servicios, especialmente útil para el servicio de notificaciones que necesita recibir eventos de múltiples fuentes (Core API para nuevas ofertas, servicio de seguimiento para actualizaciones de ubicación).

### Elasticsearch

Elasticsearch mantiene índices de búsqueda optimizados para el catálogo de vehículos que permiten consultas de texto completo con relevancia排名. El índice de vehículos incluye todos los atributos de los Trucks incluyendo marca, modelo, año, kilometraje, tipo de combustible y capacidad de carga.

El índice de subastas permite búsqueda de subastas activas con filtros por precio, tiempo restante, categoría de vehículo y ubicación del vendedor. Los logs de búsqueda se almacenan para analizar patrones de consulta y mejorar la relevancia de resultados.

### S3/CDN

Amazon S3 proporciona almacenamiento duradle para todos los archivos estáticos de la plataforma. Las imágenes de vehículos se almacenan en buckets organizados por ID de vehículo y tipo de imagen (exterior, interior, motor, documentos). CloudFront CDN distribuye estos assets globalmente con tiempos de caché optimizados.

---

*Diagrama generado: 2026-06-04*
*Versión de arquitectura: 1.0*
*Estado: Aprobado para producción*
