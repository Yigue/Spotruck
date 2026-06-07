---
title: "03 - Infrastructure"
date: 2026-06-04
tags:
  - infrastructure
  - devops
  - spottruck
  - cloud
  - aws
layout: default
---

# Infraestructura de Spottruck

## Resumen Ejecutivo

Este documento describe la arquitectura de infraestructura completa de Spottruck, una plataforma de gestión de flotas de camiones. La infraestructura está diseñada sobre Amazon Web Services (AWS) utilizando un enfoque de infraestructura como código (IaC) con Terraform, garantizando despliegues repetibles, versionables y auditables.

La arquitectura contempla alta disponibilidad con distribución en múltiples zonas de disponibilidad, escalabilidad automática basada en demanda, y robustez ante fallos mediante redundancia estratégica de componentes críticos. El diseño sigue las mejores prácticas de AWS Well-Architected Framework, priorizando la seguridad, confiabilidad, eficiencia de rendimiento, optimización de costos y operaciones sustentables.

Spottruck procesa datos de GPS en tiempo real de miles de camiones simultáneamente, lo que exige una infraestructura capaz de ingestar, procesar y almacenar grandes volúmenes de datos con latencia mínima. La plataforma utiliza Amazon ECS Fargate para orquestación de contenedores, Amazon RDS PostgreSQL para persistencia de datos transaccionales, Amazon ElastiCache Redis para caché de sesión y datos frecuentemente accedidos, y Amazon MQ (RabbitMQ) para mensajería asíncrona entre microservicios.

---

## Arquitectura General de AWS

### Visión General del Diseño

La infraestructura de Spottruck se despliega en la región us-east-1 (Norte de Virginia) aprovechando tres zonas de disponibilidad para garantizar tolerancia a fallos. El diseño de red implementa el patrón de VPC con subredes públicas y privadas, utilizando NAT Gateways para outbound traffic desde subredes privadas y VPC Endpoints para comunicación segura con servicios AWS sin salir de la red de Amazon.

La arquitectura de aplicaciones sigue un patrón de microservicios containerizados, donde cada componente funcional (autenticación, gestión de conductores, tracking GPS, optimización de rutas, mantenimiento, combustible, reportes) se despliega como un servicio independiente dentro del cluster de ECS Fargate. Esta descomposición permite escalamiento independiente de cada componente según sus necesidades específicas de carga.

### Diagrama de Arquitectura de Red

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VPC: 10.0.0.0/16                             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Public Subnets (10.0.0.0/24)              │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │   │
│  │   │   NAT GW    │  │   NAT GW    │  │   NAT GW    │         │   │
│  │   │   az-1      │  │   az-2      │  │   az-3      │         │   │
│  │   └─────────────┘  └─────────────┘  └─────────────┘         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                 Private Subnets - Application (10.0.1.0/24)  │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │   │
│  │   │  ECS Tasks  │  │  ECS Tasks  │  │  ECS Tasks  │         │   │
│  │   │   az-1      │  │   az-2      │  │   az-3      │         │   │
│  │   └─────────────┘  └─────────────┘  └─────────────┘         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Private Subnets - Data (10.0.2.0/24)         │   │
│  │   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐  │   │
│  │   │    RDS    │  │    RDS    │  │   Redis   │  │  SQS    │  │   │
│  │   │ Primary   │  │ Replica   │  │  Cluster  │  │ Queue   │  │   │
│  │   │   az-1    │  │   az-2    │  │   az-1    │  │  az-1   │  │   │
│  │   └───────────┘  └───────────┘  └───────────┘  └─────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Private Subnets - ML (10.0.3.0/24)         │   │
│  │   ┌─────────────┐  ┌─────────────┐                           │   │
│  │   │ SageMaker   │  │  EC2 Batch  │                           │   │
│  │   │  Endpoint   │  │  Instances  │                           │   │
│  │   └─────────────┘  └─────────────┘                           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Rangos CIDR y Zonas de Disponibilidad

| Componente | CIDR | Zona de Disponibilidad | Propósito |
|------------|------|------------------------|----------|
| VPC Principal | 10.0.0.0/16 | - | Red principal de Spottruck |
| Subnets Públicas | 10.0.0.0/24 | us-east-1a | NAT Gateways, Load Balancers |
| Subnets Privadas App | 10.0.1.0/24 | us-east-1a, us-east-1b, us-east-1c | ECS Tasks, Aplicaciones |
| Subnets Privadas Data | 10.0.2.0/24 | us-east-1a, us-east-1b, us-east-1c | RDS, ElastiCache, SQS |
| Subnets Privadas ML | 10.0.3.0/24 | us-east-1a, us-east-1b | SageMaker, Batch Processing |
| VPC Endpoints | 10.0.10.0/24 | us-east-1a | Interface Endpoints para SSM, S3 |

---

## Amazon ECS Fargate

### Configuración del Cluster

El cluster de ECS Fargate constituye el núcleo de computación de Spottruck, ejecutando todos los microservicios de la aplicación. El cluster se configura en modo VPC única con subredes privadas designadas para tareas, distribuyendo automáticamente los contenedores entre las tres zonas de disponibilidad para maximizar la disponibilidad.

```json
{
  "cluster": {
    "clusterName": "spottruck-production",
    "clusterSettings": {
      "containerInsights": {
        "enabled": true
      }
    },
    "configuration": {
      "executeCommandConfiguration": {
        "logConfiguration": {
          "cloudWatchEncryptionEnabled": true,
          "cloudWatchLogGroupName": "/aws/ecs/spottruck/execute-command"
        },
        "kmsKeyId": "arn:aws:kms:us-east-1:123456789012:key/spottruck-ecs-key"
      }
    },
    "computeConfiguration": {
      "executionRoleForEc2": "arn:aws:iam::123456789012:role/ecsExecutionRole",
      "taskRoleForEc2": "arn:aws:iam::123456789012:role/ecsTaskRole"
    }
  }
}
```

### Task Definitions

Cada microservicio posee su propia task definition con recursos específicos y configuraciones de despliegue optimizadas. Las task definitions utilizan el patrón de despliegue canary con porcentaje de tráfico gradualmente incrementado.

```json
{
  "family": "spottruck-api-gateway",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "api-gateway",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/spottruck-api-gateway:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "SERVICE_NAME", "value": "api-gateway"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/spottruck",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "api-gateway"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 40
      }
    }
  ],
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole"
}
```

### Auto-Scaling

El auto-scaling de Fargate se configura mediante AWS Application Auto Scaling, ajustando la cantidad de tareas basándose en métricas de CloudWatch. Se definen políticas de escalamiento para CPU y memoria, así como métricas personalizadas de la aplicación.

```yaml
targetTrackingScalingPolicies:
  - policyName: spottruck-api-cpu-scaling
    targetTrackingConfiguration:
      targetValue: 70
      predefinedMetricSpecification:
        predefinedMetricType: ECSServiceAverageCPUUtilization
    scaleInCooldown: 300
    scaleOutCooldown: 60

  - policyName: spottruck-api-memory-scaling
    targetTrackingConfiguration:
      targetValue: 80
      predefinedMetricSpecification:
        predefinedMetricType: ECSServiceAverageMemoryUtilization
    scaleInCooldown: 300
    scaleOutCooldown: 60

  - policyName: spottruck-api-request-count-scaling
    targetTrackingConfiguration:
      targetValue: 1000
      customizedMetricSpecification:
        metricName: RequestCountPerTarget
        namespace: AWS/ApplicationELB
        statistic: Average
        dimensions:
          - name: LoadBalancer
            value: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/spottruck-alb"
          - name: TargetGroup
            value: "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/spottruck-tg"
    scaleInCooldown: 300
    scaleOutCooldown: 30
```

### Configuración de Servicios

Los servicios ECS utilizan Application Load Balancers para distribución de tráfico y health checks a nivel de contenedor. Cada servicio mantiene un mínimo de 2 tareas por zona de disponibilidad para garantizar disponibilidad durante actualizaciones y fallos de instancia.

```yaml
serviceConfiguration:
  serviceName: spottruck-api-gateway
  cluster: spottruck-production
  desiredCount: 6
  minimumHealthyPercent: 50
  maximumPercent: 200
  deploymentConfiguration:
    deploymentCircuitBreaker:
      enable: true
      rollback: true
  healthCheckGracePeriodSeconds: 30
  loadBalancers:
    - targetGroupArn: "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/spottruck-tg"
      containerName: api-gateway
      containerPort: 3000
```

---

## Amazon RDS PostgreSQL

### Configuración de Instancias

La base de datos PostgreSQL de Spottruck se despliega utilizando Amazon RDS con una instancia primaria en us-east-1a y una réplica de lectura en us-east-1b. Esta configuración permite distribuir las consultas de lectura entre la réplica mientras todas las escrituras van a la instancia primaria, optimizando el rendimiento general del sistema.

```yaml
dbInstance:
  dbInstanceIdentifier: spottruck-postgres-primary
  dbInstanceClass: db.r7g.xlarge
  engine: postgres
  engineVersion: "16.3"
  allocatedStorage: 500
  maxAllocatedStorage: 2000
  storageType: gp3
  storageThroughput: 250
  iops: 3000
  storageEncrypted: true
  kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/spottruck-db-key"
  
  multiAz: true
  dbSubnetGroupName: spottruck-db-subnet-group
  
  masterUsername: spottruck_admin
  masterUserPasswordSecretArn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:spottruck/db-credentials"
  
  backupRetentionPeriod: 30
  backupWindow: "03:00-04:00"
  preferredBackupWindow: "03:00-04:00"
  preferredMaintenanceWindow: "sun:04:00-sun:06:00"
  
  performanceInsightsEnabled: true
  performanceInsightsRetentionPeriod: 7
  
  monitoringInterval: 60
  monitoringRoleArn: "arn:aws:iam::123456789012:role/rdsMonitoringRole"
  
  autoMinorVersionUpgrade: true
  allowMajorVersionUpgrade: false
  
  publiclyAccessible: false
  enabledCloudwatchLogsExports:
    - postgresql
    - upgrade
```

### Parameter Groups

Los grupos de parámetros de RDS configuran el comportamiento del motor PostgreSQL optimizado para workloads de Spottruck, incluyendo configuración de conexiones, caché, y logging.

```sql
-- PostgreSQL Parameter Group para Spottruck
-- Conexiones y Pool
max_connections = 500
effective_cache_size = 6GB
maintenance_work_mem = 512MB
max_parallel_workers_per_gather = 4
work_mem = 64MB

-- Write Performance
wal_buffers = 64MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9
wal_compression = on

-- Logging
log_connections = on
log_disconnections = on
log_duration = off
log_lock_waits = on
log_min_duration_statement = 1000
log_statement = 'ddl'

-- Query Planning
random_page_cost = 1.1
effective_io_concurrency = 200
default_statistics_target = 100
```

### Réplicas de Lectura

Se configuran dos réplicas de lectura en zonas de disponibilidad diferentes para distribuir la carga de consultas y proporcionar alta disponibilidad adicional. Las réplicas utilizan el mismo storage type gp3 con capacidad de escalamiento automático.

```yaml
readReplicas:
  - dbInstanceIdentifier: spottruck-postgres-replica-1
    dbInstanceClass: db.r7g.xlarge
    availabilityZone: us-east-1b
    publiclyAccessible: false
  
  - dbInstanceIdentifier: spottruck-postgres-replica-2
    dbInstanceClass: db.r7g.xlarge
    availabilityZone: us-east-1c
    publiclyAccessible: false
```

### Estrategia de Backups

Los backups automáticos de RDS se configuran con un retention period de 30 días, permitiendo point-in-time recovery hasta el último segundo dentro de ese período. Los backups se almacenan en S3 con encriptación KMS. Adicionalmente, se ejecutan snapshots manuales semanales durante ventanas de baja actividad.

| Tipo de Backup | Frecuencia | Retention | Storage |
|---------------|------------|-----------|---------|
| Automatic Backups | Diario | 30 días | S3 Standard |
| Snapshots Manuales | Semanal (Dom 02:00 UTC) | 90 días | S3 Standard-IA |
| Snapshot Anual | 1 Enero | 1 año | S3 Glacier |
| Exportación a S3 | Mensual | 5 años | S3 Glacier Deep Archive |

---

## Amazon ElastiCache Redis

### Configuración del Cluster

El cluster de Redis en Spottruck se utiliza para múltiples propósitos: caché de consultas de base de datos, almacenamiento de sesiones de usuarios, queue de mensajes para real-time updates, y cache de datos de ubicación de camiones. La configuración en modo cluster proporciona 샤딩 automático y alta disponibilidad.

```yaml
elasticache:
  clusterName: spottruck-redis-cluster
  engine: redis
  engineVersion: "7.1"
  
  nodeType: cache.r7g.large
  
  numNodeGroups: 3
  replicasPerNodeGroup: 2
  
  port: 6379
  atRestEncryptionEnabled: true
  transitEncryptionEnabled: true
  authTokenEnabled: true
  
  automaticFailoverEnabled: true
  multiAzEnabled: true
  
  cacheSubnetGroupName: spottruck-cache-subnet
  
  securityGroupIds:
    - "sg-0abc123def456"
  
  logDeliveryConfigurations:
    - logType: engine-log
      destinationType: cloudwatch-logs
      destinationDetails:
        cloudwatchLogsDestination:
          logGroup: /aws/elasticache/spottruck/redis/engine
      logFormat: json
      logTypeSeverity: ERROR
  
  cacheParameterGroupName: spottruck-redis-params
  
  autoMinorVersionUpgrade: true
  
  snapshotRetentionLimit: 7
  SnapshotWindow: "03:00-05:00"
  MaintenanceWindow: "mon:05:00-mon:07:00"
```

### Estrategias de Caché

Spottruck implementa varias estrategias de caché para optimizar el rendimiento de la aplicación. El TTL (Time To Live) de cada cache key se configura según la naturaleza de los datos.

| Tipo de Caché | TTL | Invalidation Strategy | Uso |
|--------------|-----|----------------------|-----|
| User Sessions | 24 horas | Token revocation event | Sesiones de usuario autenticado |
| GPS Locations | 5 minutos | Write-through on update | Última posición conocida de camiones |
| Route Cache | 1 hora | LRU + TTL | Rutas optimizadas calculadas |
| Driver Data | 15 minutos | Event-driven invalidation | Información de conductores |
| Fleet Metrics | 1 minuto | TTL expiration | KPIs agregados de flota |
| Maintenance Alerts | 10 minutos | Event-driven | Alertas de mantenimiento pendientes |

---

## Amazon MQ (RabbitMQ)

### Arquitectura del Message Broker

RabbitMQ en Spottruck actúa como el backbone de comunicación asíncrona entre microservicios, manejando eventos de GPS, notificaciones, procesamiento de reportes, y comunicación con dispositivos IoT de los camiones. La configuración en modo cluster proporciona alta disponibilidad con automáticamente failover.

```yaml
broker:
  brokerName: spottruck-rabbitmq
  engineType: RabbitMQ
  engineVersion: "3.13.1"
  hostInstanceType: mq.m7g.large
  
  deploymentMode: CLUSTER_MULTI_AZ
  
  publiclyAccessible: false
  
  encryptionOptions:
    encryptionEnabled: true
    kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/spottruck-mq-key"
  
  logList:
    - GENERAL
    - HEARTBEAT
  
  rabbitmqConfiguration:
    defaultVpcEndpointId: "vpce-abc123"
    
    permissions:
      administrator:
        - ".*"
        - ".*"
        tags:
          administrator: true
      
      applicationService:
        - "^amq.gen.*"
        - "^spottruck\\..*"
        tags:
          application: true
    
    defaultUser:
      username: "spottruck_app"
      passwordSecretArn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:spottruck/rabbitmq-credentials"
```

### Diseño de Exchanges y Queues

La arquitectura de RabbitMQ utiliza múltiples exchanges y queues organizados por dominio de funcionalidad, con dead letter queues para manejo de mensajes fallidos.

```json
{
  "exchanges": [
    {
      "name": "spottruck.events",
      "type": "topic",
      "durable": true,
      "arguments": {
        "alternate-exchange": "spottruck.events.dlx"
      }
    },
    {
      "name": "spottruck.gps.location",
      "type": "topic",
      "durable": true
    },
    {
      "name": "spottruck.notifications",
      "type": "fanout",
      "durable": true
    },
    {
      "name": "spottruck.commands",
      "type": "direct",
      "durable": true
    }
  ],
  "queues": [
    {
      "name": "spottruck.gps.location.process",
      "durable": true,
      "arguments": {
        "x-dead-letter-exchange": "spottruck.dlx",
        "x-dead-letter-routing-key": "gps.location.failed",
        "x-message-ttl": 300000,
        "x-max-length": 1000000
      }
    },
    {
      "name": "spottruck.notifications.email",
      "durable": true,
      "arguments": {
        "x-dead-letter-exchange": "spottruck.dlx",
        "x-dead-letter-routing-key": "notification.failed",
        "x-max-priority": 10
      }
    },
    {
      "name": "spottruck.reports.generation",
      "durable": true,
      "arguments": {
        "x-dead-letter-exchange": "spottruck.dlx",
        "x-dead-letter-routing-key": "report.failed",
        "x-max-length": 100
      }
    },
    {
      "name": "spottruck.maintenance.scheduling",
      "durable": true,
      "arguments": {
        "x-dead-letter-exchange": "spottruck.dlx"
      }
    }
  ],
  "bindings": [
    {
      "exchange": "spottruck.events",
      "queue": "spottruck.gps.location.process",
      "routingKey": "gps.location.*"
    },
    {
      "exchange": "spottruck.events",
      "queue": "spottruck.notifications.email",
      "routingKey": "notification.email.*"
    },
    {
      "exchange": "spottruck.events",
      "queue": "spottruck.reports.generation",
      "routingKey": "report.generate.*"
    }
  ]
}
```

### Dead Letter Queues

Las dead letter queues capturan mensajes que no pueden ser procesados exitosamente después de varios intentos, permitiendo análisis posterior y replay de mensajes cuando el problema subyacente se resuelve.

```yaml
deadLetterConfiguration:
  exchanges:
    - name: spottruck.dlx
      type: fanout
      durable: true
  
  queues:
    - name: spottruck.dlx.gps
      sourceQueue: spottruck.gps.location.process
      maxRetries: 5
      retentionDays: 7
    
    - name: spottruck.dlx.notifications
      sourceQueue: spottruck.notifications.email
      maxRetries: 3
      retentionDays: 14
    
    - name: spottruck.dlx.reports
      sourceQueue: spottruck.reports.generation
      maxRetries: 2
      retentionDays: 30
```

---

## Amazon S3

### Buckets y Estructura

S3 almacena documentos de conductores, reportes generados, exports de datos, y assets estáticos de la aplicación. La estructura de buckets sigue las mejores prácticas de organización y control de acceso.

```yaml
buckets:
  - bucketName: spottruck-documents-${AWS::AccountId}
    versioning: true
    encryption: AES256
    
    lifecycleRules:
      - id: move-to-ia-after-90-days
        status: enabled
        transitions:
          - days: 90
            storageClass: STANDARD_IA
          - days: 365
            storageClass: GLACIER
          - days: 1825
            storageClass: DEEP_ARCHIVE
      
      - id: abort-incomplete-uploads
        status: enabled
        abortIncompleteMultipartUploadDays: 7
      
      - id: delete-old-versions
        status: enabled
        noncurrentVersionTransitions:
          - days: 30
            storageClass: STANDARD_IA
          - days: 90
            storageClass: GLACIER
        noncurrentVersionExpirationInDays: 365
    
    publicAccessBlock:
      blockPublicAcls: true
      blockPublicPolicy: true
      ignorePublicAcls: true
      restrictPublicBuckets: true
    
    corsConfiguration:
      corsRules:
        - allowedOrigins:
            - "https://spottruck.com"
            - "https://*.spottruck.com"
          allowedMethods:
            - GET
            - POST
            - PUT
          allowedHeaders:
            - "*"
          maxAge: 3600

  - bucketName: spottruck-reports-${AWS::AccountId}
    versioning: true
    encryption: AES256
    
    lifecycleRules:
      - id: expire-reports-after-1-year
        status: enabled
        expirationInDays: 365
    
    replicationConfiguration:
      role: "arn:aws:iam::123456789012:role/s3-replication-role"
      rules:
        - id: replicate-to-dr-region
          status: enabled
          destination:
            bucket: "arn:aws:s3:::spottruck-reports-dr"
            storageClass: STANDARD
          deleteMarkerReplication:
            status: Enabled

  - bucketName: spottruck-static-assets-${AWS::AccountId}
    website:
      indexDocument: index.html
      errorDocument: error.html
    versioning: false
    encryption: AES256
    
    lifecycleRules:
      - id: cache-static-forever
        status: enabled
        expiresInDays: 365
```

---

## Amazon CloudFront y S3 Static Hosting

### Distribución CloudFront

CloudFront proporciona CDN global para assets estáticos, APIs de la aplicación, y contenido estático de la aplicación web, reduciendo latencia y mejorando la experiencia de usuario global.

```yaml
cloudFrontDistribution:
  enabled: true
  priceClass: PriceClass_100
  
  aliases:
    - spottruck.com
    - www.spottruck.com
    - app.spottruck.com
    - api.spottruck.com
  
  viewerCertificate:
    acmCertificateArn: "arn:aws:acm:us-east-1:123456789012:certificate/spottruck-ssl"
    minimumProtocolVersion: TLSv1.2_2021
    sslSupportMethod: sni-only
  
  defaultRootObject: index.html
  
  customErrorResponses:
    - errorCode: 403
      responseCode: 200
      responsePagePath: /index.html
    - errorCode: 404
      responseCode: 200
      responsePagePath: /index.html
  
  logging:
    bucket: "spottruck-logs.s3.amazonaws.com"
    prefix: "cloudfront/"
    includeCookies: false
  
  originSettings:
    - originName: spottruck-static-assets
      originType: S3
      s3OriginConfig:
        originAccessIdentity: "origin-access-identity/spottruck-oai"
      customHeaders:
        - headerName: X-Custom-Origin-Header
          headerValue: spottruck-static
    
    - originName: spottruck-api
      originType: elb
      customOriginConfig:
        httpPort: 80
        httpsPort: 443
        originProtocolPolicy: https-only
        originSslProtocols:
          - TLSv1.2
  
  cacheBehaviors:
    - pathPattern: /api/*
      targetOrigin: spottruck-api
      viewerProtocolPolicy: https-only
      allowedMethods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
      cachedMethods:
        - GET
        - HEAD
        - OPTIONS
      defaultTtl: 0
      maxTtl: 0
      minTtl: 0
      forwardedValues:
        queryString: true
        headers:
          - Host
          - Authorization
          - X-Requested-With
          - X-API-Key
        cookies:
          forward: whitelisted
          whitelistedNames:
            - session_token
            - csrf_token
    
    - pathPattern: /static/*
      targetOrigin: spottruck-static-assets
      viewerProtocolPolicy: https-only
      allowedMethods:
        - GET
        - HEAD
      cachedMethods:
        - GET
        - HEAD
      defaultTtl: 31536000
      maxTtl: 31536000
      minTtl: 86400
      forwardedValues:
        queryString: false
        headers:
          - Access-Control-Request-Headers
          - Access-Control-Request-Method
    
    - pathPattern: /assets/*
      targetOrigin: spottruck-static-assets
      viewerProtocolPolicy: https-only
      compress: true
      defaultTtl: 604800
```

---

## Amazon Route 53

### Configuración de DNS

Route 53 maneja la resolución DNS para todos los dominios de Spottruck, incluyendo health checks activos y políticas de routing para disaster recovery.

```yaml
hostedZone:
  name: spottruck.com
  vpcId: vpc-0abc123def456
  comment: "Zone for Spottruck Production"
  
  records:
    # API Principal
    - name: api.spottruck.com
      type: A
      alias:
        name: d-abc123def4.cloudfront.net
        zone: Z2FDTNDATAQWY2
        evaluateTargetHealth: true
    
    # Aplicación Web
    - name: app.spottruck.com
      type: A
      alias:
        name: d-xyz789abc1.cloudfront.net
        zone: Z2FDTNDATAQWY2
        evaluateTargetHealth: true
    
    # WebSocket para GPS en tiempo real
    - name: realtime.spottruck.com
      type: A
      alias:
        name: spottruck-alb.elb.amazonaws.com
        zone: Z35SXDOTQB5Q3A
        evaluateTargetHealth: true
    
    # Health Check para failover
    - name: health.spottruck.com
      type: A
      setIdentifier: primary-health
      failoverPolicy: PRIMARY
      healthCheckId: "abc123-def456-789"
    
    - name: health.spottruck.com
      type: A
      setIdentifier: secondary-health
      failoverPolicy: SECONDARY
      healthCheckId: "ghi789-jkl012-345"

healthCheck:
  - name: spottruck-api-health
    type: HTTPS
    fullyQualifiedDomainName: api.spottruck.com
    port: 443
    resourcePath: /health
    interval: 30
    threshold: 3
    measureLatency: true
    regions:
      - us-east-1
      - us-west-2
      - eu-west-1
```

---

## AWS WAF y Shield

### Web Application Firewall

AWS WAF protege la API de Spottruck contra ataques comunes como SQL injection, XSS, y bot traffic. Se implementan reglas managed y custom para cada tipo de amenaza.

```yaml
wafWebACL:
  name: spottruck-api-waf
  metricName: spottruckWAFMetric
  defaultAction:
    type: ALLOW
  
  rules:
    # AWS Managed Rules
    - name: AWSManagedRulesCommonRuleSet
      priority: 1
      statement:
        managedRuleGroupStatement:
          vendorName: AWS
          name: AWSManagedRulesCommonRuleSet
          excludedRules: []
      visibilityConfig:
        sampledRequestsEnabled: true
        cloudWatchMetricsEnabled: true
        metricName: commonRulesMetric
    
    - name: AWSManagedRulesAmazonIpReputationList
      priority: 2
      statement:
        managedRuleGroupStatement:
          vendorName: AWS
          name: AWSManagedRulesAmazonIpReputationList
      visibilityConfig:
        sampledRequestsEnabled: true
        cloudWatchMetricsEnabled: true
        metricName: reputationListMetric
    
    - name: AWSManagedRulesKnownBadInputsRuleSet
      priority: 3
      statement:
        managedRuleGroupStatement:
          vendorName: AWS
          name: AWSManagedRulesKnownBadInputsRuleSet
      visibilityConfig:
        sampledRequestsEnabled: true
        cloudWatchMetricsEnabled: true
        metricName: badInputsMetric
    
    # Rate Limiting Custom
    - name: spottruck-rate-limit
      priority: 10
      statement:
        rateBasedStatement:
          limit: 10000
          evaluationWindowSec: 300
          aggregateKeyType: IP
      action:
        type: BLOCK
        customResponse:
          responseCode: 429
          responseBody: "Too Many Requests"
      visibilityConfig:
        sampledRequestsEnabled: true
        cloudWatchMetricsEnabled: true
        metricName: rateLimitMetric
    
    # Bot Control
    - name: spottruck-bot-control
      priority: 20
      statement:
        managedRuleGroupStatement:
          vendorName: AWS
          name: AWSManagedRulesBotControlRuleSet
          scopeDownStatement:
            regexMatchStatement:
              regexString: ".*"
      action:
        type: CAPTCHA
      visibilityConfig:
        sampledRequestsEnabled: true
        cloudWatchMetricsEnabled: true
        metricName: botControlMetric
```

### AWS Shield Advanced

Shield Advanced proporciona protección DDoS adicional para el Application Load Balancer y CloudFront, con always-on detection y Mitigations automáticas.

```yaml
shieldProtection:
  name: spottruck-shield-advanced
  resourceArns:
    - "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/spottruck-alb"
    - "arn:aws:cloudfront::123456789012:distribution/DXYZ123456789"
  
  autoRenew: true
  protectionGroup: 
    name: spottruck-protections
    protectionGroupType: BY_RESOURCE_TYPE
    aggregation: SUM
  
  healthCheckRegions:
    - us-east-1
    - us-west-2
    - eu-west-1
```

---

## Diseño de VPC

### Security Groups

Los security groups actúan como firewalls virtuales para controlar el tráfico entrante y saliente de cada componente de la infraestructura.

```yaml
securityGroups:
  # Security Group para ECS Tasks (Aplicación)
  - groupName: spottruck-ecs-sg
    groupDescription: Security group for ECS tasks
    vpcId: vpc-0abc123def456
    
    securityGroupEgress:
      - description: "Allow all outbound"
        cidrIp: 0.0.0.0/0
        protocol: -1
    
    securityGroupIngress:
      - description: "HTTP from ALB"
        sourceSecurityGroupId: sg-alb
        protocol: tcp
        fromPort: 3000
        toPort: 3000
      - description: "Inter-service communication"
        sourceSecurityGroupId: sg-ecs
        protocol: tcp
        fromPort: 3000
        toPort: 3000
  
  # Security Group para RDS
  - groupName: spottruck-rds-sg
    groupDescription: Security group for RDS PostgreSQL
    vpcId: vpc-0abc123def456
    
    securityGroupEgress:
      - description: "Allow outbound to ECS"
        sourceSecurityGroupId: sg-ecs
        protocol: tcp
        fromPort: 5432
        toPort: 5432
    
    securityGroupIngress:
      - description: "PostgreSQL from ECS tasks"
        sourceSecurityGroupId: sg-ecs
        protocol: tcp
        fromPort: 5432
        toPort: 5432
      - description: "PostgreSQL from Bastion"
        sourceSecurityGroupId: sg-bastion
        protocol: tcp
        fromPort: 5432
        toPort: 5432
  
  # Security Group para ElastiCache
  - groupName: spottruck-redis-sg
    groupDescription: Security group for ElastiCache Redis
    vpcId: vpc-0abc123def456
    
    securityGroupEgress:
      - description: "Allow outbound to ECS"
        sourceSecurityGroupId: sg-ecs
        protocol: tcp
        fromPort: 6379
        toPort: 6379
    
    securityGroupIngress:
      - description: "Redis from ECS tasks"
        sourceSecurityGroupId: sg-ecs
        protocol: tcp
        fromPort: 6379
        toPort: 6379
  
  # Security Group para MQ
  - groupName: spottruck-mq-sg
    groupDescription: Security group for Amazon MQ RabbitMQ
    vpcId: vpc-0abc123def456
    
    securityGroupIngress:
      - description: "AMQP from ECS tasks"
        sourceSecurityGroupId: sg-ecs
        protocol: tcp
        fromPort: 5671
        toPort: 5671
      - description: "AMQP Management from ECS"
        sourceSecurityGroupId: sg-ecs
        protocol: tcp
        fromPort: 15671
        toPort: 15671
  
  # Security Group para Application Load Balancer
  - groupName: spottruck-alb-sg
    groupDescription: Security group for Application Load Balancer
    vpcId: vpc-0abc123def456
    
    securityGroupEgress:
      - description: "HTTP to ECS tasks"
        sourceSecurityGroupId: sg-ecs
        protocol: tcp
        fromPort: 3000
        toPort: 3000
    
    securityGroupIngress:
      - description: "HTTPS from Internet"
        cidrIp: 0.0.0.0/0
        protocol: tcp
        fromPort: 443
        toPort: 443
      - description: "HTTP redirect"
        cidrIp: 0.0.0.0/0
        protocol: tcp
        fromPort: 80
        toPort: 80
```

### VPC Endpoints

Los VPC Endpoints permiten comunicación privada entre la VPC y servicios AWS sin necesidad de Internet Gateway, eliminando la necesidad de NAT devices para tráfico hacia servicios AWS.

```yaml
vpcEndpoints:
  # Interface Endpoints (PrivateLink)
  - type: Interface
    name: com.amazonaws.us-east-1.ecr.dkr
    serviceName: com.amazonaws.us-east-1.ecr.dkr
    subnetIds: [subnet-0a1b2c3d, subnet-4e5f6g7h, subnet-8i9j0k1l]
    securityGroupIds: [sg-endpoints]
    privateDnsEnabled: true
  
  - type: Interface
    name: com.amazonaws.us-east-1.ecr.api
    serviceName: com.amazonaws.us-east-1.ecr.api
    subnetIds: [subnet-0a1b2c3d, subnet-4e5f6g7h, subnet-8i9j0k1l]
    securityGroupIds: [sg-endpoints]
    privateDnsEnabled: true
  
  - type: Interface
    name: com.amazonaws.us-east-1.secretsmanager
    serviceName: com.amazonaws.us-east-1.secretsmanager
    subnetIds: [subnet-0a1b2c3d, subnet-4e5f6g7h, subnet-8i9j0k1l]
    securityGroupIds: [sg-endpoints]
    privateDnsEnabled: true
  
  - type: Interface
    name: com.amazonaws.us-east-1.ssm
    serviceName: com.amazonaws.us-east-1.ssm
    subnetIds: [subnet-0a1b2c3d, subnet-4e5f6g7h, subnet-8i9j0k1l]
    securityGroupIds: [sg-endpoints]
    privateDnsEnabled: true
  
  - type: Interface
    name: com.amazonaws.us-east-1.monitoring
    serviceName: com.amazonaws.us-east-1.monitoring
    subnetIds: [subnet-0a1b2c3d, subnet-4e5f6g7h, subnet-8i9j0k1l]
    securityGroupIds: [sg-endpoints]
    privateDnsEnabled: true
  
  # Gateway Endpoints (S3 y DynamoDB)
  - type: Gateway
    name: com.amazonaws.us-east-1.s3
    serviceName: com.amazonaws.us-east-1.s3
    routeTableIds: [rtb-app-private, rtb-data-private]
    routeTableIds: []
    policy:
      Version: "2012-10-17"
      Statement:
        - Effect: Allow
          Principal: "*"
          Action:
            - s3:GetObject
            - s3:PutObject
            - s3:DeleteObject
          Resource:
            - "arn:aws:s3:::spottruck-documents-*"
            - "arn:aws:s3:::spottruck-reports-*"
```

---

## IAM y Seguridad

### Roles y Policies

La estrategia de IAM sigue el principio de mínimo privilegio, con roles específicos para cada componente y políticas inline para casos de uso específicos.

```yaml
iamRoles:
  # Role para ECS Execution
  - roleName: spottruck-ecs-execution-role
    assumeRolePolicy:
      Version: "2012-10-17"
      Statement:
        - Effect: Allow
          Principal:
            Service: ecs-tasks.amazonaws.com
          Action: sts:AssumeRole
          Condition:
            StringEquals:
              aws:SourceAccount: "123456789012"
            ArnLike:
              aws:SourceArn: "arn:aws:ecs:us-east-1:123456789012:*"
    
    policies:
      - policyName: ecs-execution-policy
        PolicyDocument:
          Version: "2012-10-17"
          Statement:
            - Effect: Allow
              Action:
                - ecr:GetAuthorizationToken
                - ecr:BatchCheckLayerAvailability
                - ecr:GetDownloadUrlForLayer
                - ecr:BatchGetImage
              Resource: "*"
            
            - Effect: Allow
              Action:
                - logs:CreateLogStream
                - logs:PutLogEvents
              Resource: "arn:aws:logs:us-east-1:123456789012:log-group:/ecs/spottruck/*"
            
            - Effect: Allow
              Action: secretsmanager:GetSecretValue
              Resource:
                - "arn:aws:secretsmanager:us-east-1:123456789012:secret:spottruck/db-credentials"
                - "arn:aws:secretsmanager:us-east-1:123456789012:secret:spottruck/rabbitmq-credentials"
                - "arn:aws:secretsmanager:us-east-1:123456789012:secret:spottruck/jwt-secret"
            
            - Effect: Allow
              Action: kms:Decrypt
              Resource: "arn:aws:kms:us-east-1:123456789012:key/spottruck-*"
              Condition:
                StringEquals:
                  kms:RequestAlias: "alias/spottruck-*"
  
  # Role para ECS Task (Aplicación)
  - roleName: spottruck-ecs-task-role
    assumeRolePolicy:
      Version: "2012-10-17"
      Statement:
        - Effect: Allow
          Principal:
            Service: ecs-tasks.amazonaws.com
          Action: sts:AssumeRole
    
    policies:
      - policyName: ecs-task-policy
        PolicyDocument:
          Version: "2012-10-17"
          Statement:
            - Effect: Allow
              Action:
                - s3:GetObject
                - s3:PutObject
                - s3:DeleteObject
              Resource:
                - "arn:aws:s3:::spottruck-documents-*"
                - "arn:aws:s3:::spottruck-reports-*"
            
            - Effect: Allow
              Action: sqs:ReceiveMessage
              Action: sqs:DeleteMessage
              Resource: "arn:aws:sqs:us-east-1:123456789012:spottruck-*"
            
            - Effect: Allow
              Action: rekognition:CompareFaces
              Action: rekognition:DetectLabels
              Resource: "*"
              Condition:
                StringEquals:
                  aws:RequestedRegion: us-east-1
            
            - Effect: Allow
              Action: location:*
              Resource: "arn:aws:geo:us-east-1:123456789012:map-stack/*"
```

---

## Disaster Recovery

### Objetivos de Recuperación

Spottruck define objetivos claros de recuperación alineados con los requerimientos de negocio para una plataforma de gestión de flotas donde el downtime afecta operaciones de transportación.

| Métrica | Objetivo | Descripción |
|---------|---------|-------------|
| RTO (Recovery Time Objective) | 30 minutos | Tiempo máximo aceptable de inactividad |
| RPO (Recovery Point Objective) | 5 minutos | Pérdida máxima de datos aceptable |
| Recovery Target | 99.9% | Disponibilidad objetivo mensual |

### Estrategia Multi-Region

La estrategia de disaster recovery implementa un patrón activo-passive con región secundaria en us-west-2 (Oregón). La base de datos replica de manera síncrona a la región secundaria utilizando RDS Cross-Region Read Replicas para datos críticos y async replication para datos de menor prioridad.

```yaml
drConfiguration:
  primaryRegion: us-east-1
  secondaryRegion: us-west-2
  
  rdsReplication:
    enabled: true
    replicationType: async
    replicaLagTarget: 60
    backupRetentionSecondary: 14
  
  s3Replication:
    bucket: spottruck-documents
    destinationBucket: spottruck-documents-dr
    replicationTime:
      time: 15
      unit: Minutes
    
    s3ReplicationRules:
      - id: replicate-all
        status: Enabled
        priority: 1
        deleteMarkerReplication:
          status: Enabled
  
  ecsSnapshots:
    taskDefinitions:
      - spottruck-api-gateway
      - spottruck-gps-processor
      - spottruck-notification-service
      - spottruck-reporting-service
  
  route53Failover:
    healthCheck:
      primaryRegion: us-east-1
      secondaryRegion: us-west-2
    dnsTTL: 60
    failoverRecordPriority: 10
  
  secretsReplication:
    secretId: spottruck/db-credentials
    replicateToRegions:
      - us-west-2
```

### Procedimiento de Failover

El procedimiento de failover automatizado se activa mediante CloudWatch alarms cuando se detecta indisponibilidad de la región primaria. El proceso incluye verificación de salud de servicios, promoción de réplicas, y actualización de DNS.

1. **Detección** (0-2 min): CloudWatch detecta kegagalan via health checks
2. **Notificación** (2-5 min): SNS notifica al team de operaciones y stakeholders
3. **Preparación** (5-10 min): Scripts validan estado de región secundaria
4. **Promoción** (10-20 min): RDS replica se promote a primary, SQS failover activated
5. **DNS Switch** (20-30 min): Route 53 actualiza registros para apuntar a región secundaria
6. **Validación** (30-45 min): Smoke tests verifican funcionalidad completa

---

## Optimización de Costos

### Estrategias de Ahorro

La optimización de costos en Spottruck utiliza una combinación de Reserved Instances, Savings Plans, y optimización de recursos para reducir el gasto operativo sin comprometer rendimiento o disponibilidad.

| Estrategia | Aplicación | Ahorro Estimado |
|-----------|------------|----------------|
| Compute Savings Plans | ECS Fargate | 40-60% |
| RDS Reserved Instances | PostgreSQL (1 año) | 35-50% |
| ElastiCache Reserved Nodes | Redis (1 año) | 35-55% |
| S3 Intelligent Tiering | Documents bucket | 20-40% |
| S3 Lifecycle Policies | Reports, Logs | 60-80% |
| CloudFront Cache Optimization | Static assets | 30-50% |

### Reserved Instances y Savings Plans

```yaml
costOptimization:
  savingsPlans:
    - type: COMPUTE_SAVINGS_PLANS
      term: ONE_YEAR
      paymentOption: ALL_UPFRONT
      commitment: 50000
      hourlyCommitment: "USD 28.77"
      region: us-east-1
  
  reservedInstances:
    rds:
      - dbInstanceClass: db.r7g.xlarge
        dbInstanceCount: 3
        term: ONE_YEAR
        offeringClass: CONVERTIBLE
        multiAz: true
    
    elasticache:
      - nodeType: cache.r7g.large
        nodeCount: 9
        term: ONE_YEAR
        offeringClass: CONVERTIBLE
  
  resourceScheduling:
    ecs:
      spotFargateEnabled: true
      spotPercentage: 30
      breakDuration: 180
      maintenanceWindow: "sat:22:00-sat:23:00"
    
    batch:
      spotBidPercentage: 60
      instanceTypes:
        - m7g.large
        - m7g.xlarge
  
  s3Optimization:
    intelligentTiering:
      bucket: spottruck-documents
      monitoringConfiguration:
        monitoringMetrics: true
    
    lifecycleRules:
      expirationDays: 365
      noncurrentVersionExpirationDays: 90
```

### Right-Sizing y Monitorización

La monitorización continua de utilización de recursos permite identificar oportunidades de right-sizing. AWS Cost Anomaly Detection identifica patrones de gasto inusuales y genera alertas para investigación proactiva.

```yaml
costMonitoring:
  budgets:
    - name: spottruck-monthly-budget
      budgetType: COST
      limitAmount: 50000
      alertThreshold: 80
      notificationRecipients:
        - spottruck-finops@spottruck.com
  
  anomalyDetection:
    enabled: true
    sensitivity: LOW
    alertFrequency: DAILY
  
  rightsizingRecommendations:
    ecs:
      memoryUtilizationThreshold: 70
      cpuUtilizationThreshold: 70
      recommendationFrequency: WEEKLY
    
    rds:
      cpuUtilizationThreshold: 60
      memoryUtilizationThreshold: 70
      recommendationFrequency: WEEKLY
```

---

## Conclusión

La infraestructura de Spottruck está diseñada para soportar los requisitos de una plataforma de gestión de flotas en tiempo real, proporcionando alta disponibilidad, escalabilidad automática, y robustas medidas de seguridad. La arquitectura basada en servicios manejados de AWS minimiza la carga operacional mientras garantiza rendimiento óptimo.

El diseño contempla disaster recovery con RTO de 30 minutos y RPO de 5 minutos, protegiendo contra interrupciones regionales. La optimización de costos mediante Savings Plans y Reserved Instances reduce el gasto operativo sin comprometer la calidad del servicio. La implementación como infraestructura como código con Terraform garantiza reproducibilidad y auditabilidad completa de todos los componentes.

La arquitectura cumple con los principios del AWS Well-Architected Framework en las cinco pilares: excelencia operacional, seguridad, confiabilidad, eficiencia de rendimiento, y optimización de costos. El monitoreo continuo y los procesos de mejora continua aseguran que la infraestructura evolucione junto con las necesidades del negocio.
