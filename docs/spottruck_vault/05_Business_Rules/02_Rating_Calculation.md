---
title: "Cálculo de Rating - Spottruck"
date: "2026-06-04"
author: "Spottruck Dev Team"
status: "active"
tags:
  - spottruck
  - rating
  - scoring
  - business-rules
  - transportistas
  - empresas
---

# Sistema de Cálculo de Rating — Spottruck

## 1. Introducción

Spottruck implementa un sistema de calificación tipo Elo para evaluar transportistas y empresas dentro de la plataforma de subastas y logística de carga en Argentina. Este documento detalla la arquitectura, fórmulas, factores de peso, decaimiento temporal y seguimiento histórico del sistema de rating.

El rating en Spottruck sirve como métrica central de confianza y calidad, influyendo directamente en la posición en subastas, la visibilidad de perfil y el acceso a beneficios dentro de la plataforma.

---

## 2. Arquitectura del Sistema de Rating

### 2.1 Entidades Calificables

El sistema califica dos tipos de entidades:

| Entidad | Descripción | Peso Base Inicial |
|---------|-------------|-------------------|
| **Transportista** | Chofer o propietario de unidad de transporte | 1000 |
| **Empresa** | Empresa de logística o transportista corporativo | 1000 |

### 2.2 Componentes del Rating

El rating final se compone de cuatro factores ponderados:

```
Rating_final = 0.40 × Factor_Trips + 0.25 × Factor_ResponseTime + 0.20 × Factor_Punctuality + 0.15 × Factor_Communication
```

| Factor | Peso | Descripción |
|--------|------|-------------|
| **Factor_Trips** | 40% | Viajes completados exitosamente |
| **Factor_ResponseTime** | 25% | Tiempo de respuesta a solicitudes |
| **Factor_Punctuality** | 20% | Puntualidad en entregas y recogidas |
| **Factor_Communication** | 15% | Calidad de comunicación |

---

## 3. Factores de Ponderación Detallados

### 3.1 Factor de Viajes Completados (40%)

Este factor mide la cantidad y calidad de viajes completados.

```python
def calculate_trips_factor(trips_data):
    """
    trips_data: {
        completed: int,      # Viajes completados
        cancelled: int,      # Viajes cancelados por el usuario
        disputed: int,       # Viajes con disputas
        rating_given: float  # Calificación promedio recibida (0-5)
    }
    """
    if trips_data.completed == 0:
        return 0.0
    
    # Ratio de completación
    total_attempts = trips_data.completed + trips_data.cancelled + trips_data.disputed
    completion_ratio = trips_data.completed / total_attempts if total_attempts > 0 else 0
    
    # Factor de calidad (normalizado a 0-100)
    quality_score = (trips_data.rating_given / 5.0) * 100
    
    # Viajes recientes pesan más (ventana de 90 días)
    recency_multiplier = calculate_recency_multiplier(trips_data.last_completed_date)
    
    # Score final del factor
    trips_factor = (
        (completion_ratio * 50) +           # Hasta 50 puntos por ratio
        (quality_score * 0.35) +             # Hasta 35 puntos por calidad
        (min(trips_data.completed, 100) * 0.15)  # Hasta 15 puntos por volumen
    ) * recency_multiplier
    
    return min(trips_factor, 100)
```

**Ejemplo Numérico:**

```
Viajes completados: 45
Viajes cancelados: 3
Viajes con disputas: 2
Calificación promedio recibida: 4.2/5.0
Último viaje: hace 15 días

total_attempts = 45 + 3 + 2 = 50
completion_ratio = 45 / 50 = 0.90
quality_score = (4.2 / 5.0) * 100 = 84.0
recency_multiplier = 1.0 (dentro de 90 días)

trips_factor = (0.90 × 50) + (84.0 × 0.35) + (min(45, 100) × 0.15)
             = 45.0 + 29.4 + 6.75
             = 81.15 puntos
```

### 3.2 Factor de Tiempo de Respuesta (25%)

Mide la rapidez con la que el usuario responde a solicitudes de presupuesto o aceptación de viajes.

```python
def calculate_response_time_factor(response_data):
    """
    response_data: {
        avg_response_minutes: float,   # Tiempo promedio de respuesta en minutos
        responses_under_30min: int,     # Respuestas en menos de 30 minutos
        total_requests: int,            # Total de solicitudes recibidas
        last_response_date: datetime
    }
    """
    if response_data.total_requests == 0:
        return 0.0
    
    # Score basado en tiempo promedio (0-100)
    if response_data.avg_response_minutes <= 5:
        time_score = 100
    elif response_data.avg_response_minutes <= 15:
        time_score = 95
    elif response_data.avg_response_minutes <= 30:
        time_score = 85
    elif response_data.avg_response_minutes <= 60:
        time_score = 70
    elif response_data.avg_response_minutes <= 120:
        time_score = 50
    else:
        time_score = max(20, 100 - response_data.avg_response_minutes / 3)
    
    # Ratio de respuesta (porcentaje de solicitudes respondidas)
    response_ratio = response_data.responses_under_30min / response_data.total_requests
    
    recency_multiplier = calculate_recency_multiplier(response_data.last_response_date)
    
    response_factor = (
        (time_score * 0.60) +
        (response_ratio * 100 * 0.40)
    ) * recency_multiplier
    
    return min(response_factor, 100)
```

**Ejemplo Numérico:**

```
Tiempo promedio de respuesta: 22 minutos
Respuestas en menos de 30 minutos: 38 de 50 solicitudes
Total de solicitudes recibidas: 50
Última respuesta: hace 5 días

time_score = 85 (entre 15-30 minutos)
response_ratio = 38 / 50 = 0.76
recency_multiplier = 1.0

response_factor = (85 × 0.60) + (0.76 × 100 × 0.40)
                = 51.0 + 30.4
                = 81.4 puntos
```

### 3.3 Factor de Puntualidad (20%)

Evalúa la adherence a los horarios pactados para recogidas y entregas.

```python
def calculate_punctuality_factor(punctuality_data):
    """
    punctuality_data: {
        on_time_deliveries: int,       # Entregas a tiempo
        late_deliveries: int,          # Entregas tardías
        early_deliveries: int,         # Entregas anticipadas
        avg_delay_minutes: float,      # Delay promedio cuando hay retraso
        last_delivery_date: datetime
    }
    """
    total_deliveries = (
        punctuality_data.on_time_deliveries +
        punctuality_data.late_deliveries +
        punctuality_data.early_deliveries
    )
    
    if total_deliveries == 0:
        return 0.0
    
    # Ratio de puntualidad
    on_time_ratio = punctuality_data.on_time_deliveries / total_deliveries
    
    # Bonus por anticipación (entregas early son valoradas)
    early_bonus = min(punctuality_data.early_deliveries / total_deliveries * 10, 5)
    
    # Penalización por delay promedio
    if punctuality_data.avg_delay_minutes > 60:
        delay_penalty = min(punctuality_data.avg_delay_minutes / 30, 25)
    else:
        delay_penalty = 0
    
    recency_multiplier = calculate_recency_multiplier(punctuality_data.last_delivery_date)
    
    punctuality_factor = (
        (on_time_ratio * 100 * 0.80) +
        early_bonus -
        delay_penalty
    ) * recency_multiplier
    
    return max(0, min(punctuality_factor, 100))
```

**Ejemplo Numérico:**

```
Entregas a tiempo: 52
Entregas tardías: 5
Entregas anticipadas: 3
Delay promedio en tardías: 45 minutos
Última entrega: hace 8 días

total_deliveries = 52 + 5 + 3 = 60
on_time_ratio = 52 / 60 = 0.867
early_bonus = min(3 / 60 × 10, 5) = 0.5
delay_penalty = 0 (menos de 60 minutos)

punctuality_factor = (0.867 × 100 × 0.80) + 0.5 - 0
                    = 69.36 + 0.5
                    = 69.86 puntos
```

### 3.4 Factor de Comunicación (15%)

Califica la calidad de la comunicación entre las partes.

```python
def calculate_communication_factor(communication_data):
    """
    communication_data: {
        messages_sent: int,
        avg_response_quality_score: float,  # 0-5, basado en feedback
        complaints_received: int,
        last_interaction_date: datetime
    }
    """
    if communication_data.messages_sent == 0:
        return 50.0  # Neutral si no hay datos
    
    # Score de calidad de respuesta
    quality_score = (communication_data.avg_response_quality_score / 5.0) * 100
    
    # Penalización por quejas
    complaint_ratio = communication_data.complaints_received / max(communication_data.messages_sent / 10, 1)
    complaint_penalty = min(complaint_ratio * 30, 30)
    
    # Volumen de comunicación (mínimo esperado: 20 mensajes por viaje)
    expected_messages = communication_data.messages_sent  # Simplificado
    volume_bonus = min(expected_messages / 5, 10)
    
    recency_multiplier = calculate_recency_multiplier(communication_data.last_interaction_date)
    
    communication_factor = (
        (quality_score * 0.70) +
        volume_bonus -
        complaint_penalty
    ) * recency_multiplier
    
    return max(0, min(communication_factor, 100))
```

**Ejemplo Numérico:**

```
Mensajes enviados: 120
Puntuación promedio de calidad: 4.0/5.0
Quejas recibidas: 2
Última interacción: hace 3 días

quality_score = (4.0 / 5.0) × 100 = 80.0
complaint_penalty = min(2 / 12 × 30, 30) = min(5, 30) = 5
volume_bonus = min(120 / 5, 10) = 10

communication_factor = (80.0 × 0.70) + 10 - 5
                      = 56 + 10 - 5
                      = 61 puntos
```

---

## 4. Normalización y Display Score (0-100)

El rating final se calcula combinando todos los factores con sus pesos:

```python
def calculate_final_rating(trips_factor, response_factor, punctuality_factor, communication_factor):
    """
    Combina los cuatro factores en un rating final 0-100
    """
    weights = {
        'trips': 0.40,
        'response': 0.25,
        'punctuality': 0.20,
        'communication': 0.15
    }
    
    final_score = (
        trips_factor * weights['trips'] +
        response_factor * weights['response'] +
        punctuality_factor * weights['punctuality'] +
        communication_factor * weights['communication']
    )
    
    return round(final_score, 2)
```

**Ejemplo Completo:**

| Factor | Valor | Peso | Puntuación Ponderada |
|--------|-------|------|---------------------|
| Trips | 81.15 | 40% | 32.46 |
| Response Time | 81.4 | 25% | 20.35 |
| Punctuality | 69.86 | 20% | 13.97 |
| Communication | 61.0 | 15% | 9.15 |
| **TOTAL** | | **100%** | **75.93** |

**Display Score:** `75.93 / 100`

---

## 5. Sistema de Decaimiento por Inactividad

### 5.1 Mecanismo de Decaimiento

El rating decae cuando un usuario no tiene actividad durante un período extendido. Esto asegura que transportistas activos mantengan calificaciones relevantes.

```python
import datetime

DAILY_DECAY_RATE = 0.05  # 5% por día de inactividad
MAX_INACTIVITY_DAYS = 180  # 6 meses
MIN_RATING_FLOOR = 200  # Rating mínimo del sistema Elo subyacente

def apply_decay(rating, last_activity_date, current_date=None):
    """
    Aplica decaimiento al rating por inactividad.
    """
    if current_date is None:
        current_date = datetime.datetime.now()
    
    days_inactive = (current_date - last_activity_date).days
    
    if days_inactive <= 30:
        # Grace period de 30 días sin decay
        return rating
    
    # Calcular decay
    decay_days = min(days_inactive - 30, MAX_INACTIVITY_DAYS - 30)
    decay_factor = 1 - (decay_days * DAILY_DECAY_RATE / 100)
    
    decayed_rating = rating * decay_factor
    
    return max(decayed_rating, MIN_RATING_FLOOR)
```

### 5.2 Tabla de Decaimiento Referencial

| Días de Inactividad | Multiplicador de Decay | Rating Inicial 75.93 → |
|---------------------|------------------------|------------------------|
| 0-30 | 1.00 | 75.93 (sin cambio) |
| 60 | 0.985 | 74.79 |
| 90 | 0.97 | 73.65 |
| 120 | 0.955 | 72.51 |
| 150 | 0.94 | 71.37 |
| 180+ | 0.925 | 70.23 |

---

## 6. Seguimiento de Historia y Análisis de Tendencias

### 6.1 Estructura de Datos Históricos

```python
class RatingHistoryEntry:
    date: datetime
    rating: float
    trips_factor: float
    response_factor: float
    punctuality_factor: float
    communication_factor: float
    trips_completed_delta: int
    activity_type: str  # 'trip_completed', 'response', 'dispute', 'inactivity'
```

### 6.2 Cálculo de Tendencia

```python
def calculate_trend(rating_history, window_days=30):
    """
    Calcula la tendencia del rating en una ventana de tiempo.
    Retorna: 'improving', 'stable', 'declining'
    """
    recent = [e for e in rating_history 
              if (datetime.now() - e.date).days <= window_days]
    
    if len(recent) < 2:
        return 'insufficient_data'
    
    first_rating = recent[0].rating
    last_rating = recent[-1].rating
    
    change_percent = ((last_rating - first_rating) / first_rating) * 100
    
    if change_percent > 5:
        return 'improving'
    elif change_percent < -5:
        return 'declining'
    else:
        return 'stable'
```

### 6.3 Volatilidad del Rating

```python
def calculate_volatility(rating_history, window_days=90):
    """
    Calcula la desviación estándar de los cambios de rating.
    Alta volatilidad indica comportamiento inconsistente.
    """
    recent = [e for e in rating_history 
              if (datetime.now() - e.date).days <= window_days]
    
    if len(recent) < 3:
        return 0.0
    
    changes = [recent[i+1].rating - recent[i].rating 
               for i in range(len(recent)-1)]
    
    mean_change = sum(changes) / len(changes)
    variance = sum((c - mean_change) ** 2 for c in changes) / len(changes)
    
    return round(variance ** 0.5, 2)
```

---

## 7. Algoritmo Completo de Actualización

```python
def update_rating(user_id, activity_data):
    """
    Algoritmo principal de actualización de rating.
    Se ejecuta tras cada actividad relevante del usuario.
    """
    # 1. Obtener datos actuales
    current_rating = get_current_rating(user_id)
    last_activity = get_last_activity_date(user_id)
    
    # 2. Obtener métricas actualizadas
    trips_data = get_trips_metrics(user_id)
    response_data = get_response_metrics(user_id)
    punctuality_data = get_punctuality_metrics(user_id)
    communication_data = get_communication_metrics(user_id)
    
    # 3. Calcular factores
    trips_factor = calculate_trips_factor(trips_data)
    response_factor = calculate_response_time_factor(response_data)
    punctuality_factor = calculate_punctuality_factor(punctuality_data)
    communication_factor = calculate_communication_factor(communication_data)
    
    # 4. Calcular rating base
    base_rating = calculate_final_rating(
        trips_factor, response_factor, 
        punctuality_factor, communication_factor
    )
    
    # 5. Aplicar decaimiento por inactividad
    current_date = datetime.now()
    decayed_rating = apply_decay(base_rating, last_activity, current_date)
    
    # 6. Guardar en historial
    save_rating_history(user_id, RatingHistoryEntry(
        date=current_date,
        rating=decayed_rating,
        trips_factor=trips_factor,
        response_factor=response_factor,
        punctuality_factor=punctuality_factor,
        communication_factor=communication_factor,
        trips_completed_delta=activity_data.get('trips_completed', 0),
        activity_type=activity_data.get('type', 'periodic_update')
    ))
    
    # 7. Retornar rating final
    return decayed_rating
```

---

## 8. Categorías de Rating

| Rango | Categoría | Color | Beneficios |
|-------|-----------|-------|------------|
| 90-100 | Excelente | Verde oscuro | Top placement en búsquedas, badge premium |
| 80-89 | Muy Bueno | Verde | Prioridad en subastas, mayor visibilidad |
| 70-79 | Bueno | Amarillo claro | Acceso a todas las funcionalidades |
| 60-69 | Regular | Amarillo | Funcionamiento estándar |
| 50-59 | Bajo | Naranja | Alertas de mejora, mentoring disponible |
| 0-49 | Crítico | Rojo | Requiere plan de mejora obligatoria |

---

## 9. Consideraciones Técnicas Adicionales

### 9.1 Actualización Asíncrona

El rating se recalcula de forma asíncrona mediante jobs programados cada hora, y de forma sincronizada tras actividades críticas (completar viaje, disputa).

### 9.2thresholds de Alerta

- **Descenso >10 puntos en 7 días:** Alerta de comportamiento inusual
- **Rating <50:** Notificación de plan de mejora
- **Volatilidad >15:** Revisión de calidad de datos

### 9.3 Persistencia

El rating Elo base (escala 0-2000) se persiste en la base de datos junto con el timestamp de última actualización para cálculo preciso de decaimiento.

---

*Documento generado automáticamente para Spottruck — Reglas de Negocio v2.1*
