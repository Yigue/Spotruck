---
title: User Journeys — Spottruck
date: 2026-06-04
author: Spottruck Product Team
status: active
tags:
  - user-journeys
  - ux
  - spottruck
  - logistics
  - transportista
  - empresa
  - destinatario
---

# User Journeys — Spottruck

## Mapa de Journey de Usuario — Spottruck

Este documento presenta los recorridos completos de usuario para los perfiles principales de Spottruck: **Transportista**, **Empresa**, **Destinatario** y la variante **Fleet Owner**. Cada journey abarca desde el primer contacto con la plataforma hasta la finalización del servicio, incluyendo puntos de contacto, frustraciones, oportunidades, estados emocionales, KPIs y paths de error en cada etapa.

El contexto es Argentina, con sus particularidades regulatorias (CNRT), geográficas (distancias significativas, Radial Argentina, puertos de Rosario y Buenos Aires) y económicas (volatilidad del mercado, costos operativos variables). Spottruck busca ser la plataforma de referencia para el transporte de carga pesada en Argentina.

---

## TABLA RESUMEN: Journey del Transportista

| Fase | Touchpoint | Pantalla/Funcionalidad | Emoción | Pensamiento | Oportunidad |
|------|------------|------------------------|---------|-------------|-------------|
| Descubrimiento | Grupo WhatsApp transportistas | App Store / Play Store | Curiosidad, esperanza | "Seguro esto es otro scam más" | Testimonios de pares, reseñas auténticas |
| Registro | Formulario de alta | Pantalla 1: Datos personales | Ansiedad controlada | "Esto va a ser largo y tedioso" | Progreso visual, máximo 5 minutos |
| Verificación | Pantalla de espera | Dashboard limitado | Frustración, espera | "Voy a perder negocios mientras espero" | Onboarding activo, verification speed |
| Explorar | Mapa de viajes | Lista/Map toggle | Excitación, overwhelm | "Hay muchos viajes pero cuáles valen la pena" | Filtros inteligentes, ranking por rentabilidad |
| Ofertar | Calculadora de rentabilidad | Formulario de oferta | Estratégico, nervioso | "Si bajo mucho no gano, si subo pierdo el viaje" | Herramientas de pricing, benchmark local |
| Esperar | Dashboard de ofertas | Lista de ofertas activas | Tensión, paciencia | "¿Me van a elegir? Hay 15 ofertas más" | Notificaciones proactivas, updates de ranking |
| Aceptar | Notificación push | Detalle del viaje adjudicado | Alivio, compromiso | "Bueno, a trabajar. Tengo 2 horas para confirmar" | Integración con navegación, Checklist pre-viaje |
| Ejecutar | Modo tracking activo | Mapa con posición GPS | Responsabilidad, estrés | "Tengo que llegar bien y a tiempo" | Reporting de incidencias en 1 click, soporte 24/7 |
| Completar | Confirmación de entrega | Pantalla de cierre | Satisfacción, agotamiento | "Otro viaje hecho, ahora a cobrar" | Confirmación digital del destinatario |
| Cobrar | Opciones de cobro | Historial de pagos | Ansiedad financiera | "¿Cuándo voy a tener el dinero?" | Pago instantáneo con pequeña comisión |
| Calificar | Formulario de rating | Popup post-cobro | Justificado, crítico | "Esta empresa me hizo perder el tiempo" | Guías de feedback constructivo |

---

## Journey del Transportista (Completado)

### Fase 1: Descubrimiento y Descarga

**Contexto del usuario:**
"El团长" Gustavo tiene 42 años, maneja un Scania 2018 con acoplado y lleva 15 años en el rubro. Escucha sobre Spottruck en el grupo de WhatsApp "Camioneros Argentinos" cuando otro transportista comparte una captura de pantalla de un viaje que le pagó $280.000 por un Córdoba-Buenos Aires. Gustavo está en una estación de servicio en la RN9 cerca de Villa María, volviendo vacío de entregar maíz.

**"Escuché que有人在 Spottruck gana guita real. Necesito saber si es cierto o si es otro verso más."**

**Touchpoint:** El discovery ocurre en el grupo de WhatsApp de transportistas de la zona. Un compañero comparte su experiencia positiva con Spottruck. Gustavo investiga por su cuenta buscando "Spottruck" en Google y encuentra reseñas en foros de transportistas como Truckr y Caminos de Argentina.

**Pantalla:** Llega a la página de inicio de Spottruck o descarga la app desde Google Play Store ( Android, porque su Samsung Galaxy A54 tiene buena relación costo-beneficio y es lo que usan la mayoría de los transportistas en Argentina). La pantalla de bienvenida muestra imágenes de camiones en rutas patagónicas y un mensaje claro: "Encontrá viajes, evitá volver vacío, cobrá rápido."

**Emoción:** Curiosidad mezclada con escepticismo. Los transportistas argentinos han visto muchas promesas de plataformas que no cumplieron.

**KPI objetivo:** Tasa de descarga > 40% desde el primer touchpoint, tiempo de carga de app < 5 segundos.

**Error path — Fallo de descarga:**
Si la descarga falla por problemas de Play Store o espacio insuficiente en el teléfono (común en dispositivos de gama baja), Spottruck muestra un mensaje con pasos para liberar espacio y un link alternativo via APK firmado para instalación directa. Esto previene la pérdida del usuario en esta etapa crítica.

---

### Fase 2: Registro e Información Personal

**"Espero que el registro no sea un laberinto. No tengo tiempo para estar llenando formularios todo el día."**

El团长 Roberto inicia el registro tocando "Comenzar como Transportista". El formulario se presenta en pasos claros con barra de progreso visible. Esto reduce la ansiedad del usuario.

**Paso 1 — Datos Personales:**
- Nombre completo (exactamente como aparece en el DNI)
- Número de DNI (con dígito verificador)
- Fecha de nacimiento (se verifica mayoría de edad: 21 años para transporte interprovincial según CNRT)
- Número de teléfono celular con código de área (para verificación por SMS)
- Email personal (para notificaciones de viajes adjudicados)
- Contraseña segura (mínimo 8 caracteres, una mayúscula, un número)

**Paso 2 — Licencia de Conducir:**
- Número de licencia (formato: L12345678)
- Fecha de vencimiento (Spottruck alerta si está por vencer en menos de 6 meses)
- Categoría (para camiones de carga pesada se requiere mínimo Categoría E)
- Foto del frente y dorso de la licencia (para verificación OCR)

**Paso 3 — Datos del Vehículo:**
- Patente del camión (formato: ABC123)
- Patente del acoplado (si aplica)
- Tipo de carrocería según clasificación argentina: Batea, Payload, Cisterna, Termo, Reductora, Jaula
- Marca y modelo del vehículo (ej: Volvo FH 2019)
- Año de fabricación
- Capacidad máxima de carga en kg (ej: 24.000 kg)
-Configuración ejes (2 ejes, 3 ejes, semirremolque)

**Paso 4 — Documentación Adicional (Opcional pero recomendado):**
- Photo del título del vehículo
- Seguro obligatorio (código de póliza)
- Verificación de GNC si corresponde (certificado de aptitud)
- Habilitación CNRT vigente

**Emoción:** Ansiedad moderada. El transportista quiere saber que sus datos están seguros y que no será víctima de phishing.

**KPI objetivo:** Tasa de completación de registro > 65%, tiempo promedio de registro < 8 minutos.

**Error path — Datos inválidos:**
Si el usuario ingresa un DNI inexistente o una patente que no corresponde a un vehículo habilitado, el sistema muestra error en tiempo real señalando exactamente qué campo está mal y por qué. No se permite avanzar hasta corregir. Si la licencia está vencida, se muestra un mensaje indicando que debe renovarla antes de registrarse, con link a información de cómo hacer la renovación en la CNRT.

---

### Fase 3: Verificación de Documentos y Habilitación

**"Me dijeron que tarda hasta 72 horas. Son tres días sin trabajo. Eso es mucho."**

Después de enviar el registro, el transportista entra en la fase de verificación. Spottruck conecta con la base de datos de la CNRT para verificar:
- Que el vehículo esté habilitado para transporte de carga
- Que la licencia de conducir esté vigente y con categoría suficiente
- Que no haya sanciones activas que impidan operar

También se verifica el historial del conductor en Spottruck (si es reingreso) y se cruza con listas de morosos de ADRs.

**Pantalla de espera:** El transportista ve un dashboard limitado donde puede:
- Ver tutoriales en video sobre cómo funcionan las subastas
- Aprender a usar la calculadora de rentabilidad
- Leer guías sobre optimización de perfil
- Ver FAQs de otros transportistas

**Emoción:** Frustración e impaciencia. El transportista necesita trabajar y cada hora de espera es潜在 income perdido.

**Pensamiento:** "¿Y si me rechazan? Toda esa info para nada. Y si me aceptan, ¿habrá viajes disponibles?"

**KPI objetivo:** Tiempo de verificación < 24 horas para 80% de los usuarios, < 48 horas para 95%.

**Mecánica de negocio:**
La verificación incluye la validación de la documentación del vehículo contra los registros de la CNRT. Si el vehículo tiene deudas pendientes de patents o multas, se notifica al transportista y se le da la opción de regularizar antes de una verificación manual.

**Notificación de verificación aprobada:**
Push notification: "¡Bienvenido a Spottruck, Roberto! Tu cuenta está verificada. Ahora puedes empezar a ofertar en viajes."

El perfil muestra un badge de "Transportista Verificado" con el escudo de la CNRT integrado. Este badge genera confianza con las empresas.

---

### Fase 4: Explorar Viajes Disponibles

**"Mañana tengo que entregar en Buenos Aires. Si encuentro algo para volver a Córdoba, me ahorra el pasaje de retorno."**

Con la cuenta verificada, el transportista accede a su pantalla principal. Un mapa de Argentina muestra pins de colores indicando viajes disponibles:
- Verde: Alta demanda, muchos empresas buscando transportistas
- Amarillo: Competencia moderada
- Rojo: Saturación, muchos transportistas ofertando

**Zonas calientes:**
- Gran Buenos Aires: Mucha demanda, mucha competencia
- Puerto de Rosario: Containers, demanda constante
- Campana/Zárate: Industrial, químicos
- Gran Córdoba: Agro, cereales
- Litoral (Resistencia, Posadas): Menos competencia, rutas más largas

**Filtros disponibles:**
- Tipo de carga: Generales, Refrigerada, ADR (peligrosos), Sobredimensionada
- Peso aproximado
- Dirección de destino (para optimizar retorno)
- Fecha de публикации del viaje
- Precio base

**"Hay 47 viajes disponibles en un radio de 200km. Los más rentables están en rojo — esos tienen 20 ofertas ya."**

**Emociones:** Excitación al ver opciones, pero también overwhelm. El transportista quiere maximizar su ganancia y evitar volver vacío.

**KPI objetivo:** Viajes visualizados por sesión > 8, tasa de filtrado activo > 50%.

**Error path — Sin viajes disponibles:**
Si el mapa no muestra viajes en la zona del transportista, se muestra un mensaje: "No hay viajes disponibles en tu zona ahora. Te notificamos cuando aparezcan nuevos viajes en un radio de 300km." El transportista puede configurar alertas por zona.

---

### Fase 5: Evaluar y Ofertar

**"Este viaje dice $180.000. Voy a calcular bien si me conviene con el diesel a $850 el litro."**

Al tocar un viaje interesante, el transportista ve el detalle completo:
- Ruta exacta en el mapa con puntos de recogida y entrega
- Tipo de carga según clasificación LC (Logística de Carga)
- Peso aproximado en toneladas
- Requisitos del vehículo según la empresa
- Instrucciones especiales (horarios de carga específicos, restricciones de acceso a puertos)
- Reputación de la empresa (calificación promedio, viajes completados)
- Historial de pagos de la empresa (¿paga en tiempo o genera disputas?)

**Calculadora de Rentabilidad Integrada:**
El transportista puede ingresar:
- Precio del diésel en la zona (Spottruck muestra precios de referencia actualizados)
- Peajes de la ruta (ej: Paso del Sistema de Toll, $35.000 para camión con acoplado)
- Gastos estimados (comisión Spottruck: 12% del valor del viaje)
- Otros costos (carga/descarga, waits time, etc.)

El sistema estima la ganancia neta. Si es negativa o muy baja (< 15% del revenue), se muestra en rojo alertando que la oferta no es rentable.

**Formulario de Oferta:**
- Precio propuesto en pesos argentinos (ARS)
- Mensaje opcional a la empresa (explicar por qué es buena opción: experiencia en rutas similares, equipamiento en óptimas condiciones, disponibilidad inmediata)
- Adjuntar fotos del vehículo si lo desea (genera más confianza)

**"Pongo $175.000. No es el más bajo pero tengo 4.8 de calificación y 120 viajes completados."**

**Emociones:** Estratégico, nervioso. La oferta debe ser competitiva pero rentable.

**KPI objetivo:** Tasa de oferta completada > 60%, oferta promedio = precio de referencia ± 10%.

**Error path — Oferta no enviada:**
Si hay error de conexión durante el envío, Spottruck guarda la oferta como borrador y permite reintentar. No se pierde el trabajo del transportista.

---

### Fase 6: Esperar Resultado de la Subasta

**"La empresa tiene 3 horas para decidir. Tengo 3 horas más para seguir buscando."**

Durante el período de la subasta, el transportista puede continuar explorando viajes mientras espera. Su dashboard muestra sus ofertas organizadas por estado:
- **Activas:** Esperando decisión de la empresa
- **Ganadas:** Fue seleccionado (¡felicitaciones!)
- **Perdidas:** Otra oferta fue aceptada
- **Expiradas:** La subasta cerró sin que lo seleccionaran

**Para ofertas activas, ve información útil:**
- Cantidad de ofertas recibidas por el viaje (sin detalles específicos para privacidad)
- Rango de precios (ej: "$150.000 - $220.000")
- Tiempo faltante para el cierre

**Chat integrado:**
Si la empresa tiene preguntas, recibe notificación push y puede responder directamente. Esta comunicación directa es valorada porque reduce llamadas telefónicas que pueden ser complicadas cuando se está conduciendo.

**"Me preguntaron si puedo cargar a las 6am. Sí, puedo. Respondo ahora."**

**Emociones:** Tensión, esperanza, paciencia. Cada minuto que pasa sin respuesta es incertidumbre.

**KPI objetivo:** Tiempo de respuesta a preguntas < 2 horas, tasa de comunicación durante subasta > 40%.

**Error path — Cero ofertas recibidas por el viaje:**
Si la empresa publica un viaje y no recibe ninguna oferta, Spottruck notifica al transportista: "Este viaje no tiene ofertas aún. Sé el primero en ofertar." También puede sugerir ajuste de precio si el viaje estuvo publicado más de 6 horas sin resultados.

---

### Fase 7: Aceptar Adjudicación y Confirmar

**"¡Me eligieron! Tengo 2 horas para confirmar o pierdo el viaje."**

Cuando la empresa selecciona su oferta, el transportista recibe:
- Notificación push inmediata
- Email con detalles completos
- SMS como backup (en caso de no tener internet)

**Información del viaje adjudicado:**
- Datos de contacto de la empresa (nombre, teléfono, email)
- Horarios de recogida y entrega
- Documentación requerida (CRT, guía de transporte, habilitación CNRT)
- Instrucciones especiales

**Tiene 2 horas para confirmar la aceptación.** Si no confirma en ese plazo, Spottruck puede ofrecer el viaje al siguiente postor.

**Al confirmar:**
- Estado cambia a "Viaje Asignado"
- Aparece integración con Google Maps/Waze para navegación al punto de recogida
- Checklist pre-viaje: Verificar nivel de combustible, estado del vehículo, documentos al día

**Emociones:** Alivio, satisfacción, compromiso. El transportista se siente valorado y tiene trabajo confirmado.

**KPI objetivo:** Tasa de confirmación > 90%, tiempo promedio de confirmación < 30 minutos.

**Error path — Transportista no confirma a tiempo:**
Si el transportista no confirma en 2 horas, Spottruck envía recordatorio a los 30 minutos y a los 90 minutos. Si finalmente no confirma, el viaje se ofrece al segundo postor más bajo (si la empresa eligió esa modalidad). El transportista recibe una marca de "No confirmó" en su historial que afecta su reputación en la plataforma.

---

### Fase 8: Ejecutar el Viaje

**"Arrancamos. Voy a reportar cualquier cosa que pase para que la empresa sepa dónde estoy."**

**Inicio del tracking:**
Al comenzar el viaje, el transportista marca su salida desde su posición GPS actual. La app activa el modo seguimiento que registra su ubicación cada 5 minutos. Esto proporciona trazabilidad a la empresa y es especialmente importante para cargas de alto valor.

**Punto de recogida:**
Al llegar, el transportista:
1. Marca su llegada
2. Documenta la carga con fotos: estado de la mercancía, cantidad de bultos, cualquier daño visible
3. Si hay discrepancias (diferencia de peso, daños, faltantes), las reporta desde la app ANTES de cargar

Esta documentación protege al transportista si hay reclamaciones posteriores.

**"El pallet dice 2.400kg pero la empresa dijo 2.000kg. Lo reporto antes de cargar para no tener problemas después."**

**Durante el trayecto:**
- Navegación guiada con info de tráfico en tiempo real
- Reporte de incidencias en 1 click: Avería mecánica, accidente, cierre de ruta, condiciones meteorológicas extremas
- Spottruck notifica a la empresa y ofrece alternativas (reasignación, coordinación de retrasos)

**Zonas complicadas:**
En terminales portuarias como Puerto de Rosario o Puerto de Buenos Aires, las esperas pueden ser largas (2-4 horas para entrar). Spottruck permite reportar wait time documentado que afecta los tiempos de entrega sin penalizar al transportista.

**Punto de entrega:**
Al llegar a cada destino, el transportista:
1. Marca su llegada
2. Espera confirmación de recepción del destinatario (empresa directao tercero como operario de depósito)
3. Recoge firma digital o código de verificación

**Emociones:** Responsabilidad, estrés, concentración. El transportista sabe que su reputación depende de una ejecución impecable.

**KPI objetivo:** Reporte de incidencias < 5 minutos desdeoccurrence, tasa de documentación completa > 95%.

**Error path — Avería mecánica en ruta:**
El transportista reporta la incidencia desde la app. Spottruck:
1. Notifica a la empresa inmediatamente con posición GPS y tiempo estimado de resolución
2. Ofrece alternativas: continuar con transportista de backup (si la empresa tiene uno asignado), reasignar el viaje, o cancelar con compensación
3. Activa el protocolo de asistencia mecánica si Spottruck tiene partnership con talleres en la zona
4. Documenta todo para el proceso de reclamos de seguro si corresponde

---

### Fase 9: Completar el Viaje y Confirmar Entrega

**"Entregué todo OK. Ahora a marcar como completado y esperar la confirmación de la empresa."**

Al completar la entrega final:
1. El transportista marca el viaje como "Completado" desde su app
2. La empresa recibe notificación para confirmar la recepción de la mercancía en condiciones
3. Si hay daños o discrepancias, se abre proceso de reclamo que Spottruck media

**Confirmación de entrega incluye:**
- Datos de geolocalización (timestamp de llegada)
- Fotos de entrega (mercancía entregada, estado del packing)
- Firma digital del destinatario o código de verificación
- Wear time documentado (tiempo de espera en puntos de carga/descarga)

**Emociones:** Satisfacción, alivio, orgullo de haber completado otro viaje. Pero también agotamiento físico después de largas horas de conducción.

**KPI objetivo:** Tasa de completación documentada > 98%, tiempo de cierre de viaje < 2 horas post-entrega.

**Error path — Discrepancia en entrega:**
El transportista marca "Discrepancia Reportada" y describe el problema (daño, faltante,拒绝). Spottruck activa proceso de mediación:
1. Se congelan fondos hasta resolución
2. Se solicita evidencia de ambas partes
3. Se evalúa con base en documentación (fotos previas, peso en pickup, etc.)
4. Se propone resolución (descuento proporcional, reenvío, compensación)

---

### Fase 10: Recibir Pago

**"Ahora sí, a cobrar. Si elijo pago instantáneo me dan 3% menos pero tengo la plata hoy. Si espero, cobro en 7 días sin descuento."**

**Opciones de cobro:**
1. **Cobro instantáneo:** Comisión del 3%, dinero disponible en 24 horas
2. **Cobro estándar:** Sin costo, ciclo de 7 días hábiles

**Métodos de pago disponibles:**
- Transferencia bancaria a CBU (el más común en Argentina)
- Mercado Pago (billetera digital, popular)
- Efectivo en puntos de pago autorizados (PagoFacil, Rapipago)

**Historial de pagos:**
La pantalla muestra todos los viajes completados con:
- Monto bruto del viaje
- Comisión Spottruck (12%)
- Monto neto a recibir
- Estado del pago (Procesando, Transferido, Recibido)
- Fecha estimada de recepción

**Emociones:** Ansiedad financiera, especialmente para pequeños transportistas que viven de viaje a viaje. La opción de cobro instantáneo es crítica para quienes necesitan pagar gasoil inmediatamente.

**Pensamiento:** "El diesel me costó $180.000. Si cobro hoy menos 3%, me quedan $173.400 netos. Si espero 7 días, tengo $180.000 pero necesito $180.000 hoy para el próximo viaje."

**KPI objetivo:** Tasa de elección de pago instantáneo > 35%, tiempo real de transferencia < 24 horas.

**Mecánica de negocio — Estructura de comisiones:**
- Spottruck cobra 12% del valor del viaje al transportista
- La empresa paga el 100% del valor acordado
- El transportista recibe (valor del viaje - 12%) según método elegido

**Error path — Pago rechazado:**
Si la transferencia falla (CBU incorrecta, cuenta cerrada), Spottruck intenta hasta 3 veces y notifica al transportista. Se ofrecen alternativas: corrección de CBU, cambio a Mercado Pago, o retiro en efectivo en punto de pago.

---

### Fase 11: Calificar a la Empresa

**"Esta empresa me hizo esperar 4 horas en el puerto. No voy a deixar pasar eso. Le pongo 2 estrellas y explico por qué."**

**Formulario de calificación:**
El transportista evalúa a la empresa en cuatro dimensiones (1-5 estrellas):
1. **Puntualidad en carga y descarga:** ¿La empresa respetó los horarios o hizo esperar al transportista?
2. **Claridad de instrucciones:** ¿Estaba bien detallado el viaje o había confusiones?
3. **Trato del personal:** ¿Los operadores de depósito fueron respetuosos o conflictivos?
4. **Exactitud de la información:** ¿La carga era como se describió o había sorpresas?

**Comentarios:**
El transportista puede dejar un comentario escrito (máximo 500 caracteres) que será visible para otros transportistas en la plataforma. Este es un sistema de reputación recíproco.

**"Completé el viaje y nunca me llamaron para confirmar. Tuve que llamar yo para saber si llegó la mercadería. Mal."**

**Emoción:** Justificado, a veces enojo. El transportista se siente con derecho a expresar su frustración porque invirtió tiempo y recursos.

**KPI objetivo:** Tasa de respuesta de calificación > 60%, comentario escrito > 30% de las calificaciones.

---

## Journey del Fleet Owner (Variante del Transportista)

**Contexto:**
"El团长" Martín tiene 5 camiones y 6 conductores. Gestiona su fleet desde una app web en su oficina de Rosario. No maneja personalmente todos los días; supervisa y coordina.

**Diferencias clave vs. Transportista individual:**

### Registro y Configuración
- Registro como "Fleet Owner" con datos de la empresa (razón social, CUIT, número de flota registrada en CNRT)
- Cada camión se registra individualmente con su propio vehículo y conductor asignado
- Dashboard especial para gestionar múltiples vehículos simultáneamente

### Gestión de Viajes
- Vista consolidado de todos los viajes activos en todos los vehículos
- Capacidad de asignar viajes específicos a vehículos específicos (optimización por ubicación, disponibilidad, rentabilidad)
- Reporting de rentabilidad por vehículo y por conductor

### Reporting y Analytics
- Dashboard de KPIs por fleet: tasa de utilización, ingresos promedio por camión, costos operativos, ROI por vehículo
- Comparativa de desempeño entre conductores dentro del fleet
- Alertas de mantenimiento preventivo según kilómetros recorridos

### Gestión de Pagos
- Consolidación de pagos de todos los vehículos
- Reporte mensual para contabilidad con filtro por vehículo, por conductor, por ruta
- Posibilidad de adelantos de pago para todo el fleet

**Error path — Vehículo en mantenimiento:**
Si un vehículo está fuera de servicio por mantenimiento, el Fleet Owner puede marcarlo como "No disponible" y el sistema no le ofrece viajes para ese vehículo hasta que se reactive.

---

## Destinatario Journey (1 página)

### ¿Quién es el Destinatario?

El destinatario es la persona en el punto de entrega que recibe la mercancía: un operario de depósito, un encargado de almacén, un security de puerto, o cualquier persona autorizada por la empresa para confirmar la recepción.

**"Yo trabajo en el depósito de una empresa de autopartes. Cuando llega un camión, tengo que verificar que la mercadería sea la correcta antes de firmar."**

### Fase 1: Recibir Notification de Entrega

**¿Cómo llega el destinatari a Spottruck?**
- La empresa (que usa Spottruck) le envía un código de verificación por email o WhatsApp
- El destinatario no descarga la app; recibe un link único para confirmar la entrega
- El link es temporal (válido por 48 horas) y específico para esa entrega

**Notificaciónreceived:**
"Tenés una entrega pendiente de verificar en Spottruck. Código: XK7-294. Transportista: Roberto Gómez. Camión: ABC123."

### Fase 2: Verificar la Entrega

**Al tocar el link:**
- Ve información del viaje: origen, destino, qué empresa contrató el transporte, descripción de la mercancía
- Puede ver fotos de la carga al momento del pickup
- Puede marcar llegadas de múltiples pallets o bultos si corresponde

**Confirmación:**
El destinatario debe confirmar:
1. Cantidad de bultos/pallets recibidos
2. Estado de la mercancía (OK o con daños visibles)
3. Fecha y hora de recepción
4. Su nombre y rol (opcional pero recomendado)

**Firma digital o código:**
- Puede dibujar su firma en la pantalla (touch signature)
- O ingresar un código PIN que la empresa le proporcionó
- O simplemente tocar "Confirmar" si no hay complicaciones

### Fase 3: Reportar Problemas (si corresponde)

**"Esto llegó con un pallet roto y faltan 2 cajas. No voy a firmar hasta que se registre."**

Si hay discrepancias:
1. El destinatario marca "Problema Reportado"
2. Describe el issue (daño, faltante, estado incorrecto)
3. Sube fotos como evidencia
4. Spottruck notifica a la empresa y al transportista automáticamente

**"La empresa va a recibir un email automático con las fotos y va a tener que resolver. Así no me hacen responsable a mí de algo que llegó mal."**

### Fase 4: Confirmación Completada

Una vez confirmado, el destinatario recibe un email de confirmación para sus registros.

**Emoción:** Eficiencia. El destinatari quiere hacer su trabajo rápido y correctamente sin complicaciones.

**KPI objetivo:** Tiempo promedio de confirmación < 2 minutos, tasa de problemas reportados > 5%.

---

## Re-engagement Flow — Usuarios Inactivos 30+ Días

**Contexto:**
"El团长" Marcelo se registró hace 3 meses, hizo 5 viajes, pero dejó de usar Spottruck. Quizás encontró trabajo estable, quizás tuvo problemas, quizás simplemente se olvidó.

**Trigger:** El sistema detecta inactividad de 30+ días sin login ni viajes activos.

**Secuencia de Re-engagement:**

### Día 30 — Email Motivacional
**Asunto:** "Marcelo, hay viajes que te están esperando"
**Contenido:**
- Métricas de lo que perdió: "Mientras estuviste inactivo, se publicaron 234 viajes en tu zona"
- Testimonio de otro transportista que reactivó exitosamente: "Yo también había dejado de usar pero reactivé hace 2 meses y ya recuperé mi inversión de tiempo." — Carlos M., transportista de Rosario
- Call to action claro: "Ver viajes disponibles ahora"

### Día 35 — Notificación Push Personalizada
**"Marcelo, tenés 3 viajes cerca de Córdoba que pagan más de $200.000. No los dejes escapar."**
 Incluye mapa con viajes específicos en su zona.

### Día 40 — Offer de Incentivo
**"Te devolvemos la comisión de tu primer viaje de vuelta. Solo $0 de comisión en tu primer viaje reactivado."**
 Código único: REACT30 (30% de descuento en comisión).

### Día 45 — Survey de Feedback (último intento)
**"Queremos saber por qué te fuiste. Tu opinión nos ayuda a mejorar."**
 Preguntas:
- ¿Encontraste otra plataforma mejor?
- ¿Tuviste problemas técnicos?
- ¿No había viajes en tu zona?
- ¿Prefieres trabajar por tu cuenta sin apps?
- ¿Otro motivo?

**Respuesta opción "problema técnico" → Se activa flujo de soporte al cliente.**

**Respuesta opción "otra plataforma" → Se preguntacuali y se registra para benchmarking.**

### Día 50 — Email de Despedida (si no reactiva)
**"Te vamos a extrañar, Marcelo. Tu cuenta sigue activa si querés volver. La puerta está abierta."**
 Incluye link para reactivar sin necesidad de registrarse de nuevo.

**KPI objetivo:** Tasa de re-engagement > 15%, viajes reactivados por usuario > 1.5.

---

## Journey de la Empresa (Completado)

### Fase 1: Descubrimiento y Registro

**Contexto del usuario:**
María es la responsable de logística de Pampac S.A., una pyme alimenticia de Córdoba que necesita mover 200 toneladas mensuales de productos terminados a Buenos Aires. Busca soluciones para reducir costos de transporte porque el call center actual le cobra excesivamente y los transportistas no tienen trazabilidad.

**"Necesito una solución que me deje ver dónde está mi mercadería en todo momento. Llamar al chofer y que no me conteste es mi peor pesadilla."**

**Discovery:**
- Recommendation de otra empresa en el rubro
- Publicidad en LinkedIn dirigida a logistics managers
- Búsqueda en Google: "plataforma subastas transporte carga Argentina"
- Artículo en la RAC (Revista de Autotransporte y Logística)

**Touchpoint:** Puede ser la app (descargada en su teléfono) o el sitio web desde su notebook de trabajo. María prefiere la versión web porque hace el onboarding desde su desktop en la oficina.

**Pantalla de bienvenida:**
- Mensaje claro sobre beneficios: transparencia en precios, trazabilidad en tiempo real, transportistas verificados por CNRT
- Testimonios de empresas que ya usan Spottruck
- CTA principal: "Crear cuenta Empresa"

**Registro solicita:**
- Razón social según documentación de AFIP
- Número de CUIT (para validación fiscal)
- Email corporativo
- Teléfono de contacto (para verificación)
- Contraseña segura

**Checkbox:** Aceptación de términos y política de privacidad (muchas empresas necesitan revisar internamente antes de aprobar — esto puede generar delay de 1-3 días según el tamaño de la empresa).

**Emociones:** Esperanzada pero con barreras de entrada. María sabe que configurar una nueva plataforma toma tiempo y quiere saber que vale la pena.

**KPI objetivo:** Tasa de inicio de registro > 70%, tasa de completación > 50%.

**Error path — CUIT inválido:**
Si el CUIT no existe en la base de AFIP, se muestra error indicando que verifique el número. La empresa no puede registrarse hasta que valide sus datos fiscales.

---

### Fase 2: Completar Perfil y Verificación

**"Primero tengo que configurar todo bien. Si la empresa no tiene perfil completo, los transportistas no confían."**

**Wizard de configuración en 3 pasos:**

**Paso 1 — Información Corporativa:**
- Sector industrial (Alimentario, Automotriz, Químico, Agricole, etc.)
- Volumen mensual estimado de viajes (para ajustar límites de crédito)
- Flota propia (cuántos vehículos tiene si tiene alguno)
- Sitio web de la empresa (para validar legitimidad)

**Paso 2 — Documentación (Opcional pero recomendado):**
- Certificado de AFIP (situación fiscal, Ingresos Brutos)
- Habilitación provincial si opera en jurisdicciones específicas
- Certificación ISO 9001 (si tiene)
- Estos documentos suben la credibilidad del perfil

**Paso 3 — Preferencias de Comunicación:**
- Canales preferidos: email, push, SMS
- Frecuencia: tiempo real para viajes urgentes, digest diario para planificación
- Idioma: español (único por ahora)
- Tiempo zonas horarias: ART (Argentina Time)

**Al completar, llega al dashboard principal:**
- Tour guiado de las funcionalidades principales
- Tutoriales en video sobre cómo crear el primer viaje
- Templates de viajes recurrentes para ahorrar tiempo

**Emociones:** Expectativa, un poco abrumada por la cantidad de opciones. Necesita validación de que está haciendo las cosas bien.

**KPI objetivo:** Tasa de completación de onboarding > 60%, tiempo de onboarding < 15 minutos.

---

### Fase 3: Crear un Viaje

**"Ahora viene lo importante. Si no creo bien el viaje, no voy a recibir buenas ofertas."**

**Desde el dashboard, María hace clic en "Crear Viaje":**

**FORMULARIO MULTI-PASO:**

**Paso 1 — Origen y Destino:**
- Dirección de recogida (autocompletado Google Maps — tricky en zonas industriales de Córdoba que no tienen direcciones normalizadas)
- Coordenadas GPS alternativas o descripción textual si no encuentra la dirección
- Fecha y hora preferida de recogida (date picker con disponibilidad)
- Opción de flota dedicada vs. grupaje (combinar con otras cargas para optimizar costos)
- Puntos de parada intermedios (para distribución urbana o múltiples entregas)

**Mapa interactivo muestra:**
- Ruta estimada
- Distancia total en km
- Tiempo de tránsito estimado
- Peajes en la ruta (precios estimados)

**Paso 2 — Características de la Carga:**
- **Tipo de carga:** General, Refrigerada, ADR (peligrosa), Sobredimensionada, Vehículos
- **Peso aproximado:** En toneladas (ej: 18 toneladas)
- **Volumen:** En metros cúbicos (si es relevante)
- **Valor declarado:** Para seguros (opcional pero recomendado)

**Según el tipo, aparecen campos específicos:**
- **Refrigerada:** Temperatura requerida (-18°C), tiempo máximo fuera de temperatura
- **ADR:** Clase específica (1.1 Explosivos, 2.1 Gases, 3 Líquidos, etc.), número UN, documentación de seguridad
- **Sobredimensionada:** Dimensiones exactas, permisos CNRT requeridos

**Paso 3 — Requisitos del Transportista:**
- Categoría de vehículo: Chasis, Semirremolque, Trailer
- Capacidad mínima en toneladas
- Equipamiento especial: Grúa, Elevador, Lona, GPS propio
- Experiencia verificada en tipo de carga
- Certificaciones vigentes: ADR, Transporte de Alimentos
- Ubicación geográfica del transportista (para optimizar pickup)

**Paso 4 — Configurar la Subasta:**
- Precio base de referencia (guía, no vinculante)
- Presupuesto máximo (si tiene restricción financiera clara)
- Fecha y hora de cierre de la subasta (mínimo 2 horas desde publicación)
- **Modalidad de selección:** Automática (mejor oferta al cierre) o Manual (revisar todas las ofertas)
- Instrucciones especiales: Horarios de carga restringidos, documentación requerida, equipos adicionales

**Paso 5 — Revisar y Publicar:**
- Resumen completo con mapa interactivo
- Opción de editar cualquier sección antes de publicar
- Estimación de costos totales (precio base + peajes + comisión Spottruck 12%)
- "Publicar Viaje" → Confirmación inmediata

**"Puse un viaje Córdoba-Buenos Aires, 18 toneladas de alimentos refrigerados. Cierre en 4 horas. Ahora a esperar ofertas."**

**Emoción:** Anticipación, responsabilidad. Si publica bien, recibirá buenas ofertas. Si publica mal, el viaje quedará desierto.

**KPI objetivo:** Tasa de viaje publicado > 85%, tasa de error en formulario < 10%.

**Error path — Viaje desierto (0 ofertas):**
Si después de 6 horas no hay ofertas, Spottruck notifica a la empresa:
- Sugerencia de ajuste de precio (+/- 10% sugerido)
- Verificación de requisitos (¿son muy restrictivos?)
- Opción de extender el horario de cierre
- Alternativa: contacting transportistas directamente via chat para invitarlos a ofertar

---

### Fase 4: Recibir y Evaluar Ofertas

**"Tengo 5 ofertas en 2 horas. La más barata es $195.000 pero tiene 3.5 estrellas. La más cara es $230.000 con 4.9 estrellas. ¿Cuál elijo?"**

**Dashboard de ofertas:**
- Contador de ofertas recibidas (actualizado en tiempo real)
- Tiempo restante hasta el cierre
- Ranking provisional de las mejores ofertas

**Cada oferta muestra:**
- Nombre del transportista
- Calificación promedio (1-5 estrellas)
- Cantidad de viajes completados en Spottruck
- Precio propuesto en ARS
- Hora estimada de llegada al pickup (calculada por distancia + tráfico)
- Mensaje opcional del transportista

**Herramientas de comparación:**
María puede comparar hasta 3 ofertas lado a lado:
| Transportista | Precio | Calificación | Viajes | Proximidad | Tiempo de respuesta |
|--------------|--------|--------------|--------|------------|---------------------|
| Roberto G. | $195.000 | ⭐ 3.5 | 12 | 45 km | 8 min |
| Carlos M. | $210.000 | ⭐ 4.8 | 87 | 120 km | 25 min |
| Jorge L. | $230.000 | ⭐ 4.9 | 156 | 200 km | 1 hora |

**Chat integrado:**
Si María tiene preguntas, puede enviar mensaje directo al transportista:
- "¿Tenés experiencia con carga refrigerada de alimentos?"
- "¿Podés cargar a las 5am?"
- "¿Tu camión tiene double deck para más capacidad?"

**Emociones:** Incertidumbre, análisis. María debe elegir y sabe que su decisión impacta la operación de su empresa.

**KPI objetivo:** Tiempo promedio de evaluación < 30 minutos, tasa de comunicación durante subasta > 30%.

**Error path — Oferta muy baja (posible dumping):**
Si una oferta es significativamente menor al promedio (ej: 40% por debajo), Spottruck muestra alerta: "Esta oferta está muy por debajo del mercado. Verificá que el transportista entienda los requisitos del viaje." María puede decidir si confiar o descartarla.

---

### Fase 5: Seleccionar Transportista y Adjudicar

**"Voy con Carlos. Tiene 4.8 estrellas, 87 viajes, y me responde rápido. El precio es justo."**

**Al adjudicar:**
1. María selecciona la oferta ideal
2. Sistema solicita confirmación con resumen del viaje
3. Se muestra comisión de Spottruck (12% del valor del viaje)
4. Al confirmar, se reserva el pago

**El transportista recibe:**
- Notificación push inmediata
- Email con detalles del viaje adjudicado
- Tiene 2 horas para confirmar aceptación

**Si el transportista no confirma a tiempo:**
Spottruck ofrece al siguiente postor en el ranking. María recibe notificación: "El transportista seleccionado no confirmó. Se ofreció el viaje al segundo postor. Confirmá si aceptás."

**Al confirmar ambos:**
- María recibe datos de contacto del transportista para coordinación directa
- El viaje aparece en "Viajes Activos"
- Se activa el tracking GPS

**Emociones:** Satisfacción, alivio. El viaje está adjudicado y en camino.

**KPI objetivo:** Tasa de aceptación por transportista > 85%, tiempo de cierre de negociación < 2 horas.

---

### Fase 6: Seguimiento del Viaje

**"Ya arrancó. Roberto salió de la fábrica hace 30 minutos. Puedo ver su posición en el mapa. Perfecto."**

**Tracking en tiempo real:**
- Mapa con posición actual del camión
- Ruta planificada vs. ruta real
- Puntos de entrega con estados (pendiente, en tránsito, completado)
- ETA actualizado según tráfico

**Alertas configurables:**
- Salida del punto de recogida
- Llegada a punto de entrega
- Retrasos detectados (threshold configurable)
- Incidencias reportadas por el transportista

**"Se metió en un'embotellamiento' en la Autopista Buenos Aires-Rosario. Le queda 1 hora para llegar. Le aviso al depósito."**

**Chat con transportista:**
María puede comunicarse directamente para coordinar detalles de última hora.

**Incidentes:**
Si surge algún problema (avería, accidente, condiciones climáticas), Spottruck:
1. Notifica a María inmediatamente
2. Ofrece alternativas (reasignación, retraso, cancelación)
3. Documenta todo para reclamos de seguro si corresponde

**Emociones:** Control, tranquilidad. María sabe en todo momento dónde está su mercadería.

**KPI objetivo:** Tasa de tracking activo > 99%, tiempo de resolución de incidencias < 4 horas.

---

### Fase 7: Confirmar Entrega y Cerrar Viaje

**"El camión llegó al depósito hace 10 minutos. Estoy esperando que el operario confirme la recepción."**

**El destinatario recibe link de verificación:**
- Confirma cantidad y estado de la mercancía
- Reporta cualquier problema (daños, faltantes)
- Firma digital o ingresa código PIN

**María recibe notificación:**
- Si todo está OK → "El viaje fue completado exitosamente"
- Si hay problemas → "Discrepancia reportada. El proceso de mediación está activo."

**Cierre del viaje:**
- Resumen con tiempos reales de pickup y delivery
- Distancia real recorrida
- Peajes utilizados
- Tiempo total de tránsito
- Datos exportables para reportes internos

**"El viaje duró 6 horas con 45 minutos. El transportista llegó 15 minutos tarde por el'trafico' pero no hubo daños. Todo OK."**

**Emociones:** Alivio, satisfacción. El viaje se completó correctamente.

**KPI objetivo:** Tasa de cierre sin disputas > 92%, tiempo de cierre < 1 hora post-entrega.

**Error path — Disputa de entrega:**
Si el destinatario reporta problema, se activa el flujo de mediación de Spottruck:
1. Se congelan fondos hasta resolución
2. Se solicita evidencia de ambas partes (fotos, timestamps, documentos)
3. Se evalúa y propone resolución (descuento proporcional, reenvío, compensación)
4. Si no hay acuerdo, se involucra a un mediador humano

---

### Fase 8: Calificar al Transportista

**"Carlos fue muy profesional. Siempre me mantuvo informado y llegó en tiempo. Le pongo 5 estrellas."**

**Formulario de calificación (4 dimensiones):**
1. **Calidad del servicio:** Puntualidad en pickup y delivery, cuidado de la mercancía
2. **Comunicación:** Claridad de información, respuesta rápida a mensajes
3. **Profesionalismo:** Comportamiento, estado del vehículo, presentación del conductor
4. **Relación calidad-precio:** Si el servicio valió lo que se pagó

**Comentario escrito:**
María puede dejar feedback que será visible en el perfil público del transportista (anonimizado para otras empresas).

**"El viaje estuvo perfecto. Destacar la puntualidad y la comunicación durante todo el trayecto. 100% recomendable."**

**Emoción:** Satisfacción, justicia. María quiere que los buenos transportistas sean reconocidos.

**KPI objetivo:** Tasa de calificación completada > 70%.

---

### Fase 9: Analizar y Optimizar

**"Mis costos de transporte bajaron un 12% desde que uso Spottruck. Y tengo mejor trazabilidad."**

**Dashboard de Analytics:**
- Promedio de precio pagado por tipo de carga y ruta
- Desviación respecto al precio de mercado
- Transportistas más confiables (por calificación)
- Tendencias de precio mes a mes
- Comparativa de costos internos vs. Spottruck

**Reportes exportables:**
- CSV/Excel para análisis en herramientas externas
- PDF para presentación a directivos
- Comparativas históricas (último trimestre, semestre, año)

**Optimización:**
María puede ver sugerencias como:
- "Viajes similares en tu ruta se están pagando $195.000 promedio. Tus últimos viajes pagaron $210.000."
- "Transportista destacado para carga refrigerada: Carlos M. (4.9 ⭐, 87 viajes)"
- "Tu tiempo promedio de contratación es 4 horas. Las empresas más eficientes contratan en 2 horas."

**Emociones:** Empoderamiento, orgullo. María tiene datos para justificar sus decisiones y mejorar continuamente.

**KPI objetivo:** Tasa de uso de analytics > 40%, reducción de costos promedio > 10%.

---

## Sección de Casos Extremos (Edge Cases)

### Para Transportistas

**Edge Case 1: Verificación fallida**
- Causa: Documentación vencida, vehículo con deudas pendientes, license suspendida
- Flujo: Spottruck muestra причину específica del rechazo, no solo "rechazado genérico"
- Opciones: El transportista puede corregir y re-enviar, o apelar si considera que hay error
- Tiempo de re-verificación: 24 horas si la documentación está completa

**Edge Case 2: Viaje desierto (0 ofertas)**
- Causa: Precio muy bajo, requisitos muy restrictivos, zona con pocos transportistas
- Flujo: Spottruck envía sugerencia de ajuste de precio +14 días, extiende validez del viaje
- Impacto: El transportista no pierde nada, la empresa debe ajustar su estrategia

**Edge Case 3: Avería mecánica en ruta**
- Causa: Falla mecánica, pinchadura, accidente
- Flujo: Reporte en app → Notificación a empresa → Opciones de resolución (reasignación, demora, cancelación)
- Seguro: Se activa cobertura de insurance si el viaje tenía seguro incluido
- Documentación: Todo queda registrado para procesos de reclamo

**Edge Case 4: Condiciones climáticas extremas**
- Causa: Nevadas en RN40 (Patagonia), inundaciones en RN12 (Litoral), tormentas en Córdoba
- Flujo: Spottruck activa protocolo de emergencia, permite extensión de plazos sin penalización
- Comunicación: Notificaciones proactivas a empresas sobre delays esperados

**Edge Case 5: Empresa que no paga**
- Causa: Disputa sobre calidad del servicio, problemas financieros de la empresa, rechazo de delivery
- Flujo: Proceso de mediación de Spottruck, si no hay acuerdo, se involucra a arbitraje
- Protección: Fondos congelados hasta resolución (máximo 30 días)
- Historial: La empresa queda marcada en el sistema, afecta su reputación

**Edge Case 6: Loading/Unloading muy lento**
- Causa: DEP (destinatario lento, depósito desordenado, falta de personal)
- Flujo: El transportista reporta wait time documentado, se descuenta del SLA del viaje
- Impacto: Si el wait time supera 2 horas, se activa compensación automática al transportista

**Edge Case 7: Cross-border complications**
- Para viajes a Brasil, Bolivia, Chile (si aplica)
- CNRT requiere documentación específica: CRT (Certificado de Transporte), habilitación internacional
- ADR internacional tiene requisitos diferentes
- Este edge case requiere onboarding específico y verificación de documentos especiales

**Edge Case 8: Sobrecarga del vehículo**
- Causa: Empresa cargó más peso del acordado
- Flujo: Transportista debe reportar antes de partir si detecta sobrepeso
- Implicaciones: Legales (CNRT multan overload),安全问题 (freno, desgaste de cubiertas)
- Solución: Spottruck sugiere pesar en balanza certificaday reportar discrepancia

### Para Empresas

**Edge Case 1: Transportista no llega al pickup**
- Causa: No confirmó a tiempo, canceló, emergencia personal
- Flujo: Spottruck ofrece al siguiente postor automáticamente (si selección automática)
- Si selección manual: Notificación inmediata para que la empresa elija替代
- Impacto: Retraso en operación, potencial multa si hay compromisos downstream

**Edge Case 2: Mercadería dañada en tránsito**
- Causa: Manejo inadecuado, accidente, condiciones climaticas
- Flujo: Reporte del destinatario → Activación de proceso de reclamo → Evaluación de evidencia
- Resolución: Compensación según valor declarado, deducción del pago al transportista
- Seguro: Spottruck tiene seguro base incluido por default, upgrade disponible para cargas de alto valor

**Edge Case 3: Destinatario no disponible para recepción**
- Causa: Warehouse cerrado, personal enfermo,，拒绝接收
- Flujo: Transportista marca wait time, reporta incidencia
- Solución: Empresa debe designar alternative contact o esperar reintento
- Impacto: El wait time se documenta y puede generar costo adicional

**Edge Case 4: Viaje cancelado por la empresa después de adjudication**
- Causa: La empresa ya no necesita el servicio, cambió de planes
- Flujo: Se aplica política de cancelación: Si < 24h antes del pickup, se retiene 20% del valor
- Protección: El transportista recibe compensación por oportunidad perdida

**Edge Case 5: Error en la descripción de la carga**
- Causa: La empresa subestimó peso, olvidó especificar temperatura, no mencionó que es ADR
- Impacto: Transportistas rechazan el viaje al llegar, o pidiendo ajustes de precio
- Solución: Spottruck permite editar el viaje hasta que haya ofertas recibidas (no después)
- Feedback: Si ocurre frecuentemente, Spottruck sugiere mejorar templates de viaje

**Edge Case 6: Retraso en pago al transportista**
- Causa: Empresa no confirma receipt, dispute en curso, problemas financieros
- Flujo: Spottruck procesa el pago al transportista igual ( Spottruck adelantó el pago si eligió opción instantánea)
- Recuperación: Spottruck recupera el fondos de la empresa más comisión de mora si aplica
- Historial: La empresa queda marcada por delay en pagos

**Edge Case 7: Viaje grupaje donde una empresa no cumple**
- Para grupaje: múltiples empresas comparten un mismo camión
- Si una empresa no carga a tiempo, afecta a las demás
- Solución: Spottruck permite separar viajes grupaje en sub-viajes independientes
- Penalty: La empresa responsable paga compensación a las demás

---

## Contexto Logístico Argentino

### CNRT y Regulación

La Comisión Nacional de Transporte (CNRT) es el organismo regulador que establece las reglas del juego para el transporte de carga en Argentina:

**Requisitos para Transportistas:**
- Licencia de conducir Categoría E mínimo para vehículos de carga pesada
- Habilitación profesional vigente (para transporte de sustancias peligrosas)
- Horas máximas de conducción: 8 horas diarias (con excepciones para rutas largas)
- Tiempos de descanso obligatorios: 30 minutos cada 4 horas
- Mantenimiento preventivo obligatorio documentado
- Seguro Obligatorio de Responsabilidad Civil (SCTR)

**Requisitos para Vehículos:**
- Verificación técnica vehicular (VTV) vigente
- Habilitación de la CNRT para transporte de carga
- Matafuegos (extintor) a bordo con carga vigente
- Alarmas de retroceso
- Cinturón de seguridad para conductor y acompañante

**Para Sustancias Peligrosas (ADR):**
- Vehículo homologado para transporte de materiales peligrosos
- Conductor con certificación ADR vigente
- Documentación específica: Ficha de Emergencia, Constancia de Capacitación
- Placas de risk naranja en el vehículo

### Radial Argentina y Rutas Principales

La Red Nacional de Rutas (Radial Argentina) conecta los principales centros de producción y consumo del país:

**Corredores principales:**
- **Corredor Norte:** Buenos Aires - Santa Fe - Resistencia - Posadas (hacia Brasil)
- **Corredor Central:** Buenos Aires - Rosario - Córdoba - San Miguel de Tucumán
- **Corredor Oeste:** Buenos Aires - Mendoza - San Juan - San Luis
- **Corredor Patagónico:** Buenos Aires - Bahía Blanca - Trelew - Comodoro Rivadavia

**Zonas de alta demanda:**
- **Gran Buenos Aires:** Concentración industrial, muchos viajes de distribución
- **Puerto de Rosario:** Exportaciones agrícolas, containers, alta demanda de bitrenes
- **Campana/Zárate:** Industrial petroquímica, sustancias peligrosas frecuentes
- **Córdoba:** Agroindustria, cereales, carga general

### Operación de Puertos

Los puertos argentinos tienen particularidades que impactan la logística:

**Puerto de Rosario:**
- Especialización en granos y subproductos agroindustriales
- Horarios de acceso restringidos (ventana de 6am a 10pm)
- Alta competencia por accesos, esperas frecuentes (2-4 horas)
- Requiere coordinación previa con OPERADOR PORTUARIO

**Puerto de Buenos Aires:**
- Contenedores, importación/exportación diversificada
- Troncalidad复杂性, múltiples accesos
- Controles de seguridad estrictos (RADARGRAL, Aduana)
- Operatoria 24/7 pero con procesos administrativos lentos

**Puerto de Campana:**
- Industrial, vehículos, maquinaria agrícola
- Acceso por RN9 luego virar a RN234
- Mejor capacidad de atención que Rosario, menos espera

### Contexto Económico

La volatilidad económica argentina impacta directamente en el transporte de carga:

**Combustible:**
- Precio del diésel variable semanalmente (IPC / YPF)
- Diferencia de precios entre provincias (hasta 15% de variación)
- Spottruck debe actualizar referencias de precios frecuentemente

**Neumáticos:**
- Casi 100% importado, precio en USD
- Costos representan 25% del costo operativo total
- Calidad crítica para seguridad y rentabilidad

**Peajes:**
- Sistema AU (Autopistas) y RN (Rutas Nacionales)
- Precios varían según tipo de vehículo (ejes)
- Paso del Sistema de Toll: $15.000 - $50.000 para camión con acoplado

**Mecánica de negocio:**
- Costos operativos en ARS pero algunos insumos en USD
- Tipo de cambio aflactua directamente en costos reales
- Transportistas que no actualizan costos pueden perder dinero

---

## Métricas y KPIs por Fase

### Transportista KPIs

| Fase | KPI | Target | Medición |
|------|-----|--------|----------|
| Registro | Tasa de completación | > 65% | Viajes iniciados / completados |
| Registro | Tiempo promedio | < 8 min | Cronometrado desde inicio hasta submit |
| Verificación | Tiempo de verificación | < 24h (80%), < 48h (95%) | Desde submit hasta approval |
| Exploración | Viajes visualizados por sesión | > 8 | Analytics de sesión |
| Oferta | Tasa de oferta completada | > 60% | Ofertas iniciadas / completadas |
| Oferta | Precio promedio vs referencia | ± 10% | Benchmark interno |
| Ejecución | Reporte de incidencias | < 5 min | Desde occurrence hasta reporte |
| Pago | Tasa de cobro instantáneo | > 35% | Elección instantánea / total |
| Rating | Tasa de respuesta | > 60% | Ratings completados / total invitaciones |

### Empresa KPIs

| Fase | KPI | Target | Medición |
|------|-----|--------|----------|
| Registro | Tasa de completación | > 50% | Empresas registradas / que publicaron viaje |
| Onboarding | Tiempo de onboarding | < 15 min | Cronometrado |
| Creación | Tasa de error en formulario | < 10% | Errores técnicos / intentos |
| Subasta | Viajes con ofertas | > 85% | Viajes con al menos 1 oferta |
| Selección | Tiempo de evaluación | < 30 min | Desde primera oferta hasta selección |
| Tracking | Tasa de tracking activo | > 99% | Tracking activo / viajes en curso |
| Cierre | Tasa de cierre sin disputas | > 92% | Cierres ok / total |
| Analytics | Uso de dashboard | > 40% | Login en analytics / total logins |

---

## Mejores Prácticas y Recomendaciones

### Para Transportistas

1. **Mantener perfil actualizado:** Foto profesional, certificaciones vigentes, vehículo limpio en fotos
2. **Usar la calculadora siempre:** No ofertar a pérdida, considerar todos los costos
3. **Reportar incidencias inmediatamente:** La documentación en tiempo real es clave para disputas
4. **Responder rápido a mensajes de empresas:** Tiempo de respuesta afecta ranking
5. **Calificar a empresas honestamente:** Retroalimentación ayuda a toda la comunidad
6. **Planificar retornos:** Buscar viajes de retorno antes de partir vacío

### Para Empresas

1. **Crear descripciones detalladas:** Más información = más ofertas relevantes
2. **Usar fotos de la carga:** Los transportistas confían más en viajes con imágenes
3. **Ser responsive:** Chat durante la subasta aumenta probabilidad de buenas ofertas
4. **Confirmar recepción rápido:** Desbloquea el pago al transportista
5. **Calificar constructivamente:** Feedback detallado ayuda a transportistas a mejorar
6. **Revisar analytics regularmente:** Datos informados decisiones

### Transversal

1. **Comunicación proactiva:** Notificar antes de que surjan problemas
2. **Documentación completa:** Fotos, timestamps, firmas digitales
3. **Transparencia de costos:** Evitar sorpresas al momento del pago
4. **Flexibilidad:** En logística, siempre hay imprevistos

---

## ANEXO: Tablas de Journey de la Empresa

| Fase | Touchpoint | Pantalla/Funcionalidad | Emoción | Pensamiento | Oportunidad |
|------|------------|------------------------|---------|-------------|-------------|
| Descubrimiento | Recomendación de par | Web/App Store | Esperanza, dudas | "¿Será mejor que lo que tengo?" | Demo gratuito, casos de éxito |
| Registro | Formulario CUIT | Pantalla de registro | Moderación, confianza | "Esto va a tardar. Necesito los papeles." | Progreso visual, guardar avance |
| Perfil | Wizard multi-step | Dashboard setup | Overwhelm, concentración | "Tengo que configurar todo bien" | Templates pre-listo |
| Crear | Formulario viaje | 5 pasos estructurados | Responsabilidad, excitement | "Si lo creo bien, van a llegar ofertas" | Auto-fill inteligente, templates recurrentes |
| Ofertas | Dashboard competitivo | Lista de ofertas | Análisis, incertidumbre | "¿Cuál elijo? Hay 5 opciones" | Comparador lado a lado |
| Selección | Botón adjudicar | Confirmación final | Satisfacción, cierre | "Listo, esto se va a ejecutar bien" | Integración con calendario, recordatorios |
| Tracking | Mapa en tiempo real | Posición GPS actual | Control, calma | "Sé exactamente dónde está mi carga" | Alertas configurables, notificaciones |
| Entrega | Link verificación | Destinatario confirma | Alivio, espera | "Llegó bien, ahora a confirmar" | Confirmación en 1 click, firma digital |
| Pago | Historial de pagos | Estado del viaje | Ansiedad financiera | "¿Cuándo le pagan al transportista?" | Transparencia de timing |
| Rating | Formulario post-viaje | Popup de calificación | Justificado, crítico | "Este transportista fue excelente" | Guías de feedback |

---

## ANEXO: Journey Map del Fleet Owner

| Fase | Touchpoint | Pantalla/Funcionalidad | Emoción | Pensamiento | Oportunidad |
|------|------------|------------------------|---------|-------------|-------------|
| Registro | Datos empresa + flota | Registro corporativo | Profesional, serius | "Esto es para mi negocio, no para mí" | Validación de flota CNRT |
| Config | Agregar vehículos | Gestión de flota | Control, organization | "Tengo 5 Trucks que gestionar" | Dashboard consolidado |
| Asignación | Matching de vehículos | Mapa de viajes vs vehículos | Estratégico, optimization | "¿Cuál Truck va a cuál viaje?" | Algoritmo de optimización |
| Pagos | Consolidación de ingresos | Resumen de fleet | Alivio, clarity | "Hoy cobré $900.000 entre todos" | Reporte unificado, exportación contable |
| Reporting | Analytics de fleet | KPIs por Truck vs fleet | Empower, control | "¿Cuál Truck rindió mejor?" | Benchmark interno |

---

**Fin del Documento**

*Este documento debe revisarse y actualizarse trimestralmente conforme se validan más insights con investigación de usuarios en el mercado argentino. Las mejoras de UX deben priorizarse basándose en el impacto estimado en las tasas de conversión en cada etapa del journey.*

*Fecha de última actualización: 4 de junio de 2026*
*Versión: 2.0*
*Responsable: Spottruck Product Team*