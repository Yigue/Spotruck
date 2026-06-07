---
title: "04 - Monitoring and Logging"
date: 2026-06-04
author: Spottruck DevOps Team
status: active
tags:
  - monitoring
  - logging
  - observability
  - devops
  - spottruck
  - cloudwatch
  - datadog
  - prometheus
---

# Monitoreo y Logging para Spottruck

## Resumen Ejecutivo

Este documento describe la estrategia completa de monitoreo y logging implementada para Spottruck, proporcionando visibilidad completa sobre la salud, rendimiento y seguridad de la plataforma de gestión de flotas de camiones. La estrategia de observabilidad sigue el modelo de tres pilares: métricas (metrics), logs, y trazas (traces), correlacionados para enable análisis de causa raíz rápido y preciso.

El sistema de monitoreo está diseñado para satisfacer los exigentes requisitos de una plataforma que procesa datos de GPS en tiempo real de miles de vehículos, donde cada segundo de downtime o degradación de rendimiento tiene impacto directo en las operaciones de transporte de los clientes. La arquitectura de monitoreo utiliza Amazon CloudWatch como componente central, complementado con Datadog para APM avanzado, Prometheus para métricas de infraestructura containerizada, y Elasticsearch para log aggregation y análisis.

La estrategia contempla alerting inteligente con escalamiento automático, dashboards operacionales para diferentes equipos (desarrollo, operaciones, negocio), y retention policies que balancean requerimientos de auditoría con optimización de costos de almacenamiento.

---

## Arquitectura de Observabilidad

### Visión General del Sistema

La arquitectura de observabilidad de Spottruck se organiza en capas, cada una recolectando y procesando tipos específicos de datos telémétricos. Esta segmentación permite scaling independiente de cada componente según el volumen de datos y requisitos de procesamiento.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CAPA DE RECOLECCIÓN (Collection Layer)           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │
│  │   ECS Tasks   │  │  EC2/Bastion  │  │  IoT Devices  │           │
│  │   (Fargate)   │  │   (On-Prem)   │  │    (Trucks)   │           │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘           │
│          │                  │                  │                    │
│          │          ┌───────┴───────┐          │                    │
│          └──────────┤  FireLens      ├──────────┘                    │
│                       (ECS Log Router)                               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                   CAPA DE AGREGACIÓN (Aggregation Layer)               │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│  │   CloudWatch    │  │    Datadog      │  │   Prometheus     │       │
│  │   Logs (JSON)   │  │   APM Agent     │  │   (Metrics)      │       │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘       │
│           │                    │                    │                 │
└───────────┼────────────────────┼────────────────────┼─────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    CAPA DE ALMACENAMIENTO (Storage Layer)              │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│  │ CloudWatch      │  │  Datadog        │  │  Prometheus     │       │
│  │ Logs (S3)       │  │  (Hostified)    │  │  TSDB (S3)      │       │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘       │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │              Elasticsearch / OpenSearch (Log Analysis)          │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    CAPA DE VISUALIZACIÓN (Visualization Layer)          │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│  │ CloudWatch      │  │    Datadog      │  │     Grafana     │       │
│  │ Dashboards      │  │   Dashboards    │  │   (Prometheus)  │       │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘       │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                   AlertManager (Alerting)                        │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

### Flujo de Datos de Observabilidad

El flujo de datos de observabilidad sigue una ruta optimizada para minimizar latencia de procesamiento mientras garantiza durability. Los logs de aplicaciones ECS se envían a través de FireLens directamente a CloudWatch Logs y a un bucket de S3 para archival a largo plazo. Los metrics de Prometheus se scraping mediante AWS Managed Service for Prometheus, y los traces de Datadog se envían directamente al agent de Datadog que corre como sidecar container.

---

## Amazon CloudWatch

### Configuración de Logs

CloudWatch Logs sirve como el repositorio central de logs para todos los servicios de Spottruck. La configuración optimiza la ingesta mediante filtros de suscripción y compresión, mientras mantiene los logs accesibles para querying y análisis en tiempo real.

```yaml
logGroups:
  # Log Group para ECS Tasks - Aplicaciones
  - logGroupName: /ecs/spottruck/api-gateway
    retentionInDays: 30
    kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/spottruck-logs-key"
    tags:
      Application: spottruck
      Service: api-gateway
      Environment: production
    logInsightsQueries:
      - name: error-rate-by-minute
        query: |
          fields @timestamp, @message
          | filter @message like /ERROR/
          | stats count(*) as errorCount by bin(1m) as time
          | sort time desc
      
      - name: slow-requests
        query: |
          fields @timestamp, latency, path, statusCode
          | filter latency > 1000
          | sort latency desc
          | limit 20
      
      - name: gps-events-per-minute
        query: |
          fields @timestamp, eventType, truckId
          | filter eventType = "GPS_UPDATE"
          | stats count(*) as gpsEvents by bin(1m) as time
          | sort time desc

  # Log Group para ECS Tasks - Servicios
  - logGroupName: /ecs/spottruck/gps-processor
    retentionInDays: 14
    kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/spottruck-logs-key"
  
  - logGroupName: /ecs/spottruck/notification-service
    retentionInDays: 30
    kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/spottruck-logs-key"
  
  - logGroupName: /ecs/spottruck/reporting-service
    retentionInDays: 90
    kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/spottruck-logs-key"

  # Log Group para RDS
  - logGroupName: /aws/rds/instance/spottruck-postgres
    retentionInDays: 30
    kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/spottruck-logs-key"
    aws/services/rds: true

  # Log Group para ElastiCache Redis
  - logGroupName: /aws/elasticache/spottruck/redis
    retentionInDays: 14
    kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/spottruck-logs-key"

  # Log Group para ALB Access Logs
  - logGroupName: /aws alb/spottruck-alb
    retentionInDays: 90
    kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/spottruck-logs-key"

  # Log Group para CloudFront
  - logGroupName: /aws/cloudfront/spottruck
    retentionInDays: 90
    kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/spottruck-logs-key"
```

### Métricas Personalizadas

Além das métricas padrão do CloudWatch, Spottruck implementa métricas custom que capturam KPIs específicos do negócio e da aplicação.

```json
{
  "namespace": "Spottruck/Custom",
  "metrics": [
    {
      "metricName": "ActiveTrucks",
      "dimensions": {
        "FleetId": "spottruck-primary"
      },
      "unit": "Count",
      "period": 60
    },
    {
      "metricName": "GPSEventsProcessed",
      "dimensions": {
        "Service": "gps-processor"
      },
      "unit": "Count",
      "period": 60
    },
    {
      "metricName": "AverageRouteCalculationTime",
      "dimensions": {
        "Service": "route-optimizer"
      },
      "unit": "Milliseconds",
      "period": 60
    },
    {
      "metricName": "FuelTransactionsProcessed",
      "dimensions": {
        "Service": "fuel-service"
      },
      "unit": "Count",
      "period": 60
    },
    {
      "metricName": "MaintenanceAlertsGenerated",
      "dimensions": {
        "Service": "maintenance-service"
      },
      "unit": "Count",
      "period": 60
    },
    {
      "metricName": "APILatencyP99",
      "dimensions": {
        "Service": "api-gateway",
        "Endpoint": "all"
      },
      "unit": "Milliseconds",
      "period": 60
    },
    {
      "metricName": "WebSocketConnections",
      "dimensions": {
        "Service": "realtime-service"
      },
      "unit": "Count",
      "period": 60
    },
    {
      "metricName": "QueueDepth",
      "dimensions": {
        "Queue": "spottruck-gps-location-process"
      },
      "unit": "Count",
      "period": 60
    }
  ]
}
```

### Alarmas de CloudWatch

Las alarmos de CloudWatch proporcionan detección proactiva de problemas antes de que impacten usuarios. Se definen umbrais precisos con configuraciones de anotación y escalamiento.

```yaml
alarms:
  # Alarms de Alta Prioridad
  - alarmName: spottruck-api-high-error-rate
    alarmDescription: API error rate exceeds 5% for 2 consecutive minutes
    namespace: AWS/ApplicationELB
    metricName: HTTPCode_Target_5XX_Count
    statistic: Sum
    period: 60
    evaluationPeriods: 2
    threshold: 5
    comparisonOperator: GreaterThanThreshold
    treatMissingData: notBreaching
    actions:
      - arn:aws:sns:us-east-1:123456789012:spottruck-alerts-critical
      - arn:aws:automations:us-east-1:123456789012:automation/spottruck-auto-remediation
    tags:
      severity: critical
      team: ops

  - alarmName: spottruck-rds-cpu-high
    alarmDescription: RDS CPU utilization exceeds 90% for 5 minutes
    namespace: AWS/RDS
    metricName: CPUUtilization
    dbInstanceIdentifier: spottruck-postgres-primary
    statistic: Average
    period: 60
    evaluationPeriods: 5
    threshold: 90
    comparisonOperator: GreaterThanThreshold
    actions:
      - arn:aws:sns:us-east-1:123456789012:spottruck-alerts-warning
    tags:
      severity: warning
      team: dba

  - alarmName: spottruck-rds-connections-high
    alarmDescription: RDS connections exceed 80% of max_connections
    namespace: AWS/RDS
    metricName: DatabaseConnections
    dbInstanceIdentifier: spottruck-postgres-primary
    statistic: Average
    period: 60
    evaluationPeriods: 3
    threshold: 400
    comparisonOperator: GreaterThanThreshold
    actions:
      - arn:aws:sns:us-east-1:123456789012:spottruck-alerts-warning
    tags:
      severity: warning
      team: dba

  - alarmName: spottruck-redis-cpu-high
    alarmDescription: ElastiCache CPU exceeds 75%
    namespace: AWS/ElastiCache
    metricName: CPUUtilization
    replicationGroupId: spottruck-redis-cluster
    statistic: Average
    period: 60
    evaluationPeriods: 5
    threshold: 75
    comparisonOperator: GreaterThanThreshold
    actions:
      - arn:aws:sns:us-east-1:123456789012:spottruck-alerts-warning
    tags:
      severity: warning
      team: ops

  - alarmName: spottruck-ecs-memory-high
    alarmDescription: ECS service memory utilization exceeds 85%
    namespace: ECS/ContainerInsights
    metricName: MemoryUtilization
    ClusterName: spottruck-production
    ServiceName: spottruck-api-gateway
    statistic: Average
    period: 60
    evaluationPeriods: 3
    threshold: 85
    comparisonOperator: GreaterThanThreshold
    actions:
      - arn:aws:sns:us-east-1:123456789012:spottruck-alerts-warning
    tags:
      severity: warning
      team: ops

  # Alarms de Disponibilidad
  - alarmName: spottruck-availability-check
    alarmDescription: Health check failed for 3 consecutive periods
    namespace: AWS/Route53
    metricName: HealthCheckStatus
    healthCheckId: "abc123-def456"
    statistic: Minimum
    period: 60
    evaluationPeriods: 3
    threshold: 1
    comparisonOperator: LessThanThreshold
    actions:
      - arn:aws:sns:us-east-1:123456789012:spottruck-alerts-critical
    tags:
      severity: critical
      team: ops

  - alarmName: spottruck-queue-depth-critical
    alarmDescription: SQS queue depth exceeds 10000 messages
    namespace: AWS/SQS
    metricName: ApproximateNumberOfMessagesVisible
    QueueName: spottruck-gps-location-process
    statistic: Average
    period: 300
    evaluationPeriods: 1
    threshold: 10000
    comparisonOperator: GreaterThanThreshold
    actions:
      - arn:aws:sns:us-east-1:123456789012:spottruck-alerts-warning
    tags:
      severity: warning
      team: ops

  # Alarms de Negocio
  - alarmName: spottruck-gps-events-dropped
    alarmDescription: GPS events processing lag exceeds threshold
    namespace: Spottruck/Custom
    metricName: GPSEventsDropped
    statistic: Sum
    period: 300
    evaluationPeriods: 1
    threshold: 100
    comparisonOperator: GreaterThanThreshold
    actions:
      - arn:aws:sns:us-east-1:123456789012:spottruck-alerts-warning
    tags:
      severity: warning
      team: data
```

---

## Amazon CloudWatch Dashboards

### Dashboard Principal de Operaciones

El dashboard principal consolidate métricas clave para el equipo de operaciones, con widgets que muestran salud del sistema, rendimiento, y eventos en tiempo real.

```json
{
  "dashboardName": "spottruck-operations-main",
  "widgets": [
    {
      "type": "metric",
      "x": 0,
      "y": 0,
      "width": 24,
      "height": 6,
      "properties": {
        "title": "API Gateway - Requests and Errors",
        "metrics": [
          ["AWS/ApplicationELB", "RequestCount", { "stat": "Sum", "period": 60 }],
          [".", "HTTPCode_Target_5XX_Count", { "stat": "Sum", "period": 60, "label": "5XX Errors" }],
          [".", "HTTPCode_Target_4XX_Count", { "stat": "Sum", "period": 60, "label": "4XX Errors" }]
        ],
        "period": 60,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "API Gateway - Requests and Errors",
        "yAxis": { "left": { "min": 0 } },
        "liveData": true
      }
    },
    {
      "type": "metric",
      "x": 24,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "title": "ECS CPU and Memory",
        "metrics": [
          ["ECS/ContainerInsights", "CpuUtilized", { "ClusterName": "spottruck-production", "ServiceName": "spottruck-api-gateway" }],
          [".", "MemoryUtilized", { "ClusterName": "spottruck-production", "ServiceName": "spottruck-api-gateway" }]
        ],
        "period": 60,
        "stat": "Average",
        "region": "us-east-1",
        "title": "ECS CPU and Memory",
        "yAxis": { "left": { "min": 0 } }
      }
    },
    {
      "type": "metric",
      "x": 36,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "title": "RDS Performance",
        "metrics": [
          ["AWS/RDS", "CPUUtilization", { "DBInstanceIdentifier": "spottruck-postgres-primary" }],
          [".", "DatabaseConnections", { "DBInstanceIdentifier": "spottruck-postgres-primary" }],
          [".", "WriteIOPS", { "DBInstanceIdentifier": "spottruck-postgres-primary" }]
        ],
        "period": 60,
        "stat": "Average",
        "region": "us-east-1",
        "title": "RDS Performance"
      }
    },
    {
      "type": "log",
      "x": 0,
      "y": 6,
      "width": 24,
      "height": 12,
      "properties": {
        "title": "Recent Error Logs",
        "query": "SOURCE '/ecs/spottruck/api-gateway' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20",
        "region": "us-east-1",
        "title": "Recent Error Logs"
      }
    },
    {
      "type": "metric",
      "x": 24,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "title": "GPS Events Processing",
        "metrics": [
          ["Spottruck/Custom", "GPSEventsProcessed", { "stat": "Sum" }]
        ],
        "period": 60,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "GPS Events Processing"
      }
    },
    {
      "type": "metric",
      "x": 36,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "title": "Active Trucks",
        "metrics": [
          ["Spottruck/Custom", "ActiveTrucks", { "FleetId": "spottruck-primary" }]
        ],
        "period": 60,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Active Trucks"
      }
    }
  ]
}
```

### Dashboard de Negocio

El dashboard de negocio muestra KPIs operacionales para el equipo de management, incluyendo métricas de flota, uso de servicios, y tendencias.

```json
{
  "dashboardName": "spottruck-business-kpis",
  "widgets": [
    {
      "type": "metric",
      "x": 0,
      "y": 0,
      "width": 6,
      "height": 4,
      "properties": {
        "title": "Flota Activa",
        "metrics": [
          ["Spottruck/Custom", "ActiveTrucks", { "FleetId": "spottruck-primary" }]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Flota Activa",
        "signValue": true
      }
    },
    {
      "type": "metric",
      "x": 6,
      "y": 0,
      "width": 6,
      "height": 4,
      "properties": {
        "title": "Viajes Hoy",
        "metrics": [
          ["Spottruck/Custom", "TripsCompleted", { "stat": "Sum" }]
        ],
        "period": 86400,
        "stat": "Sum",
        "region": "us-east-1"
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 0,
      "width": 6,
      "height": 4,
      "properties": {
        "title": "Combustible Procesado (galones)",
        "metrics": [
          ["Spottruck/Custom", "FuelGallonsProcessed", { "stat": "Sum" }]
        ],
        "period": 86400,
        "stat": "Sum",
        "region": "us-east-1"
      }
    },
    {
      "type": "metric",
      "x": 18,
      "y": 0,
      "width": 6,
      "height": 4,
      "properties": {
        "title": "Alertas Mantenimiento",
        "metrics": [
          ["Spottruck/Custom", "MaintenanceAlertsGenerated", { "stat": "Sum" }]
        ],
        "period": 86400,
        "stat": "Sum",
        "region": "us-east-1"
      }
    },
    {
      "type": "metric",
      "x": 0,
      "y": 4,
      "width": 12,
      "height": 8,
      "properties": {
        "title": "Tendência de Eventos GPS (últimos 7 dias)",
        "metrics": [
          ["Spottruck/Custom", "GPSEventsProcessed", { "stat": "Sum", "period": 3600 }]
        ],
        "period": 3600,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "GPS Events Trend",
        "annotations": {
          "vertical": []
        }
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 4,
      "width": 12,
      "height": 8,
      "properties": {
        "title": "Uso de API por Endpoint",
        "metrics": [
          ["AWS/ApplicationELB", "RequestCount", { "LoadBalancer": "app/spottruck-alb", "TargetGroup": "spottruck-tg-1" }],
          [".", "RequestCount", { "LoadBalancer": "app/spottruck-alb", "TargetGroup": "spottruck-tg-2" }]
        ],
        "period": 3600,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "API Usage by Endpoint"
      }
    }
  ]
}
```

---

## Datadog APM y Monitoreo Avanzado

### Configuración del Agent

Datadog proporciona Application Performance Monitoring (APM) para Spottruck, capturando traces distribuidas a través de todos los microservicios, profiling continuo de aplicaciones, y dashboard personalizados para análisis de rendimiento.

```yaml
datadogConfiguration:
  # Agent como Sidecar en ECS
  containerDefinitions:
    - name: datadog-agent
      image: gcr.io/datadoghq/agent:7
      essential: false
      environment:
        - name: DD_API_KEY
          valueFrom:
            secretName: spottruck-datadog-api-key
            secretKey: api-key
        - name: DD_SITE
          value: datadoghq.com
        - name: DD_APM_ENABLED
          value: "true"
        - name: DD_APM_NON_LOCAL_TRAFFIC
          value: "true"
        - name: DD_ECS_METADATA_TAGS
          value: "true"
        - name: DDLogs_ENABLED
          value: "true"
        - name: DDLogs_CONFIG_CONTAINER_COLLECT_ALL
          value: "true"
        - name: DD_CONTAINER_EXCLUDE
          value: "name:datadog-agent"
        - name: DD_PROCESS_AGENT_ENABLED
          value: "simple"
        - name: DD_DOGSTATSD_ENABLED
          value: "true"
        - name: DD_DOGSTATSD_NON_LOCAL_TRAFFIC
          value: "true"
      resources:
        limits:
          cpu: 256
          memory: 512
        reservations:
          cpu: 128
          memory: 256
      logConfiguration:
        logDriver: awslogs
        options:
          awslogs-group: /ecs/spottruck/datadog-agent
          awslogs-region: us-east-1
          awslogs-stream-prefix: agent

  # Configuración de APM en servicios
  apmConfiguration:
    spottruckApiGateway:
      DD_SERVICE: spottruck-api-gateway
      DD_VERSION: "1.0.0"
      DD_ENV: production
      DD_AGENT_HOST: localhost
      DD_TRACE_AGENT_PORT: 8126
      LD_PRELOAD: /opt/datadog/dd-lib/initializer.so
      
      instrumentation:
        enabled: true
        library: nodejs
        version: "5.x"
      
      automaticInstrumentation:
        enabled: true
        config:
          traceQueryString: true
          collapseTopLevel: true
      
      runtimeMetrics:
        enabled: true
      
      profiling:
        enabled: true
        runtime: nodejs

    spottruckGpsProcessor:
      DD_SERVICE: spottruck-gps-processor
      DD_VERSION: "1.0.0"
      DD_ENV: production
```

### Dashboards de Datadog

Datadog proporciona dashboards avanzados para análisis de rendimiento de aplicaciones, incluyendo flame graphs para identificación de cuellos de botella, traces distribuidas, y dashboards de infraestructura.

```json
{
  "dashboards": [
    {
      "name": "Spottruck - APM Overview",
      "description": "Application Performance Monitoring overview for Spottruck microservices",
      "widgets": [
        {
          "definition": {
            "title": "Request Latency P50, P95, P99",
            "type": "timeseries",
            "requests": [
              {
                "q": "p50:trace.api.request {service:spottruck-api-gateway}",
                "style": { "color": "#00BFFF" }
              },
              {
                "q": "p95:trace.api.request {service:spottruck-api-gateway}",
                "style": { "color": "#FFA500" }
              },
              {
                "q": "p99:trace.api.request {service:spottruck-api-gateway}",
                "style": { "color": "#FF0000" }
              }
            ],
            "yaxis": { "unit": "millisecond" }
          }
        },
        {
          "definition": {
            "title": "Error Rate by Service",
            "type": "timeseries",
            "requests": [
              {
                "q": "sum:trace.api.errors {service:spottruck-api-gateway}.as_rate()",
                "breakdown": true
              }
            ]
          }
        },
        {
          "definition": {
            "title": "Top Endpoints by Latency",
            "type": "toplist",
            "requests": [
              {
                "q": "top(avg:trace.api.request {service:spottruck-api-gateway} by {resource_name}, 10, 'desc', 'avg')"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

---

## Prometheus y Grafana

### Configuración de Prometheus

AWS Managed Service for Prometheus coleta métricas de los servicios de Spottruck, proporcionando un sistema de monitoreo escalable y de bajo costo para métricas de contenedores y aplicaciones.

```yaml
ampConfiguration:
  workspace:
    alias: spottruck-prometheus
    logLevel: info
    
  scrapeConfigs:
    - jobName: spottruck-ecs-metrics
      ecs_sd_configs:
        - region: us-east-1
          cluster_name: spottruck-production
          service_name: spottruck-*
          new_target_config:
            metrics_path: /metrics
            scrape_interval: 15s
            scrape_timeout: 10s
      
      relabel_configs:
        - source_labels: [__meta_ecs_service_name]
          regex: spottruck-(.+)
          target_label: service
        - source_labels: [__meta_ecs_cluster_name]
          target_label: cluster
        - source_labels: [__meta_ecs_task_arn]
          target_label: task_id
    
    - jobName: node-exporter
      static_configs:
        - targets:
            - "node-exporter:9100"
      metric_relabel_configs:
        - source_labels: [instance]
          regex: "(.+):.*"
          target_label: host
    
    - jobName: blackbox-exporter
      metrics_path: /probe
      static_configs:
        - targets:
            - "https://api.spottruck.com/health"
      relabel_configs:
        - source_labels: [__address__]
          target_label: __param_target
        - source_labels: [__param_target]
          target_label: instance
        - target_label: __address__
          replacement: "blackbox-exporter:9115"
```

### Grafana Dashboards

Grafana proporciona visualizaciones avanzadas para métricas de infraestructura y aplicación, con alerts integrados.

```json
{
  "dashboards": [
    {
      "uid": "spottruck-infra",
      "title": "Spottruck - Infrastructure Overview",
      "tags": ["spottruck", "infrastructure"],
      "timezone": "browser",
      "panels": [
        {
          "id": 1,
          "title": "CPU Usage by Service",
          "type": "graph",
          "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
          "targets": [
            {
              "expr": "sum(rate(container_cpu_usage_seconds_total{cluster=\"spottruck-production\"}[5m])) by (service)",
              "legendFormat": "{{service}}"
            }
          ],
          "yaxes": [
            { "format": "percentunit", "min": 0 },
            { "format": "short" }
          ]
        },
        {
          "id": 2,
          "title": "Memory Usage by Service",
          "type": "graph",
          "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 },
          "targets": [
            {
              "expr": "sum(container_memory_usage_bytes{cluster=\"spottruck-production\"}) by (service) / 1024 / 1024 / 1024",
              "legendFormat": "{{service}}"
            }
          ],
          "yaxes": [
            { "format": "bytes", "min": 0 },
            { "format": "short" }
          ]
        },
        {
          "id": 3,
          "title": "Network I/O by Service",
          "type": "graph",
          "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 },
          "targets": [
            {
              "expr": "sum(rate(container_network_receive_bytes_total{cluster=\"spottruck-production\"}[5m])) by (service)",
              "legendFormat": "{{service}} - RX"
            },
            {
              "expr": "sum(rate(container_network_transmit_bytes_total{cluster=\"spottruck-production\"}[5m])) by (service)",
              "legendFormat": "{{service}} - TX"
            }
          ],
          "yaxes": [
            { "format": "Bps", "min": 0 },
            { "format": "short" }
          ]
        },
        {
          "id": 4,
          "title": "Pod Status",
          "type": "stat",
          "gridPos": { "h": 8, "w": 6, "x": 12, "y": 8 },
          "targets": [
            {
              "expr": "sum(kube_pod_status_phase{cluster=\"spottruck-production\"}) by (phase)",
              "legendFormat": "{{phase}}"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Logging Estructurado

### Formato de Logs

Todos los servicios de Spottruck utilizan un formato de log estructurado en JSON que facilita el análisis y la correlación entre servicios.

```typescript
// Log format structure used by all Spottruck services
interface SpottruckLogEntry {
  // Timestamp
  timestamp: string; // ISO 8601 format: "2026-06-04T10:30:00.000Z"
  
  // Severity
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  
  // Service Information
  service: {
    name: string;      // e.g., "spottruck-api-gateway"
    version: string;    // e.g., "1.2.3"
    environment: string; // e.g., "production"
    region: string;     // e.g., "us-east-1"
    az: string;         // e.g., "us-east-1a"
    instanceId: string; // ECS task ID or pod name
  };
  
  // Request Context (when applicable)
  request?: {
    id: string;        // UUID for request correlation
    traceId: string;   // Distributed trace ID from Datadog
    spanId: string;     // Current span ID
    method: string;     // HTTP method
    path: string;       // Request path
    query: object;     // Query parameters (sanitized)
    headers: object;   // Relevant headers (sanitized)
    clientIp: string;  // Client IP address
    userAgent: string; // Client user agent
  };
  
  // Response Information
  response?: {
    statusCode: number;  // HTTP status code
    latencyMs: number;   // Request duration in milliseconds
    sizeBytes: number;   // Response size
  };
  
  // Business Context
  context?: {
    userId?: string;      // Authenticated user ID
    organizationId?: string; // Organization ID
    fleetId?: string;      // Fleet ID (for fleet-specific operations)
    truckId?: string;      // Truck ID (for GPS events)
    tripId?: string;       // Trip ID (for trip-related logs)
    driverId?: string;     // Driver ID
  };
  
  // Event Information
  event: {
    type: string;         // Event type identifier
    category: string;     // Event category (e.g., "gps", "auth", "api")
    action: string;       // Action performed
    data?: object;        // Additional event data
  };
  
  // Error Information (when level is ERROR or CRITICAL)
  error?: {
    name: string;          // Error class name
    message: string;       // Error message
    stack?: string;        // Stack trace (production: truncated)
    code?: string;         // Application error code
    details?: object;      // Additional error context
  };
  
  // System Information
  system: {
    pid: number;           // Process ID
    uptime: number;        // Process uptime in seconds
    memoryUsage: {
      heapUsed: number;    // Heap memory used (bytes)
      heapTotal: number;   // Total heap memory (bytes)
      external: number;    // External memory (bytes)
      rss: number;         // Resident set size (bytes)
    };
    cpuUsage?: number;     // CPU usage percentage
  };
  
  // Metadata
  metadata: {
    deploymentId?: string;    // Deployment identifier
    buildVersion?: string;     // Build version
    gitCommit?: string;        // Git commit SHA
    kubernetesNamespace?: string;
    [key: string]: any;        // Additional custom metadata
  };
}
```

### Ejemplo de Log Entry

```json
{
  "timestamp": "2026-06-04T14:32:15.847Z",
  "level": "INFO",
  "service": {
    "name": "spottruck-api-gateway",
    "version": "2.1.0",
    "environment": "production",
    "region": "us-east-1",
    "az": "us-east-1a",
    "instanceId": "ecs-abc123-def456"
  },
  "request": {
    "id": "req-550e8400-e29b-41d4-a716-446655440000",
    "traceId": "abc123def456789",
    "spanId": "span-xyz789",
    "method": "POST",
    "path": "/api/v1/gps/location",
    "query": {},
    "headers": {
      "content-type": "application/json",
      "authorization": "[REDACTED]"
    },
    "clientIp": "203.0.113.42",
    "userAgent": "Spottruck-Device/3.2.1"
  },
  "response": {
    "statusCode": 201,
    "latencyMs": 45,
    "sizeBytes": 256
  },
  "context": {
    "truckId": "truck-SPOT-12345",
    "organizationId": "org-abc789"
  },
  "event": {
    "type": "GPS_LOCATION_RECEIVED",
    "category": "gps",
    "action": "location.create",
    "data": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "speed": 65.5,
      "heading": 180,
      "accuracy": 5.0
    }
  },
  "system": {
    "pid": 1,
    "uptime": 86400,
    "memoryUsage": {
      "heapUsed": 52428800,
      "heapTotal": 134217728,
      "external": 4096000,
      "rss": 104857600
    },
    "cpuUsage": 12.5
  },
  "metadata": {
    "deploymentId": "deploy-xyz123",
    "buildVersion": "2.1.0",
    "gitCommit": "a1b2c3d4e5f6"
  }
}
```

---

## Alerting y Notificaciones

### Arquitectura de Alerting

El sistema de alerting de Spottruck implementa una jerarquía de severidades con escalamiento automático y múltiples canales de notificación. Los alerts se evalúan continuamente mediante CloudWatch y Datadog, con acciones de remediación automatizada para escenarios conocidos.

```yaml
alertingArchitecture:
  severityLevels:
    - name: P1_CRITICAL
      description: Sistema completamente indisponible o pérdida de datos
      responseTime: 5 minutos
      escalationPath:
        - name: PagerDuty
          target: spottruck-oncall
          delay: 0
        - name: Slack #incidents
          target: spottruck-oncall-channel
          delay: 5
        - name: SMS
          target: spottruck-tech-lead
          delay: 15
      autoRemediation: true
      
    - name: P2_HIGH
      description: Degradación significativa de servicio (>50% error rate)
      responseTime: 15 minutos
      escalationPath:
        - name: Slack #alerts
          target: spottruck-ops-channel
          delay: 0
        - name: PagerDuty
          target: spottruck-oncall
          delay: 10
      autoRemediation: true
      
    - name: P3_MEDIUM
      description: Problemas menores o umbrales aproximándose
      responseTime: 1 hora
      escalationPath:
        - name: Slack #alerts
          target: spottruck-ops-channel
          delay: 0
        - name: Email
          target: spottruck-devops@spottruck.com
          delay: 60
      autoRemediation: false
      
    - name: P4_LOW
      description: Información operativa, no requiere acción inmediata
      responseTime: siguiente día hábil
      escalationPath:
        - name: Email
          target: spottruck-daily-summary@spottruck.com
          delay: 1440
      autoRemediation: false

  notificationChannels:
    - name: pagerduty
      type: pagerduty
      integrationKey: "pagerduty-integration-key"
      severityMapping:
        P1_CRITICAL: critical
        P2_HIGH: high
        P3_MEDIUM: warning
        P4_LOW: info
      
    - name: slack-critical
      type: slack
      webhookUrl: "https://hooks.slack.com/services/xxx"
      channel: "#incidents"
      severityLevel: [P1_CRITICAL, P2_HIGH]
      
    - name: slack-alerts
      type: slack
      webhookUrl: "https://hooks.slack.com/services/yyy"
      channel: "#alerts"
      severityLevel: [P2_HIGH, P3_MEDIUM]
      
    - name: email-ops
      type: email
      recipients:
        - spottruck-ops@spottruck.com
      severityLevel: [P3_MEDIUM, P4_LOW]
      
    - name: sms-emergency
      type: sns
      topicArn: "arn:aws:sns:us-east-1:123456789012:spottruck-emergency"
      severityLevel: [P1_CRITICAL]
```

### Playbooks de Respuesta

Cada tipo de alerta tiene un playbook asociado que guía al responder a través del proceso de diagnóstico y remediación.

```yaml
playbooks:
  spottruck-api-high-error-rate:
    description: API error rate exceeds threshold
    severity: P1_CRITICAL
    steps:
      - name: verificar_cloudwatch
        action: Check CloudWatch dashboards for error patterns
        automation: automatic
      
      - name: check_recent_deployments
        action: Review recent deployments in ECS
        automation: manual
      
      - name: analyze_error_logs
        action: Run CloudWatch Insights query for error details
        query: |
          fields @timestamp, @message
          | filter @message like /ERROR/
          | sort @timestamp desc
          | limit 50
      
      - name: check_dependencies
        action: Verify health of downstream services (RDS, Redis, RabbitMQ)
        automation: automatic
      
      - name: scale_if_needed
        action: If CPU/memory exhaustion, scale ECS service
        automation: conditional
      
      - name: rollback_if_deployment
        action: If recent deployment, initiate rollback
        automation: conditional
      
      - name: notify_stakeholders
        action: Update status page and notify stakeholders
        automation: automatic

  spottruck-rds-connections-high:
    description: RDS connections approaching limit
    severity: P2_HIGH
    steps:
      - name: check_connection_sources
        action: Identify which services have most connections
        query: |
          SELECT 
            client_addr, 
            COUNT(*) as connections 
          FROM pg_stat_activity 
          GROUP BY client_addr 
          ORDER BY connections DESC;
      
      - name: identify_idle_connections
        action: Check for long-running idle transactions
        query: |
          SELECT 
            pid, 
            now() - state_change as idle_time,
            state
          FROM pg_stat_activity 
          WHERE state = 'idle'
          AND state_change < now() - interval '10 minutes';
      
      - name: check_pooler_config
        action: Review PgBouncer or RDS Proxy configuration
        automation: manual
      
      - name: scale_connection_pooler
        action: If using PgBouncer, check and adjust pool size
        automation: conditional
      
      - name: schedule_maintenance
        action: If persistent, schedule maintenance window
        automation: manual

  spottruck-gps-events-lag:
    description: GPS event processing is falling behind
    severity: P2_HIGH
    steps:
      - name: check_queue_depth
        action: Check SQS queue depth
        automation: automatic
      
      - name: check_processor_health
        action: Verify GPS processor service is scaling correctly
        automation: automatic
      
      - name: analyze_processing_time
        action: Check CloudWatch for processing latency trends
        automation: manual
      
      - name: scale_processors
        action: If queue depth increasing, scale GPS processor
        automation: conditional
      
      - name: alert_data_team
        action: Notify data team if lag persists > 30 minutes
        automation: automatic
```

---

## Gestión de Logs a Largo Plazo

### Retención y Archival

La estrategia de retención de logs balancea requerimientos de auditoría, análisis de incidentes, y optimización de costos. Los logs recientes se mantienen en CloudWatch Logs para acceso rápido, mientras que logs históricos se archival a S3 para reducción de costos.

```yaml
logRetentionPolicy:
  cloudWatchRetention:
    # Retención corta para logs de alta granularidad
    /ecs/spottruck/gps-processor: 14
    /ecs/spottruck/notification-service: 30
    /ecs/spottruck/api-gateway: 30
    
    # Retención media para logs de negocio
    /ecs/spottruck/reporting-service: 90
    /aws/rds/instance/spottruck-postgres: 30
    /aws/alb/spottruck-alb: 90
    
    # Retención larga para auditoría
    /ecs/spottruck/*/audit: 2555  # 7 años
    
    # Retención por defecto
    default: 30

  s3Archival:
    archivalEnabled: true
    archivalSchedule: "0 2 * * *"  # Daily at 2 AM UTC
    
    bucket: spottruck-logs-archive
    prefixPattern: "cloudwatch/{year}/{month}/{day}/{log_group}/"
    
    compression: gzip
    format: parquet
    
    retention:
      recent: s3-standard-ia  # 0-90 days
      medium: s3-glacier      # 90-365 days
      long: s3-deep-archive   # 365+ days
    
    lifecycleRules:
      - id: transition-to-ia
        days: 90
        storageClass: STANDARD_IA
      - id: transition-to-glacier
        days: 365
        storageClass: GLACIER
      - id: transition-to-deep-archive
        days: 1095
        storageClass: DEEP_ARCHIVE
      - id: expire-old-versions
        days: 2555
        storageClass: DELETE
```

### Indexación y Búsqueda

Para logs que requieren búsqueda y análisis avanzados, se configura un pipeline que envía logs a Elasticsearch (o Amazon OpenSearch Service) con indexação otimizada.

```yaml
logIndexing:
  openSearchCluster:
    clusterName: spottruck-logs
    engineVersion: "OpenSearch_2.11"
    
    nodeConfig:
      instanceType: r6g.large.search
      nodeCount: 3
      dedicatedMasterNodes: true
      warmNodes: true
    
    indexSettings:
      indexPattern: "spottruck-logs-{service}-*"
      numberOfShards: 3
      numberOfReplicas: 1
      
      refreshInterval: "5s"
      
      indexMapping:
        totalFields:
          limit: 2000
      
      analysis:
        analyzer:
          spottruck_analyzer:
            type: custom
            tokenizer: standard
            filter:
              - lowercase
              - stop
    
    ilmPolicy:
      policyName: spottruck-logs-policy
      phases:
        hot:
          minAge: "0ms"
          actions:
            rollover:
              maxSize: "50GB"
              maxAge: "7d"
        warm:
          minAge: "7d"
          actions:
            shrink:
              numberOfShards: 1
            forcemerge:
              maxNumSegments: 1
        cold:
          minAge: "30d"
          actions:
            freeze: {}
        delete:
          minAge: "365d"
          actions:
            delete: {}
    
    securityConfig:
      accessPolicies:
        - principal:
            aws: "arn:aws:iam::123456789012:role/spottruck-logs-reader"
          permission: ["indices:data/read/search"]
        - principal:
            aws: "arn:aws:iam::123456789012:role/spottruck-logs-writer"
          permission: ["indices:data/write/index"]
```

---

## Correlación de Datos de Observabilidad

### Distributed Tracing

Spottruck implementa distributed tracing para correlacionar requests a través de todos los microservicios, permitiendo追踪 completo de una transacción desde el API Gateway hasta la base de datos y servicios downstream.

```typescript
// Trace correlation across services
// Using OpenTelemetry with Datadog exporter

import { NodeSDK } from '@opentelemetry/sdk-node';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis-4';
import { DatadogExporter } from '@opentelemetry/exporter-datadog';

const sdk = new NodeSDK({
  serviceName: 'spottruck-api-gateway',
  serviceVersion: process.env.APP_VERSION,
  instrumentations: [
    new HttpInstrumentation({
      ignoreIncomingPaths: ['/health', '/metrics']
    }),
    new ExpressInstrumentation(),
    new PgInstrumentation({
      enhancedDatabaseReporting: true
    }),
    new RedisInstrumentation()
  ],
  traceExporter: new DatadogExporter({
    agentUrl: 'http://localhost:8126'
  })
});

// Start the SDK
sdk.start();

// Propagate trace context to downstream services
function propagateTraceContext(headers: Record<string, string>) {
  const span = trace.getActiveSpan();
  if (span) {
    const ctx = span.spanContext();
    headers['x-datadog-trace-id'] = ctx.traceId;
    headers['x-datadog-parent-id'] = ctx.spanId;
    headers['x-datadog-sampling-priority'] = '1';
  }
  return headers;
}
```

### Métricas Correlacionadas

La correlación entre métricas, logs y traces permite jump directly from a metric alert to the relevant logs and traces for fast root cause analysis. This integration is achieved through consistent tagging and metadata across all telemetry data.

| Dimensión | Métricas | Logs | Traces |
|-----------|----------|------|--------|
| Service Name | ✅ | ✅ | ✅ |
| Service Version | ✅ | ✅ | ✅ |
| Environment | ✅ | ✅ | ✅ |
| Region/AZ | ✅ | ✅ | ✅ |
| Request ID | ❌ | ✅ | ✅ |
| User ID | ❌ | ✅ | ✅ |
| Truck ID | ❌ | ✅ | ✅ |
| Organization ID | ❌ | ✅ | ✅ |

---

## SLA y SLO Monitoring

### Definición de SLOs

Spottruck define Service Level Objectives (SLOs) que son monitoreados continuamente para garantizar que la plataforma cumple con los acuerdos de nivel de servicio comprometidos con los clientes.

```yaml
slos:
  - name: spottruck-availability
    description: Disponibilidad general de la API de Spottruck
    target: 99.9
    window: 30d
    indicator:
      type: availability
      good:
        filter: http.status_code < 500
        metric: AWS/ApplicationELB RequestCount
      total:
        filter: ""
        metric: AWS/ApplicationELB RequestCount
    alert:
      burnRateThreshold: 10
      window: 1h
      severity: P1

  - name: spottruck-latency-p95
    description: Latencia P95 de requests API
    target: 95
    window: 30d
    indicator:
      type: latency
      threshold: 500
      metric: AWS/ApplicationELB TargetResponseTime
      percentiles: [95]
    alert:
      burnRateThreshold: 10
      window: 5m
      severity: P2

  - name: spottruck-latency-p99
    description: Latencia P99 de requests API
    target: 99
    window: 30d
    indicator:
      type: latency
      threshold: 1000
      metric: AWS/ApplicationELB TargetResponseTime
      percentiles: [99]
    alert:
      burnRateThreshold: 10
      window: 5m
      severity: P2

  - name: spottruck-gps-processing-latency
    description: Latencia de procesamiento de eventos GPS
    target: 99
    window: 30d
    indicator:
      type: latency
      threshold: 5000
      metric: Spottruck/Custom GPSProcessingLatency
      percentiles: [99]
    alert:
      burnRateThreshold: 10
      window: 10m
      severity: P2

  - name: spottruck-data-accuracy
    description: Porcentaje de ubicaciones GPS procesadas correctamente
    target: 99.99
    window: 30d
    indicator:
      type: availability
      good:
        filter: eventStatus = "PROCESSED"
        metric: Spottruck/Custom GPSEventsProcessed
      total:
        filter: ""
        metric: Spottruck/Custom GPSEventsReceived
    alert:
      burnRateThreshold: 10
      window: 15m
      severity: P1
```

---

## Runbooks y Operaciones

### Procedimientos Operacionales Estándar

El equipo de operaciones sigue runbooks documentados para escenarios comunes, garantindo consistencia en la respuesta a incidentes.

```yaml
runbooks:
  on-call-checklist:
    - name: Verify on-call rotation
      frequency: start of shift
      action: Check PagerDuty schedule and confirm acknowledgment
      
    - name: Check system health dashboard
      frequency: start of shift
      action: Review CloudWatch dashboard for any active alarms
      
    - name: Review recent changes
      frequency: start of shift
      action: Check CloudWatch logs for recent deployments or changes
      
    - name: Check queue depths
      frequency: hourly
      action: Verify SQS queues are processing normally
      
    - name: Review error rates
      frequency: hourly
      action: Check CloudWatch for any spikes in error rates
      
    - name: Handoff notes
      frequency: end of shift
      action: Document any ongoing issues or context for next shift

  incident-response:
    - name: Acknowledge incident
      action: Acknowledge in PagerDuty and join incident channel
      
    - name: Assess severity
      action: Determine P1/P2/P3 based on customer impact
      
    - name: Assign incident commander
      action: For P1/P2, assign dedicated incident commander
      
    - name: Communicate status
      action: Post initial status update to #incidents and status page
      
    - name: Investigate
      action: Follow relevant playbook and gather data
      
    - name: Remediate
      action: Execute remediation steps or escalate
      
    - name: Resolve
      action: Confirm resolution and update all stakeholders
      
    - name: Post-mortem
      action: Schedule post-mortem within 48 hours for P1/P2
```

---

## Conclusión

La estrategia de monitoreo y logging de Spottruck proporciona observabilidad completa de la infraestructura y aplicaciones, habilitando detección proactiva de problemas, diagnóstico rápido de incidentes, y mejora continua basada en datos. La combinación de CloudWatch para métricas básicas, Datadog para APM avanzado, Prometheus y Grafana para métricas de infraestructura, y Elasticsearch para análisis de logs, proporciona un stack de observabilidad completo y escalable.

Los SLOs definidos proporcionan visibilidad sobre el cumplimiento de objetivos de servicio, mientras que los runbooks y playbooks documentados garantizan respuesta consistente y eficiente ante incidentes. La estrategia de retención balancea requerimientos de auditoría con optimización de costos, y la correlación de datos de observabilidad permite jump from alerts directly to the relevant logs and traces for fast root cause identification.
