---
title: Spottruck - Diagrama de Despliegue v1.0
date: 2026-06-04
author: Jarvis AI Agent
status: approved
tags: [despliegue, infraestructura, docker, spottruck, producción]
---

# Spottruck — Diagrama de Despliegue v1.0

## 03_Diagrams/Deployment_Diagram.md

---

## Descripción de la Arquitectura de Despliegue

Este documento describe la arquitectura de despliegue completa de la plataforma Spottruck, detallando la infraestructura de nube, configuración de redes, administración de contenedores y estrategia de alta disponibilidad implementadas para garantizar el funcionamiento continuo del sistema en entornos de producción.

La arquitectura de despliegue de Spottruck está diseñada para cumplir con los requisitos más exigentes de disponibilidad, rendimiento y seguridad. Utilizando servicios administrados de DigitalOcean y AWS, la plataforma logra un tiempo de actividad superior al 99.9% mientras mantiene costos operativos optimizados mediante el uso eficiente de recursos.

El diseño contempla múltiples niveles de redundancia que incluyen replicación geográfica de datos, balanceo de carga entre múltiples regiones y sistemas automatizados de recuperación ante desastres que minimizan el impacto de cualquier fallo individual en la disponibilidad del servicio.

---

## Vista de Despliegue en Nube

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                           SPOTTRUCK DEPLOYMENT ARCHITECTURE                          ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              CLOUD PROVIDER: DIGITALOCEAN                            │
│                              Region: Buenos Aires (sao1)                            │
└──────────────────────────────────────────────────────────────────────────────────────┘

                            ┌─────────────────────────────────────────────────────┐
                            │                   VPC NETWORK                        │
                            │                 10.122.0.0/16                        │
                            │                                                      │
        ┌───────────────────┼───────────────────────────────────┼───────────────┐  │
        │                   │                                   │               │  │
        ▼                   ▼                                   ▼               ▼  │
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│   PUBLIC SUBNET │ │  PRIVATE SUBNET│ │  PRIVATE SUBNET  │ │  PRIVATE SUBNET  │  │
│   10.122.1.0/24 │ │  10.122.2.0/24 │ │  10.122.3.0/24  │ │  10.122.4.0/24  │  │
│                 │ │                 │ │                 │ │                 │  │
│  ┌───────────┐  │ │  ┌───────────┐  │ │  ┌───────────┐  │ │  ┌───────────┐  │  │
│  │ NGINX LB  │  │ │  │Auth Svc   │  │ │  │Core API   │  │ │  │Notify Svc │  │  │
│  │ (HAProxy) │  │ │  │Instance 1│  │ │  │Instance 1│  │ │  │Instance 1│  │  │
│  │:80 :443   │  │ │  │10.122.2.11│  │ │  │10.122.3.11│  │ │  │10.122.4.11│  │  │
│  │           │  │ │  └───────────┘  │ │  └───────────┘  │ │  └───────────┘  │  │
│  │Droplet:   │  │ │  ┌───────────┐  │ │  ┌───────────┐  │ │  ┌───────────┐  │  │
│  │2 vCPU     │  │ │  │Auth Svc   │  │ │  │Core API   │  │ │  │Notify Svc │  │  │
│  │2GB RAM    │  │ │  │Instance 2│  │ │  │Instance 2│  │ │  │Instance 2│  │  │
│  │           │  │ │  │10.122.2.12│  │ │  │10.122.3.12│  │ │  │10.122.4.12│  │  │
│  └───────────┘  │ │  └───────────┘  │ │  └───────────┘  │ │  └───────────┘  │  │
│                 │ │                 │ │                 │ │                 │  │
│  ┌───────────┐  │ │  ┌───────────┐  │ │  ┌───────────┐  │ │                 │  │
│  │Web Server │  │ │  │Auth Svc   │  │ │  │Core API   │  │ │  ┌───────────┐  │  │
│  │(Static)   │  │ │  │Instance 3│  │ │  │Instance 3│  │ │  │Notify Svc │  │  │
│  │:8080      │  │ │  │10.122.2.13│  │ │  │10.122.3.13│  │ │  │Instance 3│  │  │
│  └───────────┘  │ │  └───────────┘  │ │  └───────────┘  │ │  │10.122.4.13│  │  │
│                 │ │                 │ │                 │ │  └───────────┘  │  │
│  ┌───────────┐  │ │                 │ │                 │ │                 │  │
│  │ Certbot   │  │ │                 │ │                 │ │                 │  │
│  │ (SSL)     │  │ │                 │ │                 │ │                 │  │
│  └───────────┘  │ │                 │ │                 │ │                 │  │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘  │
        │                   │                   │                   │               │
        └───────────────────┴───────────────────┴───────────────────┘               │
                                    │                                               │
                                    ▼                                               │
                    ┌───────────────────────────────────────────┐                    │
                    │              PRIVATE SUBNET DB              │                    │
                    │              10.122.5.0/24                  │                    │
                    │                                                │                    │
                    │  ┌───────────────┐  ┌───────────────┐        │                    │
                    │  │PostgreSQL    │  │Redis Cluster  │        │                    │
                    │  │Primary       │  │               │        │                    │
                    │  │10.122.5.21   │  │10.122.5.31    │        │                    │
                    │  └───────────────┘  │Master         │        │                    │
                    │                     ├───────────────┤        │                    │
                    │  ┌───────────────┐  │10.122.5.32    │        │                    │
                    │  │PostgreSQL    │  │Replica        │        │                    │
                    │  │Replica       │  ├───────────────┤        │                    │
                    │  │10.122.5.22   │  │10.122.5.33    │        │                    │
                    │  └───────────────┘  │Replica        │        │                    │
                    │                     └───────────────┘        │                    │
                    │  ┌───────────────┐                           │                    │
                    │  │Elasticsearch │                           │                    │
                    │  │10.122.5.41   │                           │                    │
                    │  └───────────────┘                           │                    │
                    └───────────────────────────────────────────┘                    │
                                                                                     │
                                    │                                               │
                                    │        ┌─────────────────────────────┐         │
                                    │        │     EXTERNAL SERVICES        │         │
                                    │        │                               │         │
                                    │        │  ┌─────────┐  ┌─────────┐   │         │
                                    └───────►│  │ AWS S3 │  │Firebase│   │         │
                                             │  │(Assets)│  │(Push)  │   │         │
                                             │  └─────────┘  └─────────┘   │         │
                                             │                               │         │
                                             │  ┌─────────┐  ┌─────────┐   │         │
                                             │  │Stripe   │  │Mapbox   │   │         │
                                             │  │(Pay)   │  │(Maps)   │   │         │
                                             │  └─────────┘  └─────────┘   │         │
                                             └─────────────────────────────┘         │
```

---

## Componentes de Infraestructura de Red

### Red Virtual Privada (VPC)

La Red Virtual Privada de Spottruck utiliza el bloque CIDR 10.122.0.0/16 que proporciona espacio de direcciones suficiente para más de 65,000 direcciones IP privadas. Este espacio se divide en subredes más pequeñas para aislar diferentes componentes de la arquitectura.

La subred pública (10.122.1.0/24) contiene instancias que requieren acceso directo desde Internet, incluyendo el balanceador de carga NGINX y los servidores de contenido estático. El tráfico entrante está estrictamente controlado a través de grupos de seguridad que permiten únicamente los puertos necesarios (80 para HTTP, 443 para HTTPS).

Las subredes privadas (10.122.2.0/24, 10.122.3.0/24, 10.122.4.0/24) albergan los servicios de aplicación que no requieren acceso directo desde Internet exterior. Estas instancias solo son alcanzables desde la subred pública a través del balanceador de carga o desde otras subredes privadas mediante reglas de firewall específicas.

### Balanceador de Carga y Servidor Web

El balanceador de carga basado en NGINX funciona como punto de entrada único para todo el tráfico externo hacia la plataforma. Además de distribuir carga entre múltiples instancias de servicios, implementa terminación SSL para reducir la carga computacional en los servidores de aplicación.

El servidor web de contenido estático almacena todos los archivos JavaScript, CSS, imágenes y otros assets de la interfaz de usuario. Estos archivos se sirven directamente desde la caché del balanceador de carga cuando es posible, reduciendo la latencia experimentada por los usuarios.

Certbot automatiza la renovación de certificados SSL de Let's Encrypt, garantizando que el sitio permanezca accesible mediante conexiones cifradas sin intervención manual.

---

## Topología de Servicios de Aplicación

### Servicio de Autenticación (Auth Service)

El servicio de autenticación se despliega en tres instancias dentro de la subred privada 10.122.2.0/24, cada una ejecutándose en un droplet separado de DigitalOcean con 2 vCPU y 2GB de RAM. Esta configuración garantiza que el servicio de autenticación permanezca disponible incluso si una o dos instancias fallan.

Las instancias se distribuyen en zonas de disponibilidad dentro del centro de datos de DigitalOcean en São Paulo, proporcionando redundancia contra fallos de hardware individual. Health checks continuos monitorean el estado de cada instancia y automáticamente sacan del pool a aquellas que no responden correctamente.

### API Principal (Core API)

La API principal se despliega en la subred 10.122.3.0/24 con tres instancias de capacidad de procesamiento considerablemente mayor, cada una con 4 vCPU y 8GB de RAM. Esto refleja la naturaleza computacionalmente intensiva de las operaciones de la API que incluyen validación de datos, consultas a múltiples bases de datos y procesamiento de imágenes.

El escalamiento horizontal permite manejar picos de tráfico durante subastas populares sin degradar el rendimiento. Cuando la utilización de recursos supera el 70% en todas las instancias durante más de 5 minutos, el sistema automáticamente provisiona instancias adicionales.

### Servicio de Notificaciones (Notify Service)

El servicio de notificaciones se despliega en la subred 10.122.4.0/24 con configuración similar al servicio de autenticación (2 vCPU, 2GB RAM). Dado que las conexiones WebSocket mantienen estado persistente, cada instancia mantiene su propio conjunto de conexiones activas.

El servicio utiliza un modelo de comunicación pub/sub interno donde las instancias se suscriben a canales específicos para recibir eventos que deben transmitir a sus clientes conectados. Esto permite distribuir la carga de notificación uniformemente entre instancias.

---

## Infraestructura de Datos

### Cluster de PostgreSQL

PostgreSQL se despliega en la subred de base de datos (10.122.5.0/24) con una configuración de alta disponibilidad que incluye un primario para operaciones de escritura y dos réplicas síncronas para operaciones de lectura y redundancia.

El primario de PostgreSQL (10.122.5.21) procesa todas las transacciones que modifican datos, replicando cambios a las réplicas en tiempo real mediante replicación streaming. Las réplicas (10.122.5.22) se utilizan exclusivamente para consultas de solo lectura como generación de reportes, búsquedas complejas y cargas de datos masivas.

Backups automáticos se ejecutan diariamente a las 3:00 AM (hora del servidor) con retención de 30 días. Además, se realizan backups incrementales cada 6 horas que capturan únicamente los cambios desde el último backup completo.

### Cluster de Redis

Redis se configura en modo cluster con un master y dos réplicas para garantizar disponibilidad y tolerancia a fallos. El master (10.122.5.31) acepta todas las operaciones de escritura, mientras que las réplicas (10.122.5.32, 10.122.5.33) replican datos de manera síncrona y pueden servir consultas de lectura.

La persistencia Redis se configura con append-only file (AOF) para garantizar que ningún dato se pierda en caso de fallo del proceso. El AOF se sincroniza a disco cada segundo para balancear rendimiento y seguridad de datos.

### Elasticsearch

Elasticsearch se despliega como un nodo único en la subred de datos (10.122.5.41) con 4 vCPU y 8GB de RAM dedicados. Aunque arquitecturas de producción más grandes típicamente utilizan múltiples nodos para búsqueda de alta disponibilidad, la configuración actual es suficiente para el volumen de datos y consultas de Spottruck.

Los índices se configuran con refresh interval de 5 segundos para proporcionar resultados de búsqueda razonablemente actualizados sin impactar negativamente el rendimiento de indexación.

---

## Integración con Servicios Externos

### Almacenamiento S3 de AWS

AWS S3 proporciona almacenamiento de objetos altamente disponible para todos los archivos subidos por usuarios incluyendo imágenes de vehículos, documentos de registro y certificados de propiedad. Los archivos se almacenan con redundancia geográfica dentro de la región us-east-1 de AWS.

CloudFront CDN distribuye estos archivos globalmente desde edge locations cercanas a los usuarios, reduciendo significativamente los tiempos de carga de páginas que incluyen galerías de imágenes de vehículos.

### Firebase Cloud Messaging

Firebase se utiliza para notificaciones push móviles hacia aplicaciones iOS y Android. El servicio permite envío de notificaciones segmentadas basadas en preferencias de usuario, lingua nativa y comportamiento en la aplicación.

### Stripe Payments

Stripe procesa todos los pagos dentro de la plataforma incluyendo depósitos de garantía para subastas, pagos completos de vehículos y comisiones de la plataforma. La integración utiliza webhooks para notificar al sistema sobre pagos confirmados o fallidos.

### Mapbox

Mapbox proporciona servicios de mapas y geocodificación para la funcionalidad de seguimiento de entregas. La API de seguimiento en tiempo real permite a los usuarios visualizar la ubicación actualizada del transportista en un mapa interactivo.

---

## Estrategia de Alta Disponibilidad

### Health Checks y Auto-Recovery

Todos los servicios implementan health checks HTTP que verifican no solo que el proceso esté corriendo sino también que pueda conectarse a sus dependencias (base de datos, caché). Cuando un health check falla连续mente durante 30 segundos, el servicio se considera no saludable.

Los droplets de DigitalOcean se configuran con monitoreo агрессивно que reinicia automáticamente instancias cuando detectan indisponibilidad del servicio. Kubernetes-like orchestration podría ser añadido en futuras iteraciones para gestión más sofisticada de contenedores.

### Backup y Recuperación ante Desastres

La estrategia de backup incluye múltiples niveles de protección. Backups de PostgreSQL se almacenan tanto localmente en la subred de base de datos como en un bucket S3 separado con acceso restringido. Backups incrementales se realizan cada 6 horas con punto de recuperación objetivo (RPO) de 6 horas.

El plan de recuperación ante desastres (DRP) define procedimientos para restaurar servicios en caso de fallo catastrófico del centro de datos primario. El RTO (Recovery Time Objective) objetivo es de 4 horas para restaurar funcionalidad completa.

---

*Diagrama generado: 2026-06-04*
*Versión de arquitectura: 1.0*
*Estado: Aprobado para producción*

---

## Configuración de Contenedores Docker

La plataforma Spottruck utiliza Docker para containerizar todos los servicios de aplicación, garantizando consistencia entre entornos de desarrollo, pruebas y producción. Cada microservicio se despliega como un contenedor Docker independiente con su propio imagen basada en Node.js Alpine para minimizar el tamaño de la imagen.

Los archivos Dockerfile de cada servicio siguen un patrón consistente que incluye multi-stage builds para separar dependencias de producción de dependencias de desarrollo. El primer stage instala todas las dependencias utilizando npm install, mientras que el segundo stage copia únicamente los archivos necesarios para ejecutar la aplicación.

docker-compose gestiona la orquestación de contenedores en entornos de desarrollo y staging, definiciendo relaciones de dependencia entre servicios, variables de entorno y puertos expuestos. En producción, Kubernetes administra los contenedores con características avanzadas de escalamiento automático y balanceo de carga integrado.

### Imagenes Base y Versionado

Todas las imágenes Docker utilizan versionado semántico con tags que indican la versión exacta del código y la fecha de construcción. El tag latest siempre apunta a la versión más reciente considerada estable para desarrollo, mientras que los tags específicos como v1.0.5-20260604 se utilizan para despliegues en producción.

El registro de imágenes privado en DigitalOcean Container Registry almacena las imágenes de producción con políticas de retención que mantienen las últimas 10 versiones de cada servicio. Esto permite rollback rápido a versiones anteriores cuando se detectan problemas en producción.

---

## Gestión de Secrets y Variables de Entorno

### Secrets de Aplicación

Las credenciales sensibles como claves de API, tokens de acceso y cadenas de conexión a bases de datos se almacenan en DigitalOcean Secrets antes de ser inyectadas en los contenedores en tiempo de ejecución. Esta arquitectura garantiza que ningún secret se almacene en texto plano en repositorios de código o imágenes Docker.

La rotación de secrets sigue una política de rotación obligatoria cada 90 días para credenciales de producción. El servicio de autenticación soporta múltiples claves de firma JWT activas simultáneamente, permitiendo rotación gradual sin tiempo de inactividad.

### Variables de Entorno

Las variables de entorno se dividen en tres categorías: variables comunes que son idénticas en todos los entornos, variables específicas del entorno que varían entre desarrollo y producción, y variables sensibles que se cargan desde el gestor de secrets. Esta separación facilita la promoción de imágenes entre entornos sin cambios en la configuración.

---

## Monitoreo y Observabilidad

### Prometheus y Grafana

El stack de monitoreo utiliza Prometheus para recolección de métricas y Grafana para visualización. Cada servicio expone un endpoint /metrics que proporciona métricas sobre uso de CPU, memoria, tiempos de respuesta de endpoints y tasa de errores.

Los dashboards de Grafana muestran métricas clave de negocio incluyendo número de subastas activas, volumen de ofertas procesadas, tiempo de respuesta promedio de la API y tasa de éxito de pagos. Las alertas se configuran para notificar al equipo de operaciones cuando métricas específicas superan umbrales definidos.

### Logging Centralizado

Todos los servicios envían logs a Elasticsearch a través de Fluentd para agregación y búsqueda centralizada. Los logs se estructuran en formato JSON con campos estandarizados que incluyen ID de correlación para trazabilidad de solicitudes entre servicios.

Kibana proporciona interfaz de búsqueda y visualización para analizar patrones de logs, diagnosticar problemas y auditar acciones de usuarios. Los logs de auditoría de seguridad se retienen durante 1 año para cumplimiento regulatorio, mientras que logs de aplicación se retienen durante 90 días.

---

## Seguridad de la Infraestructura

### Firewalls y Grupos de Seguridad

Cada grupo de instancias aplica el principio de mínimo privilegio, permitiendo únicamente el tráfico necesario para su funcionamiento. El grupo de seguridad del balanceador de carga acepta conexiones entrantes en puertos 80 y 443 desde cualquier dirección IP source, mientras que el tráfico saliente está completamente abierto.

Los grupos de seguridad de servicios de aplicación aceptan tráfico únicamente desde el grupo del balanceador de carga en los puertos específicos de cada servicio. Los grupos de bases de datos aceptan conexiones únicamente desde los grupos de seguridad de los servicios que requieren acceso, utilizando direcciones IP específicas.

### WAF y Protección DDoS

El Web Application Firewall (WAF) proporciona protección contra ataques comunes en capa de aplicación incluyendo inyección SQL, cross-site scripting (XSS), y otros vectores de ataque del OWASP Top 10. Reglas personalizadas se configuran para proteger endpoints específicos de la API contra abuso.

La protección DDoS de DigitalOcean mitiga ataques volumétricos en la capa de red y transporte, garantizando disponibilidad incluso durante intentos de ataque significativos. El tráfico sospechoso se enruta a través de la red de mitigación de DDoS antes de llegar a los recursos protegidos.

---

*Diagrama actualizado: 2026-06-04*
*Versión de arquitectura: 1.0*
*Estado: Aprobado para producción*
