---
title: "Spottruck - Penalidades por Cancelación"
date: 2026-06-04
author: Jarvis Agent
status: active
tags: [cancellation,penalties,business-rules,spottruck,auction,logistics]
---

# Spottruck - Penalidades por Cancelación

## Resumen Ejecutivo

Este documento establece el marco completo de penalidades por cancelación dentro de la plataforma Spottruck, el sistema de subastas y logística de transporte de carga en Argentina. El objetivo principal de este sistema es desincentivar cancelaciones abruptas que generan pérdidas operativas y de confianza entre los participantes del ecosistema, mientras se mantiene un equilibrio justo que proteja tanto a empresas (cargadores) como a transportistas (conductores).

El sistema de penalidades de Spottruck opera bajo tres principios fundamentales:

1. **Proporcionalidad**: La sanción debe ser proporcional al daño causado y al momento en que ocurre la cancelación.
2. **Gradualidad**: Las consecuencias escalan progresivamente según la frecuencia de cancelaciones.
3. **Justicia procesal**: Toda penalidad puede ser disputada mediante un proceso formal documentado.

El presente marco busca equilibrar la protección del transportista que ya incurrió en costos de desplazamiento con la flexibilidad que las empresas necesitan para manejar变故 operativas genuinas. Las penalidades no son punitive en sí mismas sino más bien un mecanismo de alineación de incentivos que desincentiva comportamientos que dañarían la confiabilidad del sistema de subastas.

---

## 1. Matriz de Penalidades por Timing y Rol

Las cancelaciones tienen consecuencias diferentes dependiendo de **quién cancela** (rol) y **cuándo lo hace** (timing relativo al evento de transporte). Esta distinción es crítica porque el impacto económico y operativo varía significativamente según el momento del ciclo de vida del viaje.

### 1.1 Empresa Cancela

Cuando una empresa (cargador) decide cancelar un viaje asignado, las consecuencias económicas se calculan como un porcentaje del valor total del viaje pactado (valor de la oferta ganadora más adicionales configurados). La escala de penalidades para empresas es:

| Timing | Consecuencia | Tipo de Penalidad |
|--------|-------------|-------------------|
| > 72h antes del pickup | Reembolso completo, sin penalidad | Ninguna |
| 24h - 72h antes | 10% del valor del viaje | Fee administrativo |
| < 24h antes del pickup | 25% del valor del viaje | Fee por cancelación tardía |
| Después de que el conductor llegó al punto de pickup | 50% del valor del viaje | Fee por incumplimiento |

El rationale detrás de esta escala es que cuando una empresa cancela con poca anticipación, el transportista ya ha incurrido en costos de preparación, combustible para desplazarse, y potencialmente ha rechazado otras oportunidades de carga. El fee del 50% después de la llegada del conductor reconoce que en ese punto el daño es máximo: el conductor está físicamente presente y su tiempo ha sido completamente desperdiciado.

### 1.2 Conductor Cancela

Para los transportistas, el sistema utiliza un enfoque de **puntos de penalidad** además de suspensiones temporales, dado que el impacto en la reputación y disponibilidad tiene consecuencias más severas para la continuidad del servicio en la plataforma.

| Timing | Penalidad | Consecuencia Adicional |
|--------|-----------|----------------------|
| > 48h antes del pickup | 1 punto de penalidad | Warning (advertencia formal) |
| 24h - 48h antes | 3 puntos de penalidad | 48 horas de suspensión de la cuenta |
| < 24h antes | 10 puntos de penalidad | 7 días de suspensión |
| Después del pickup (ya en camino) | 25 puntos + BAN | Expulsión permanente de la plataforma |

### 1.3 Matriz Visual Completa

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    MATRIZ DE PENALIDADES POR CANCELACIÓN                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐  ║
║  │ EMPRESA CANCELA                                                        │  ║
║  ├────────────────────────────────────────────────────────────────────────┤  ║
║  │ >72h ANTES    → Sin penalidad, reembolso 100%                         │  ║
║  │ 24h-72h       → 10% del valor del viaje (fee administrativo)           │  ║
║  │ <24h          → 25% del valor (cancelación tardía)                    │  ║
║  │ Post-pickup   → 50% del valor (incumplimiento)                        │  ║
║  └────────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐  ║
║  │ CONDUCTOR CANCELA                                                      │  ║
║  ├────────────────────────────────────────────────────────────────────────┤  ║
║  │ >48h ANTES    → 1 punto, warning formal                               │  ║
║  │ 24h-48h       → 3 puntos, suspensión 48h                               │  ║
║  │ <24h          → 10 puntos, suspensión 7 días                           │  ║
║  │ Post-pickup   → 25 puntos + BAN permanente                            │  ║
║  └────────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Sistema de Puntos de Penalidad

El sistema de puntos es el mecanismo central para rastrear el comportamiento histórico de los transportistas y aplicar consecuencias progresivas. A diferencia de los fees administrativos que son pagos únicos, los puntos persisten en el perfil del usuario y determinan su estado general dentro de la plataforma.

### 2.1 Estados del Transportista según Puntos Acumulados

| Puntos | Estado | Restricciones | Duración Restricción |
|--------|--------|---------------|---------------------|
| 0 - 10 | OPERACIÓN NORMAL | Sin restricciones | N/A |
| 11 - 20 | PROBACIÓN 30 DÍAS | No puede participar en subastas | 30 días desde última violación |
| 21 - 30 | PROBACIÓN 90 DÍAS | No puede participar en subastas | 90 días desde última violación |
| 31+ | EN REVISIÓN PARA BAN | Acceso suspendido pending review | Indefinido hasta resolución |

La progresión de estados asegura que los conductores tengan oportunidades adecuadas de corregir su comportamiento antes de enfrentar consecuencias permanentes. El sistema está diseñado para ser justo y transparente, con comunicaciones claras en cada etapa de transición de estado.

### 2.2 Algoritmo de Penalización

El siguiente pseudocódigo detalla la lógica de negocio implementada en el módulo `PenaltySystem`:

```python
class PenaltySystem:
    # Constantes de penalización por tipo de cancelación
    POINTS_WARNING = 1          # Cancelación > 48h (conductores)
    POINTS_MEDIUM = 3           # Cancelación 24-48h
    POINTS_HIGH = 10            # Cancelación < 24h
    POINTS_CRITICAL = 25        # Cancelación post-pickup (ban)
    
    # Thresholds de estado
    THRESHOLD_NORMAL = 10
    THRESHOLD_30DAY = 20
    THRESHOLD_90DAY = 30
    THRESHOLD_BAN = 31
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.points = 0
        self.suspension_until = None
        self.status = "NORMAL"
        self.violation_history = []
    
    def add_penalty(self, points: int, cancellation_type: str, 
                    duration_days: int = 0, evidence_id: str = None):
        self.points += points
        self.violation_history.append({
            'points': points,
            'type': cancellation_type,
            'timestamp': datetime.now(),
            'evidence': evidence_id
        })
        self._update_status()
        
        if duration_days > 0:
            self.suspension_until = datetime.now() + timedelta(days=duration_days)
            self._notify_suspension(duration_days)
    
    def _update_status(self):
        if self.points >= self.THRESHOLD_BAN:
            self.status = "BAN_REVIEW"
            self._trigger_ban_review()
        elif self.points > self.THRESHOLD_90DAY:
            self.status = "90DAY_PROBATION"
        elif self.points > self.THRESHOLD_30DAY:
            self.status = "30DAY_PROBATION"
        elif self.points > self.THRESHOLD_NORMAL:
            self.status = "WARNING"
        else:
            self.status = "NORMAL"
    
    def can_bid(self) -> tuple[bool, str]:
        if self.suspension_until and datetime.now() < self.suspension_until:
            return False, f"Cuenta suspendida hasta {self.suspension_until}"
        
        if self.points > self.THRESHOLD_30DAY:
            return False, f"Demasiados puntos de penalidad ({self.points})"
        
        return True, " eligible"
```

### 2.3 Decaimiento de Puntos

Los puntos de penalidad no son permanentes. Existe un mecanismo de decaimiento que permite a los transportistas recuperar su状态的 limpio después de un período sin violaciones. Esta política reconoce que las personas pueden mejorar y que el sistema debe incentivarlo activamente.

| Puntos Acumulados | Período de Decaimiento | Puntos Removidos |
|-------------------|----------------------|------------------|
| 1-5 puntos | 90 días | Todos los puntos |
| 6-10 puntos | 180 días | Todos los puntos |
| 11-20 puntos | 365 días | Reducción al 50% |
| 21-30 puntos | No hay decaimiento | Requiere revisión manual |

El decaimiento se aplica automáticamente al final del período correspondiente, siempre que el usuario no haya acumulado nuevas violaciones durante el período de espera. Este mecanismo de auto-corrección es fundamental para mantener un ecosistema de transportistas comprometidos y confiables.

---

## 3. Proceso de Disputa de Penalidades

Todo usuario tiene derecho a disputar cualquier penalidad impuesta. El proceso de disputa está diseñado para ser justo, eficiente y transparente, garantindo que ninguna penalidad se aplique sin la oportunidad de ser evaluada por un humano.

### 3.1 Derechos y Plazos del Proceso de Disputa

El usuario tiene derecho a:

- Recibir notificación inmediata de cualquier penalidad aplicada con explicación detallada
- Disputar dentro de un período de 48 horas desde la notificación
- Presentar evidencia documentação (fotos, mensajes, emails) que respalde su reclamo
- Recibir una resolución dentro de 72 horas hábiles desde la presentación del dispute
- Apelar la decisión inicial ante un nivel superior de revisión

### 3.2 Condiciones para Aceptar una Disputa

Una dispute se considera válida y es procesada cuando cumple con al menos uno de los siguientes criterios:

1. **Fuerza Mayor Documentada**: El usuario presenta documentación oficial que certifica el evento impredecible (accidente, enfermedad, desastre natural).
2. **Error del Sistema**: Se puede demostrar que la plataforma generó información incorrecta o que el proceso de penalización tuvo un bug técnico.
3. **Evidencia de mala fe de la otra parte**: El usuario puede demostrar que la cancelación fue causada por acciones deliberadamente obstructivas de la otra parte.
4. **Inconsistencia en los datos**: Hay contradicciones claras entre los registros del sistema y los hechos documentados por el usuario.

### 3.3 Flujo Completo del Proceso de Disputa

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                      FLUJO DE DISPUTA DE PENALIDADES                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║    Penalidad aplicada                                                        ║
║          │                                                                   ║
║          ▼                                                                   ║
║    ┌─────────────┐                                                          ║
║    │Notificación │                                                          ║
║    │al usuario   │                                                          ║
║    └──────┬──────┘                                                          ║
║           │                                                                  ║
║    ┌──────┴──────┐                                                          ║
║    │Disputa en   │                                                          ║
║    │48h?         │                                                          ║
║    └──────┬──────┘                                                          ║
║       Sí     No                                                              ║
║        │     │                                                              ║
║        ▼     ▼                                                              ║
║   Presenta    Penalidad                             ◄── Fin del proceso      ║
║   evidencia   queda firme                                                    ║
║        │                                                                    ║
║        ▼                                                                    ║
║   ┌────────────┐                                                            ║
║   │Review      │                                                            ║
║   │Administrati│                                                            ║
║   └──────┬─────┘                                                            ║
║          │                                                                  ║
║    ┌─────┴─────┐                                                           ║
║    │Aceptada?  │                                                           ║
║    └─────┬─────┘                                                           ║
║      Sí     No                                                              ║
║       │      │                                                              ║
║       ▼      ▼                                                              ║
║  Remover   Notificar                           ◄── Fin del proceso         ║
║  penalidad al usuario                                                    ║
║       │      │                                                              ║
║       ▼      ▼                                                              ║
║   Apelación  Resolución                           ◄── Segunda instancia    ║
║   (opcional) Final                                                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 3.4 Implementación del Proceso de Disputa

```python
class DisputeProcess:
    DISPUTE_WINDOW_HOURS = 48
    REVIEW_RESOLUTION_HOURS = 72
    APPEAL_WINDOW_HOURS = 24
    
    def __init__(self, penalty_id: str, user_id: str):
        self.penalty_id = penalty_id
        self.user_id = user_id
        self.status = "PENDING_DISPUTE"
        self.evidence = []
        self.timeline = []
    
    def submit_dispute(self, evidence: list, description: str) -> dict:
        self._validate_dispute_window()
        
        dispute_record = {
            'id': generate_uuid(),
            'penalty_id': self.penalty_id,
            'user_id': self.user_id,
            'description': description,
            'evidence': evidence,
            'submitted_at': datetime.now(),
            'status': 'UNDER_REVIEW'
        }
        
        self._notify_admin_review(dispute_record)
        self.status = "UNDER_REVIEW"
        
        return {
            'dispute_id': dispute_record['id'],
            'status': 'submitted',
            'estimated_resolution': datetime.now() + timedelta(hours=self.REVIEW_RESOLUTION_HOURS)
        }
    
    def _validate_dispute_window(self):
        penalty = self._get_penalty(self.penalty_id)
        time_since_penalty = datetime.now() - penalty.created_at
        
        if time_since_penalty.hours > self.DISPUTE_WINDOW_HOURS:
            raise DisputeWindowExpired(
                f"El período de disputa de {self.DISPUTE_WINDOW_HOURS}h ha expirado"
            )
```

### 3.5 Criterios de Decisión Administrativa

Los administradores que revisan disputas deben aplicar los siguientes criterios de manera consistente:

1. **Principio del beneficio de la duda**: Cuando la evidencia es ambigua, se favorece al usuario que disputa.
2. **Carga de prueba compartida**: No es necesario demostrar inocencia, sino generar duda razonable sobre la penalidad.
3. **Proporcionalidad**: La resolución debe ser proporcional a la severidad de la violación alegada.
4. **Precedente consistente**: Decisiones previas similares deben producir resultados similares.
5. **Impacto en el ecosistema**: Se considera el efecto agregado de permitir o denegar la disputa en la confiabilidad general del sistema.

---

## 4. Excepciones por Fuerza Mayor

Reconocemos que existen circunstancias genuinamente outside del control de cualquier persona que pueden hacer imposible cumplir con una obligación de transporte. El sistema de fuerza mayor existe para proteger a ambos lados cuando ocurre un evento verdaderamente catastrófico.

### 4.1 Condiciones Exentas Reconocidas

Las siguientes condiciones califican como excepciones por fuerza mayor, sujeto a verificación documental:

| Categoría | Condiciones Específicas | Documentación Requerida |
|----------|-------------------------|------------------------|
| **Natural** | Terremoto, inundación, incendio, tormenta severa | Reporte oficial de emergencia |
| **Médica** | Hospitalización de emergencia, accidente grave | Certificado médico oficial |
| **Legal** | Orden judicial, restricción governmental | Documento oficial de la autoridad |
| **Vehículo** | Falla mecánica catastrófica, accidente de tránsito | Denuncia policial + informe mecánico |
| **Seguridad** | Amenaza de seguridad, secuestro express | Denuncia policial |
| **Infraestructura** | Cierre de ruta crítica, puente intransitable | Comunicación oficial de organismo |

### 4.2 Flujo de Verificación de Fuerza Mayor

```
╔══════════════════════════════════════════════════════════════════════════════╗
║               VERIFICACIÓN DE FUERZA MAYOR                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║    Solicitud de excepción                                                     ║
║          │                                                                    ║
║          ▼                                                                    ║
║    ┌─────────────────┐                                                       ║
║    │Recibir docs     │                                                       ║
║    │comprobatorios   │                                                       ║
║    └────────┬────────┘                                                       ║
║             │                                                                 ║
║    ┌────────┴────────┐                                                       ║
║    │Docs válidos?    │                                                       ║
║    └────────┬────────┘                                                       ║
║         Sí      No                                                           ║
║          │       │                                                          ║
║          ▼       ▼                                                          ║
║    ┌─────────┐  ┌────────────┐                                               ║
║    │Evaluar  │  │Solicitar   │                                               ║
║    │evento   │  │docs extra  │                                               ║
║    └────┬────┘  └──────┬─────┘                                               ║
║         │              │                                                      ║
║         ▼              │                                                      ║
║    ┌─────────┐        │                                                      ║
║    │¿Cumple  │        │                                                      ║
║    │criterio?│        │                                                      ║
║    └────┬────┘        │                                                      ║
║      Sí    No          │                                                     ║
║       │     │          │                                                     ║
║       ▼     └──────┬───┘                                                     ║
║  Eximir    Denegar │                                                          ║
║  penalidad  solicitud                                                         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 4.3 Implementación del Handler de Fuerza Mayor

```python
class ForceMajeureHandler:
    VALID_CATEGORIES = ['NATURAL', 'MEDICAL', 'LEGAL', 
                         'VEHICLE', 'SECURITY', 'INFRASTRUCTURE']
    
    def __init__(self, trip_id: str, user_id: str):
        self.trip_id = trip_id
        self.user_id = user_id
        self.category = None
        self.evidence = []
        self.status = "PENDING_REVIEW"
    
    def submit_claim(self, category: str, evidence: list, 
                     description: str) -> dict:
        if category not in self.VALID_CATEGORIES:
            raise InvalidCategoryException(
                f"Categoría {category} no válida"
            )
        
        claim = {
            'id': generate_uuid(),
            'trip_id': self.trip_id,
            'user_id': self.user_id,
            'category': category,
            'description': description,
            'evidence': evidence,
            'submitted_at': datetime.now(),
            'status': 'UNDER_REVIEW'
        }
        
        self._create_support_ticket(claim)
        self.status = "UNDER_REVIEW"
        
        return {
            'claim_id': claim['id'],
            'status': 'submitted',
            'estimated_days': 3
        }
    
    def _create_support_ticket(self, claim: dict):
        ticket_payload = {
            'priority': 'HIGH',
            'subject': f"Fuerza Mayor: {claim['category']} - Trip {self.trip_id}",
            'description': self._format_description(claim),
            'attachments': claim['evidence'],
            'assigned_to': 'force_majeure_team',
            'sla_deadline': datetime.now() + timedelta(hours=72)
        }
        
        send_to_support_system(ticket_payload)
```

---

## 5. Notificaciones y Comunicación

El sistema de penalidades está diseñado para ser transparente. Toda acción tomada debe ser comunicada de manera clara y oportuna al usuario afectado, garantizando que nunca haya sorpresa sobre el estado de su cuenta.

### 5.1 Templates de Notificación

| Evento | Canal | Template |
|--------|-------|----------|
| Penalty applied | Push + Email | PENALTY_APPLIED |
| Points threshold reached | Push + Email + SMS | POINTS_THRESHOLD_WARNING |
| Suspension activated | Push + Email + SMS | SUSPENSION_ACTIVATED |
| Dispute submitted | Push + Email | DISPUTE_SUBMITTED |
| Dispute resolved (favor) | Push + Email | DISPUTE_FAVORABLE |
| Dispute resolved (denied) | Push + Email | DISPUTE_DENIED |
| Force majeure approved | Push + Email | FORCE_MAJEURE_APPROVED |

### 5.2 Contenido Mínimo de Notificación

Cada notificación de penalidad debe contener:

- Tipo de penalidad y cantidad de puntos o fee aplicado
- Viaje específico al que corresponde la cancelación
- Timing relativo (cuándo occurred la cancelación vs. cuándo era el pickup)
- Referencia al proceso de dispute (plazo y cómo hacerlo)
- Enlace directo a la sección de disputar en la app
- Información de contacto del soporte en caso de preguntas

---

*Documento generado para Spottruck - Plataforma de subastas y logística de transporte de carga en Argentina.*
*Versión: 1.0 | Última actualización: 2026-06-04*
