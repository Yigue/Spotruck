---
title: Spottruck - Diagrama de Arquitectura del Sistema v1.0
date: 2026-06-04
author: Jarvis AI Agent
status: approved
tags: [arquitectura, diagramas, ascii, spottruck, sistema]
---

# Spottruck — Diagrama de Arquitectura del Sistema v1.0

## 03_Diagrams/System_Architecture_ASCII.md

---

## Descripción General de la Arquitectura

Este documento presenta el diagrama de arquitectura completa del sistema Spottruck, una plataforma innovadora de comercio electrónico especializada en la venta de camiones pesados, semirremolques y vehículos de transporte comercial. La arquitectura está diseñada siguiendo principios de microservicios con alta disponibilidad, escalabilidad horizontal y tolerancia a fallos.

La plataforma Spottruck permite a los usuarios compradores explorar un catálogo extenso de vehículos pesados, realizar ofertas en subastas en tiempo real, gestionar el seguimiento de envíos y comunicarse directamente con los vendedores. Por otro lado, los vendedores pueden publicar	listado de vehículos, configurar subastas, gestionar invenciones y recibir pagos de manera segura a través de la plataforma.

---

## Vista General del Sistema

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                              SPOTTRUCK SYSTEM ARCHITECTURE                             ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

                                    ┌──────────────────────────────┐
                                    │         INTERNET             │
                                    │                               │
                    ┌───────────────►│   ┌──────────────────────┐   │
                    │               │   │   Navegador del       │   │
                    │               │   │   Usuario / App       │   │
                    │               │   │   Móvil (React/Web)   │   │
                    │               │   └──────────────────────┘   │
                    │               └──────────────────────────────┘
                    │                              │
                    │                              │ HTTPS/WSS
                    │                              ▼
╔════════════════════════════════════════════════════════════════════════════════════╗
║                               │  NGINX API GATEWAY  │                                  ║
║                               │  ─────────────────  │                                  ║
║                               │  • SSL Termination  │                                  ║
║                               │  • Rate Limiting    │                                  ║
║                               │  • Load Balancing   │                                  ║
║                               │  • WebSocket Proxy  │                                  ║
╚════════════════════════════════════════════════════════════════════════════════════╝
                    │                    │                    │
                    │                    │                    │
        ┌───────────▼────────┐ ┌────────▼────────┐ ┌───────▼────────┐
        │   AUTH SERVICE     │ │   CORE API       │ │  NOTIFY SERVICE│
        │   ─────────────    │ │   ───────────    │ │  ───────────── │
        │   Port: 3001       │ │   Port: 3000     │ │  Port: 3002    │
        │                     │ │                  │ │                │
        │  ┌──────────────┐  │ │  ┌────────────┐  │ │  ┌────────────┐│
        │  │ JWT Manager  │  │ │  │ Users API  │  │ │  │ WebSocket  ││
        │  └──────────────┘  │ │  │ Trips API  │  │ │  │ Manager    ││
        │  ┌──────────────┐  │ │  │ Bids API   │  │ │  └────────────┘│
        │  │ OAuth2 Mgr   │  │ │  │ Auction API│  │ │  ┌────────────┐│
        │  └──────────────┘  │ │  │ Track API  │  │ │  │ Push Notif ││
        │  ┌──────────────┐  │ │  │ Payments   │  │ │  │ Manager    ││
        │  │ 2FA Manager  │  │ │  │ Ratings    │  │ │  └────────────┘│
        │  └──────────────┘  │ │  │ Admin API  │  │ │  ┌────────────┐│
        │  ┌──────────────┐  │ │  └────────────┘  │ │  │ Room Mgmt  ││
        │  │ Audit Logger │  │ │                  │ │  └────────────┘│
        │  └──────────────┘  │ │                  │ │                │
        └─────────┬──────────┘ └────────┬─────────┘ └───────┬────────┘
                  │                     │                    │
                  │    Inter-Service    │                    │
                  │    Communication    │                    │
                  └──────────┬───────────┴────────────────────┘
                             │
         ┌───────────────────┼───────────────────┬───────────────────┐
         │                   │                   │                   │
    ┌────▼────┐        ┌─────▼─────┐       ┌─────▼─────┐       ┌─────▼─────┐
    │PostgreSQL│       │   Redis   │       │Elasticsearch│     │   S3/CDN  │
    │  :5432  │       │   :6379   │       │   :9200    │       │  (Assets) │
    │         │       │           │       │            │       │           │
    │ ┌─────┐ │       │ ┌───────┐ │       │ ┌─────────┐│       │ ┌───────┐ │
    │ │Users│ │       │ │Sessions│ │       │ │Trip     ││       │ │Images│ │
    │ │Trips│ │       │ │Cache   │ │       │ │Search   ││       │ │Files │ │
    │ │Bids │ │       │ │Pub/Sub │ │       │ │Analytics││       │ └───────┘ │
    │ │Auct │ │       │ │Queues  │ │       │ └─────────┘│       │           │
    │ └─────┘ │       │ └───────┘ │       │            │       │           │
    └─────────┘       └───────────┘       └────────────┘       └───────────┘
```

---

## Componentes Principales de la Arquitectura

### Capa de Presentación (Frontend)

La capa de presentación está construida con React para la aplicación web SPA (Single Page Application) y React Native para la aplicación móvil híbrida. Esta arquitectura permite compartir aproximadamente el 70% del código entre ambas plataformas, reduciendo significativamente los tiempos de desarrollo y mantenimiento.

El frontend se comunica exclusivamente con el API Gateway a través de conexiones cifradas HTTPS para datos REST y WebSocket Secure (WSS) para comunicación en tiempo real. Todas las solicitudes incluyen tokens de acceso JWT en las cabeceras de autorización, garantizando que cada interacción del usuario sea autenticada y autorizada.

### API Gateway (Nginx)

El servidor Nginx funciona como punto de entrada único para todas las solicitudes de los clientes. Sus funciones principales incluyen:

- **Terminación SSL/TLS**: Gestiona certificados HTTPS y descifra el tráfico antes de enviarlo a los servicios internos
- **Balanceo de carga**: Distribuye las solicitudes entrantes entre múltiples instancias de cada servicio
- **Limitación de tasa (Rate Limiting)**: Protege contra ataques de denegación de servicio y limita el uso excesivo de la API
- **Proxy WebSocket**: Gestiona las conexiones persistentes para notificaciones en tiempo real
- **Caché de respuestas**: Almacena respuestas estáticas para reducir la carga en los servicios backend

### Servicio de Autenticación (Auth Service)

El servicio de autenticación es responsable de toda la gestión de identidad y acceso. Implementa un sistema robusto de autenticación multifactor (2FA) que soporta TOTP (Time-based One-Time Password) y códigos QR para configuración rápida.

El gestor JWT genera tokens de acceso con una vida útil de 15 minutos y tokens de actualización con validez de 7 días. Esta estrategia de tokens de corta duración minimiza el riesgo en caso de compromiso de credenciales. El administrador de OAuth2 permite autenticación a través de proveedores externos como Google y Facebook.

El servicio también mantiene un registro de auditoría completo de todos los intentos de login, incluyendo dirección IP, dispositivo utilizado y ubicación geográfica cuando esté disponible.

### API Principal (Core API)

La API principal constituye el núcleo de la lógica de negocio de Spottruck. Se divide en múltiples módulos especializados:

- **Users API**: Gestión de perfiles de usuario, preferencias y configuraciones de cuenta
- **Trips API**: Control de logística y seguimiento de envíos de vehículos comprados
- **Bids API**: Procesamiento de ofertas en subastas con validación en tiempo real
- **Auction API**: Configuración y gestión de subastas incluyendo tiempos de inicio y fin
- **Track API**: Seguimiento GPS en tiempo real del transporte de vehículos
- **Payments API**: Integración con pasarelas de pago y gestión de transacciones
- **Ratings API**: Sistema de calificaciones y reseñas entre compradores y vendedores
- **Admin API**: Panel de administración para moderación de contenido y gestión de usuarios

### Servicio de Notificaciones (Notify Service)

El servicio de notificaciones gestiona toda la comunicación en tiempo real con los usuarios. Utiliza WebSocket para enviar actualizaciones instantáneas sobre el estado de las subastas, nuevas ofertas recibidas y cambios en el seguimiento de envíos.

El gestor de notificaciones push se integra con servicios de terceros como Firebase Cloud Messaging (FCM) para notificaciones en dispositivos móviles incluso cuando la aplicación no está activa. El administrador de salas permite crear canales de comunicación privados entre compradores y vendedores.

---

## Infraestructura de Datos

### PostgreSQL (Base de Datos Principal)

PostgreSQL sirve como base de datos principal para toda la información transaccional del sistema. Almacena datos críticos como perfiles de usuario, listados de vehículos, historial de subastas, ofertas realizadas y registros de pago.

La base de datos está configurada con replicación síncrona a una réplica de solo lectura que se utiliza para consultas de generación de informes y análisis. Esto permite descongestionar la base de datos principal de consultas complejas que podrían degradar el rendimiento de las operaciones transactionales.

### Redis (Caché y Mensajería)

Redis cumple múltiples funciones dentro de la arquitectura. Actúa como almacén de sesiones para gestión de usuarios autenticados, permitiendo acceso rápido a datos de sesión sin consultar la base de datos principal.

También funciona como caché de consultas frecuentes, reduciendo significativamente los tiempos de respuesta para operaciones comunes como obtener listados de subastas activas o recuperar información de perfil de usuario. Su funcionalidad de pub/sub permite la comunicación entre servicios de manera asíncrona.

### Elasticsearch (Búsqueda y Análisis)

Elasticsearch proporciona capacidades avanzadas de búsqueda de texto completo sobre el catálogo de vehículos. Los usuarios pueden buscar por marca, modelo, año, precio, kilometraje y otras características específicas utilizando consultas intuitivas.

Además, Elasticsearch se utiliza para análisis en tiempo real de datos de subastas, permitiendo generar estadísticas sobre tendencias de precios, popularidad de marcas y comportamientos de compra en la plataforma.

### S3/CDN (Almacenamiento de Assets)

Amazon S3 combinado con CloudFront CDN almacena todos los activos estáticos de la aplicación incluyendo imágenes de vehículos, documentos de registro y archivos multimedia. Esta arquitectura garantiza tiempos de carga rápidos independientemente de la ubicación geográfica del usuario.

---

## Flujo de Datos Típico

Cuando un usuario realiza una oferta en una subasta, el flujo de datos atraviesa múltiples componentes. Primero, la solicitud llega al API Gateway que la dirige al Core API después de verificar el token JWT. El Core API valida la oferta contra las reglas de la subasta, consulta Redis para obtener el estado actual y actualiza PostgreSQL con la nueva oferta.

Simultáneamente, el servicio de notificaciones recibe un mensaje a través de Redis pub/sub y envía una actualización WebSocket a todos los usuarios conectados a esa subasta específica. Elasticsearch se actualiza de manera asíncrona para reflejar el nuevo precio en las búsquedas.

---

*Diagrama generado: 2026-06-04*
*Versión de arquitectura: 1.0*
*Estado: Aprobado para producción*
