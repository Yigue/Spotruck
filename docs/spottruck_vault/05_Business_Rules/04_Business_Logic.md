---
title: "Spottruck - Logica de Negocio"
date: 2026-06-04
author: Jarvis Agent
status: approved
tags: [business-logic, spottruck, auction, matching, payment, fraud-detection]
---

# Spottruck - Logica de Negocio

Este documento describe los algoritmos y reglas de negocio que rigen el funcionamiento de Spottruck, la plataforma de subastas y logistica para transporte de carga en Argentina. La logica aqui documentada representa las reglas automaticas que el sistema aplica para garantizar operaciones justas, eficientes y trazables.

---

## 1. Algoritmo de Asignacion de Viajes

El proceso de asignacion de viajes es el mecanismo core para el matching entre empresas y conductores despues de que una subasta cierra. Este algoritmo garantiza una distribucion justa y eficiente de los viajes subastados.

### 1.1 Flujo Principal de Asignacion

```
Subasta cierra
     |
     v
+---------------+
| Winner tiene 30min |
| para confirmar     |
+--------+----------+
         |
    +----+----+
    |Confirmo?|
    +----+----+
     Si     No
     |       |
     v       v
Asignar   Offer a 2nd
viaje     highest bidder
          (24h para aceptar)
               |
          +----+----+
          |Acepto?  |
          +----+----+
           Si     No
            |       |
            v       v
        Asignar   Re-auction
        viaje     misma config
```

### 1.2 Algoritmo de Confirmacion Post-Subasta

El siguiente pseudocodigo describe la logica de confirmacion:

1. Cuando la subasta cierra, el ganador recibe una notificacion con 30 minutos para confirmar
2. Si confirma, el viaje se asigna formalmente al conductor
3. Si no confirma o no responde, se ofrece al segundo postor mas alto por 24 horas
4. Si el segundo postor tampoco acepta, se inicia re-subasta con la misma configuracion
5. Este proceso se repite hasta un maximo de 3 veces antes de marcar el viaje como fallido

### 1.3 Estados del Viaje Post-Asignacion

| Estado | Descripcion | Transiciones Posibles |
|--------|-------------|----------------------|
| **ASSIGNED** | Conductor asignado, esperando pickup | IN_PROGRESS, CANCELLED |
| **IN_PROGRESS** | Viaje iniciado, en camino | COMPLETED, DISPUTED |
| **COMPLETED** | Entrega realizada, pendiente de POD | PAYMENT_RELEASED |
| **CANCELLED** | Viaje cancelado | PENALTIES_APPLIED |
| **DISPUTED** | Problema reportado, en revision | RESOLVED, PAYMENT_RELEASED |
| **PAYMENT_RELEASED** | Pago realizado al conductor | (estado final) |

---

## 2. Sistema de Matching (Recomendaciones de Conductores)

El sistema de matching utiliza un algoritmo de score para rankear conductores candidatos cuando una empresa busca transporte. El objetivo es presentar los candidatos mas adecuados basandose en multiples criterios objetivos.

### 2.1 Formula de Score de Matching

El score de matching se calcula utilizando la siguiente formula ponderada:

```
Score_Matching = (0.35 x Score_Reputacion) + 
                 (0.25 x Compatibilidad_Geografica) + 
                 (0.20 x Historico_Cumplimiento) + 
                 (0.10 x Disponibilidad_Camion) + 
                 (0.10 x Calificacion_Empresa)
```

Cada componente se normaliza a un valor entre 0 y 100. La ponderacion refleja las prioridades del negocio: reputacion y ubicacion geografica son los factores mas determinantes, mientras que la disponibilidad del camion y la calificacion de la empresa complementan la evaluacion.

### 2.2 Implementacion del Algoritmo de Matching

El algoritmo de matching procesa multiples factores para generar una lista ordenada de candidatos:

**Factor de Reputacion (35%)**: Se considera el rating promedio del conductor y el numero total de viajes completados. Conductores con muchos viajes y alto rating reciben scores cercanos al maximo. Conductores nuevos reciben un factor de descuento del 20% para compensar la falta de historial.

**Factor Geografico (25%)**: Se calcula la distancia entre la ubicacion actual del conductor y el punto de origen del viaje. Distancias menores a 50km obtienen 100 puntos, mientras que distancias mayores a 500km obtienen un minimo de 40 puntos.

**Factor de Cumplimiento (20%)**: Se evalua la tasa de completacion de viajes versus la tasa de cancelacion. Un conductor con 95% de completacion y menos de 5% de cancelaciones recibe el score maximo.

**Factor de Disponibilidad (10%)**: Se verifica que el conductor tenga al menos un camion disponible que cumpla con los requisitos del viaje en terminos de capacidad de peso y caracteristicas especiales.

**Factor de Calificacion Empresarial (10%)**: Se considera la calificacion promedio que el conductor ha recibido de las empresas con las que ha trabajado.

### 2.3 Criterios de Elegibilidad para Matching

Para ser incluido en los resultados de matching, un conductor debe cumplir con todos los siguientes criterios:

| Criterio | Requisito | Verificacion |
|----------|-----------|--------------|
| Estado de cuenta | ACTIVE o PROBATION | Sistema |
| Licencia valida | No vencida, categorias apropiadas | MTC verificado |
| Score minimo | >= 40 puntos sobre 100 | Algoritmo de matching |
| Historial de viajes | >= 5 viajes completados | Plataforma |
| Camion disponible | Camion propio o lease activo | Registro de flota |
| Certificaciones vigentes | Segun tipo de carga | MTC o autoridad pertinente |
| No suspendido | Sin suspension activa | Sistema de penalidades |

### 2.4 Flowchart del Sistema de Recomendaciones

```
Empresa realiza busqueda
          |
          v
+---------------------+
|Filtrar por criterios|
|basicos (zona, tipo) |
+--------+------------+
         |
+--------+------------+
|Calcular score para  |
|cada candidato       |
+--------+------------+
         |
+--------+------------+
|Ordenar por score    |
|descendente          |
+--------+------------+
         |
+--------+------------+
|Top 10 resultados    |
|presentados          |
+---------------------+
```

---

## 3. Sistema de Recomendaciones de Precio

El sistema de pricing recommendations ayuda a las empresas a establecer precios de base apropiados para sus subastas, reduciendo la probabilidad de subastas fallidas por precios irreales.

### 3.1 Algoritmo de Calculo de Precios de Referencia

El precio de referencia se calcula utilizando multiples fuentes de datos:

1. **Promedio Historico**: Se consultan los ultimos 90 dias de viajes en la misma ruta y tipo de carga
2. **Indice de Mercado**: Factor que refleja las condiciones actuales del mercado de transporte
3. **Ajuste por Combustible**: Factor que actualiza el precio base segun las variaciones en el costo del combustible
4. **Factor Estacional**: Ajustes por demanda saisonal (enero, diciembre con precios mas altos)

El precio recomendado se calcula como:
```
Precio_Base = Promedio_Historico x Indice_Mercado
Precio_Ajustado = Precio_Base x Factor_Combustible x Factor_Estacional
```

### 3.2 Presentacion de Precios Recomendados

El sistema presenta los precios de manera clara y explicativa:

| Componente | Descripcion |
|-----------|-------------|
| **Precio Recomendado** | Precio optimo basado en analisis de mercado |
| **Rango Minimo** | Precio mas bajo viable para atraer postores (80% del recomendado) |
| **Rango Maximo** | Precio maximo antes de reducir competitividad (130% del recomendado) |
| **Nivel de Confianza** | Basado en cantidad de datos historicos disponibles |
| **Factores considerados** | Desglose de componentes que influyeron en el calculo |

### 3.3 Niveles de Confianza

El sistema de precios tiene niveles de confianza basados en la cantidad de datos disponibles:

| Datos Historicos | Confianza | Comportamiento |
|-----------------|-----------|----------------|
| < 5 viajes | BAJA | Sugiere verificar con fuentes externas |
| 5-20 viajes | MEDIA | Usa promedio con rango amplio |
| 20-50 viajes | ALTA | Usa mediana con rango moderado |
| > 50 viajes | MUY ALTA | Usa mediana con rango estrecho |

---

## 4. Asignacion Conductor-Camion

Una vez asignado un viaje, el sistema debe asociar un camion especifico al conductor para ese viaje. Esta logica garantiza trazabilidad y disponibilidad correcta de flota.

### 4.1 Logica de Disponibilidad de Camiones

El sistema de asignacion conductor-camion sigue esta logica:

1. **Verificar flota del conductor**: Se listan todos los camiones asociados al conductor seleccionado
2. **Filtrar por disponibilidad**: Se eliminan camiones en mantenimiento, ocupados en otro viaje, o con mantenimiento programado proximo
3. **Verificar requisitos del viaje**: Se confirma que el camion cumple con capacidad de peso, caracteristicas especiales, y tipo de carga permitido
4. **Seleccionar mejor opcion**: Se rankean los candidatos segun score de mantencion, afinidad de capacidad, y caracteristicas matching

Si no hay camiones disponibles que cumplan los requisitos, el sistema genera una excepcion que debe ser resuelta manualmente por el equipo de soporte.

### 4.2 Criterios de Seleccion de Camion

| Criterio | Peso | Descripcion |
|----------|------|-------------|
| Score de mantencion | 40% | Estado mecanico y antiguedad del camion |
| Afinidad de capacidad | 30% | Que tan bien Matchea la capacidad del camion con la carga |
| Features matching | 30% | Coincidencia de caracteristicas especiales requeridas |

### 4.3 Flowchart de Asignacion Conductor-Camion

```
Trip asignado
          |
          v
+---------------------+
|Driver tiene trucks? |
+--------+------------+
            No    Si
             |     |
             |     v
             |  +------------------+
             |  |Filtrar por       |
             |  |disponibilidad    |
             |  +--------+---------+
             |            |
             |   +--------+--------+
             |   |Hay disponibles?  |
             |   +--------+--------+
             |        No    Si
             |         |     |
             |         |     v
             |         |  +-----------------+
             |         |  |Cumple requisitos? |
             |         |  +--------+---------+
             |         |      No    Si
             |         |       |     |
             |         |       |     v
             |         |       |  Seleccionar mejor
             |         |       |  (score + features)
             |         |       |     |
             v         v       |     v
      Error: No      Error:    |  Asignar
      trucks        No cumple  |  Truck -> Trip
```

---

## 5. Logica de Liberacion de Pago

El sistema de pagos esta disenado para proteger tanto a la empresa que paga como al conductor que entrega el servicio. La liberacion del pago ocurre unicamente despues de verificacion completa de la entrega.

### 5.1 Proof of Delivery (POD)

El POD (Proof of Delivery) es el conjunto de evidencia que certifica que la carga fue entregada exitosamente. Los componentes obligatorios del POD son:

| Componente | Descripcion | Requerido |
|------------|-------------|-----------|
| **Recibo firmado** | Firma del representante de la empresa | Si |
| **Foto de entrega** | Imagen de la carga entregada en destino | Si |
| **Sello de empresa** | Sellos oficiales de recepcion | Si |
| **Timestamp** | Fecha y hora exacta de entrega | Si |
| **Cantidad recibida** | Concordancia con lo declarado | Si |
| **Condicion de empaque** | Estado de la mercancia | Recomendado |
| **Danos documentados** | Evidencia de danos si aplica | Si hay danos |

### 5.2 Proceso de Verificacion POD

1. **Recepcion**: El conductor sube los documentos de POD a traves de la app
2. **Validacion automatica**: El sistema verifica que todos los campos requeridos esten presentes
3. **Verificacion de imagenes**: Se validan las fotos (no borrosas, con timestamp visible)
4. **Notificacion a empresa**: La empresa recibe notificacion y tiene 48 horas para verificar
5. **Decision de empresa**: La empresa puede aceptar o rechazar el POD con理由
6. **Liberacion o dispute**: Segun la decision, se programa el pago o se abre un dispute

### 5.3 Flujo de Liberacion de Pago

```
Viaje completado
          |
          v
+---------------------+
|Conductor sube POD   |
|(firma + fotos)       |
+--------+------------+
         |
+--------+------------+
|POD valido y completo?|
+--------+------------+
           No    Si
            |     |
            v     |
   Solicitar       |
   docs extra      |
            |     |
            |     v
            |  +------------------+
            |  |Empresa tiene 48h  |
            |  |para verificar     |
            |  +---------+--------+
            |            |
            |   +--------+--------+
            |   |Empresa rechazo? |
            |   +--------+--------+
            |        No    Si
            |         |     |
            |         |     v
            |         | 进入 Dispute
            |         |     |
            |         |     v
            +---------+--------+
                   |
                   v
    +---------------------+
    |Pago programado      |
    |(24-48h post-verif)  |
    +---------------------+
```

### 5.4 Sistema de Dispute de Pago

Cuando una empresa rechaza el POD o reporta problemas con la entrega, se activa el proceso de dispute de pago:

| Fase | Duracion | Responsabilidad |
|------|----------|-----------------|
| Submit dispute | 48h desde rechazo | Empresa |
| Evidence collection | 7 dias | Ambos lados |
| Admin review | 72h | Spottruck |
| Resolution | Variable | Segun complejidad |

El equipo administrativo revisa la evidencia de ambos lados y emite una resolucion que puede favorecer a la empresa (reduccion o no pago), al conductor (pago completo), o ser una solucion parcial (porcentaje segun dano demostrado).

---

## 6. Sistema de Deteccion de Fraude

El modulo de deteccion de fraude utiliza patrones de comportamiento para identificar actividades sospechosas que podrian dañar la integridad de la plataforma.

### 6.1 Metricas de Riesgo y Triggers

| Metrica | Descripcion | Threshold | Accion |
|---------|-------------|-----------|--------|
| **Velocity de pujas** | Numero de pujas por usuario por hora | > 15 pujas/hora | Alertar |
| **Bid sniping** | Pujas en ultimos 2 minutos | > 3 pujas por mismo usuario | Revisar |
| **Patron geografico** | Viajes sin movimiento GPS | > 20% del viaje | Investigar |
| **Precio atipico** | Pujas muy por debajo del mercado | < 60% del precio recomendado | Alertar |
| **Velocidad de completacion** | Viajes completados demasiado rapido | < 50% del tiempo estimado | Audit |

### 6.2 Sistema de Scoring de Riesgo

El motor de deteccion asigna un score de riesgo a cada usuario basado en comportamiento:

- **Score 0-30**: Comportamiento normal, ninguna accion requerida
- **Score 31-50**: Observacion, se activa modo watch
- **Score 51-80**: Revision requerida, equipo de compliance revisa caso
- **Score 81+**: Bloqueo preventivo, usuario temporariamente suspendido pending review

### 6.3 Tipos de Fraude Detectados

1. **Collusion entre usuarios**: Dos o mas usuarios que consistentemente pujan uno contra otro para inflar precios
2. **Shill bidding**: Usuario que puja en sus propias subastas para aumentar el precio final
3. **Ghost auctions**: Cuentas falsas que participan unicamente para crear apariencia de demanda
4. **Fake deliveries**: Conductores que claiman entregas que no ocurrieron
5. **POD fraud**: Manipulacion de documentos de prueba de entrega

---

## 7. Estados Globales del Sistema

El sistema mantiene estados globales que determinan el comportamiento de todos los usuarios y operaciones en la plataforma.

| Estado | Descripcion | Restricciones |
|--------|-------------|---------------|
| **ACTIVE** | Operaciones normales | Ninguna |
| **PROBATION** | Restricciones activas | Limite de trips, deposito requerido |
| **SUSPENDED** | Temporalmente bloqueado | Sin acceso a subastas |
| **BANNED** | Removido permanentemente | Acceso denegado al sistema |

### Tabla de Transiciones de Estado

| Estado Actual | Condicion | Nuevo Estado | Trigger |
|--------------|-----------|--------------|--------|
| ACTIVE | 10+ puntos | PROBATION | PenaltySystem |
| PROBATION | 0 puntos post-decay | ACTIVE | PenaltySystem |
| PROBATION | 31+ puntos | SUSPENDED | PenaltySystem |
| SUSPENDED | Review completa | ACTIVE o BANNED | Admin Decision |
| SUSPENDED | 2da suspension | BANNED | PenaltySystem |
| BANNED | (ninguna) | (final) | N/A |

---

## Resumen de Algoritmos Principales

| Algoritmo | Trigger | Output |
|-----------|---------|--------|
| **Trip Assignment** | Auction close | Trip assigned to driver |
| **Matching** | Company searches | Ranked list of drivers (top 10) |
| **Pricing** | Company creates auction | Suggested price range |
| **Driver-Truck** | Trip assigned | Truck assigned to trip |
| **Route Optimization** | Driver proposes route | Approved/Rejected |
| **Payment Release** | POD uploaded | Payment scheduled or disputed |
| **Insurance Claim** | Damage reported | Claim filed and processed |
| **Fraud Detection** | Periodic / events | Risk score + alerts |

---

*Documento generado para Spottruck v2.0 - Plataforma de subastas y logistica para transporte de carga en Argentina.*
*Version: 1.0 | Ultima actualizacion: 2026-06-04*
