---
title: "Spottruck - Referencia de Wireframes"
date: 2026-06-04
author: Guillermo Riedel
status: draft
tags: [wireframes, ux, spottruck]
---

# Spottruck — Referencia de Wireframes

## Introducción

Este documento establece la referencia visual y funcional para todos los wireframes de Spottruck, la plataforma de logística y transporte de carga. El objetivo es garantizar consistencia en el diseño y facilitar la comunicación entre equipos de producto, desarrollo y diseño.

Spottruck opera en dos dimensiones principales: una **app móvil** orientada al conductor (flete/chofer) y una **aplicación web** orientada a la empresa (cargador/logistica). Ambas interfaces comparten vocabulario visual y flujos de navegación coherentes, priorizando la experiencia mobile-first dada la naturaleza operativa del conductor en ruta.

---

## 0. Pantalla de Login / Registro

### Login (Credenciales tradicionales)

```
┌─────────────────────────────────┐
│                                 │
│        ┌───────────┐            │
│        │   🚚      │            │ ← Logo Spottruck
│        │ SPOTTRUCK │            │
│        └───────────┘            │
│                                 │
│    Transportá carga,            │
│    generá ingresos              │
│                                 │
│  ════════════════════════════   │
│                                 │
│  📧 Email o teléfono            │
│  ┌─────────────────────────┐    │
│  │ ejemplo@mail.com        │    │
│  └─────────────────────────┘    │
│                                 │
│  🔒 Contraseña                  │
│  ┌─────────────────────────┐    │
│  │ ••••••••••              │    │
│  └─────────────────────────┘    │
│  [ ] Recordarme                 │
│                                 │
│  ┌─────────────────────────┐    │
│  │      INGRESAR           │    │ ← CTA primario
│  └─────────────────────────┘    │
│                                 │
│  ¿Olvidaste tu contraseña?      │
│                                 │
│  ════════════════════════════   │
│                                 │
│  ¿No tenés cuenta?              │
│  [  CREAR CUENTA  ]            │ ← CTA secundario
│                                 │
└─────────────────────────────────┘
```

**Descripción del Layout:**
- **Zona superior:** Logo centrado con tagline que comunica la propuesta de valor.
- **Campos de formulario:** Email/teléfono y contraseña apilados verticalmente.
- **Checkbox "Recordarme":** Persistencia de sesión para evitar re-login frecuente.
- **CTA primario:** Botón "INGRESAR" full-width, color primario (naranja Spottruck).
- **Link de recuperación:** Texto clickeable para flujo de password reset.
- **Zona inferior:** Separador visual y CTA para crear cuenta.

**Elementos Interactivos:**
- Tap en campo email → abre teclado alfanumérico con autocompletado
- Tap en campo contraseña → muestra/oculta password con toggle
- Tap en "Recordarme" → guarda sesión en storage local
- Tap en "INGRESAR" → valida credenciales y redirige según rol
- Tap en "¿Olvidaste tu contraseña?" → abre modal de recuperación
- Tap en "CREAR CUENTA" → navega a pantalla de registro
- Tecla "Enter" → submit del formulario

**Flujo de Usuario:**
- El usuario ingresa sus credenciales. Si son válidas, el sistema detecta su rol (conductor, empresa, admin) y lo redirige al dashboard correspondiente. Credenciales inválidas muestran error inline sin locking temporal (manejo de intentos en backend).

**Estados:**
- Default: Campos vacíos, botones habilitados
- Loading: Spinner en botón, campos deshabilitados
- Error: Mensaje rojo debajo del campo inválido, shake animation
- Success: Redirect al dashboard

**Responsive Mobile-First:**
- Diseño centrado con max-width de 400px
- Inputs con altura de 52px para fácil tap
- Keyboard-aware layout (scroll automático para mantener campos visibles)

---

### Registro (Selección de rol + datos)

```
┌─────────────────────────────────┐
│  ← Volver           CREAR CUENTA│
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐    │
│  │  SELEccioná tu rol      │    │
│  │  ¿Cómo querés usar      │    │
│  │  Spottruck?             │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  🚛 SOY CONDUCTOR      │    │ ← Card seleccionable
│  │  Tengo camión y busco   │    │
│  │  carga para transportar │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  🏢 SOY EMPRESA        │    │ ← Card seleccionable
│  │  Tengo carga y busco   │    │
│  │  transportistas        │    │
│  └─────────────────────────┘    │
│                                 │
│  ════════════════════════════   │
│                                 │
│  📧 Email                       │
│  ┌─────────────────────────┐    │
│  │ ejemplo@mail.com        │    │
│  └─────────────────────────┘    │
│                                 │
│  📱 Teléfono                   │
│  ┌─────────────────────────┐    │
│  │ +54 9 341 123 4567      │    │
│  └─────────────────────────┘    │
│                                 │
│  🔒 Contraseña                  │
│  ┌─────────────────────────┐    │
│  │ Mínimo 8 caracteres     │    │
│  │ ••••••••               │    │
│  └─────────────────────────┘    │
│                                 │
│  🔒 Confirmar contraseña        │
│  ┌─────────────────────────┐    │
│  │ ••••••••               │    │
│  └─────────────────────────┘    │
│                                 │
│  [ ] Acepto Términos y Cond.   │
│     y Política de Privacidad   │
│                                 │
│  ┌─────────────────────────┐    │
│  │   CREAR MI CUENTA       │    │
│  └─────────────────────────┘    │
│                                 │
│  ¿Ya tenés cuenta?              │
│  [  INICIAR SESIÓN  ]          │
│                                 │
└─────────────────────────────────┘
```

**Descripción del Layout:**
- **Header:** Flecha de retorno, título "CREAR CUENTA".
- **Step inicial de rol:** Cards grandes seleccionables con ícono, título y descripción breve. Solo uno puede estar seleccionado (radio behavior).
- **Campos del formulario:** Email, teléfono (con código de país predefinido +54), contraseña con hint de requisitos mínimos, confirmar contraseña.
- **Checkbox de términos:** Vínculo a documentos legales.
- **CTA final:** "CREAR MI CUENTA" disabled hasta seleccionar rol y completar todos los campos válidos.
- **Link de login:** Para usuarios que ya tienen cuenta.

**Elementos Interactivos:**
- Tap en card de rol → selecciona rol (borde naranja, checkmark), actualiza campos requeridos según rol
- Tap en email → keyboard email
- Tap en teléfono → keyboard numérico con formateo automático
- Tap en contraseña → toggle visibility + validador de requisitos
- Tap en "Acepto términos" → checkbox toggle
- Tap en "CREAR MI CUENTA" → valida todo y crea cuenta → envía email de verificación
- Tap en términos → abre modal con PDF/legal

**Diferencias por Rol:**

*Conductor adicional:*
- DNI / CUIL
- Datos del vehículo (marca, modelo, patente, tipo)
- Habilitaciones (CNRT, seguro, habilitación de carga)
- Foto de perfil

*Empresa adicional:*
- Razón social
- CUIT
- Datos de facturación
- Dirección

**Flujo de Usuario:**
- El usuario selecciona primero su rol, lo cual define los campos adicionales a completar. Completa el formulario común y los campos específicos de su rol. Al registrar, recibe un email/SMS de verificación. Una vez verificado, accede directamente al dashboard correspondiente.

**Estados:**
- Default: Sin rol seleccionado, campos vacíos
- Rol seleccionado: Campos adicionales aparecen con animación
- Validando: Spinner en botón
- Error de validación: Campos inválidos con mensaje inline
- Verificación pendiente: Pantalla de "Te enviamos un email"

**Responsive Mobile-First:**
- Cards de rol apiladas verticalmente
- Formulario single column
- Keyboard-aware scrolling
- Campos condicionales animados con height transition

---

## Aplicación Móvil — Screens para Conductores

### 1. Pantalla Principal / Dashboard

```
┌─────────────────────────────────┐
│ ≡  Buenos días, Marcos!  🔔    │ ← Header con menú hamburguesa
│     ⭐ 4.7  |  🔒 Trust: 85%   │ ← Badge de confianza y rating
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🚚 Viaje en curso       │   │ ← Card de estado activo
│  │ ████████████░░░  80%    │   │ ← Barra de progreso
│  │ Rosario → Buenos Aires  │   │
│  │ ETA: 14:30              │   │
│  │ Cemento | 22 tons        │   │
│  └─────────────────────────┘   │
│                                 │
│  ── Viajes disponibles ──      │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 📍 CBA → MDA            │   │
│  │ Carga general | 8 tons   │   │ ← Lista scrolleable
│  │ $45.000 | ⏱ 6h          │   │ ← Precio y duración
│  │ ━━━━━━━━━━━              │   │ ← Indicador distancia
│  │ [Ver detalles]          │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 📍 ROS → BA             │   │
│  │ Refrigerado | 12 tons   │   │
│  │ $78.000 | ⏱ 8h          │   │
│  │ ━━━━━━━━━━━              │   │
│  │ [Ver detalles]          │   │
│  └─────────────────────────┘   │
│                                 │
│                          [+]    │ ← FAB: nuevo viaje
├─────────────────────────────────┤
│  🏠    🔍    🚚    💬    👤   │ ← Bottom navigation
└─────────────────────────────────┘
```

**Descripción del Layout:**
- **Header:** Saludo personalizado con hora del día, badge de rating (estrellas) y score de confianza (trust score).
- **Zona superior:** Si existe un viaje activo, se muestra una card prominente con barra de progreso, ruta, tipo de carga y ETA.
- **Zona media:** Lista de viajes disponibles en el área cercana al conductor. Cada card muestra origen/destino, tipo de carga, peso, precio y tiempo estimado.
- **FAB (Floating Action Button):** Botón de acción rápida para buscar nuevos viajes, posicionado en esquina inferior derecha.
- **Bottom Navigation:** 5 íconos — Inicio, Buscar, Viajes Activos, Mensajes, Perfil.

**Elementos Interactivos:**
- Tap en viaje disponible → navega a Trip Detail
- Tap en viaje activo → navega a Tracking Screen
- Tap en FAB → abre filtro de búsqueda avanzada
- Pull-to-refresh → actualiza lista de viajes

**Flujo de Usuario:**
- Desde esta pantalla, el conductor puede iniciar búsqueda de carga, monitorear viaje activo, o acceder a su perfil. Es el hub central de la experiencia móvil.

**Responsive Mobile-First:**
- Diseño de 375px de ancho base (iPhone SE/standard)
- Cards apiladas verticalmente con altura variable según contenido
- Touch targets mínimo 44px
- Bottom nav fija en parte inferior con safe area para iPhone X+

---

### 2. Detalle de Viaje (Trip Detail)

```
┌─────────────────────────────────┐
│ ← Volver                    👍   │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │     MAPA ESTÁTICO       │   │ ← Preview del recorrido
│  │   [Rosario → BsAs]      │   │
│  │    ●━━━━━━━━━━○         │   │ ← Línea de ruta
│  └─────────────────────────┘   │
│                                 │
│  ROSARIO, SF → BS AS, CBA       │ ← Origen → Destino
│  ════════════════════════════   │
│                                 │
│  📦 Carga general              │
│  ⚖️ 8.000 kg                   │
│  📐 Volumen: 20m³               │
│                                 │
│  📅 Recogida: 05 Jun 08:00     │
│  📅 Entrega: 05 Jun 14:30      │
│                                 │
│  ════════════════════════════   │
│                                 │
│  💰 Tu oferta: $45.000         │ ← Precio fijo o iniciar puja
│  ━━━━━━━━━━━━━━━━━━━━━━       │
│                                 │
│  ── Ofertas activas ──         │
│  👤 Juan M.      $44.500  2m   │
│  👤 Diego R.     $43.000  5m   │
│  👤 Martín L.    $42.000  8m   │
│                                 │
│  ┌─────────────────────────┐   │
│  │   [ REALIZAR OFERTA ]   │   │ ← CTA principal
│  │      $45.000            │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │   [ ENTRAR A SUBASTA ]  │   │ ← Si es auction
│  └─────────────────────────┘   │
│                                 │
│  ── Info del anunciante ──     │
│  🏢 Logísticas del Litoral    │
│  ⭐ 4.8 | 120 viajes           │
│  📞 Ver teléfono               │
│                                 │
│  🚛 Camión: Volcador 12m       │
│  ✅ Habilitación CNRT vigente  │
│  💳 Pago verificado            │
└─────────────────────────────────┘
```

**Descripción del Layout:**
- **Header:** Flecha de retorno, título del viaje, botón de favoritos.
- **Mapa preview:** Representación estática de la ruta con indicadores de origen (●) y destino (○).
- **Información de carga:** Tipo demercadería, peso, volumen, fechas de pickup y delivery.
- **Sección de precio:** Muestra el precio actual y la lista de ofertas activas (si es auction).
- **CTAs:** Botones primarios para realizar oferta directa o entrar a subasta.
- **Info del anunciante:** Rating, cantidad de viajes completados, datos de contacto, y verificación de cuenta.

**Elementos Interactivos:**
- Tap en mapa → expande a vista de mapa interactivo
- Tap en "Realizar oferta" → modal de confirmación de monto
- Tap en "Entrar a subasta" → navega a Auction Live Screen
- Tap en perfil del anunciante → abre Driver/Company Profile Modal
- Tap en teléfono → abre selector de app de llamadas

**Flujo de Usuario:**
- El conductor llega a esta pantalla desde el Dashboard o desde la lista de búsqueda. Aquí decide si realizar una oferta fija o competir en la subasta. El flujo culmina en confirmación de oferta o entrada a puja.

**Responsive Mobile-First:**
- Scroll vertical para contenido extenso
- Mapa con altura fija de 180px
- Botones CTA sticky en zona inferior con padding de safe area
- Lista de ofertas con scroll interno si excede 3 items

---

### 3. Subasta en Vivo (Auction Live Screen)

```
┌─────────────────────────────────┐
│ ← Volver           SUBASTA 🔥   │
├─────────────────────────────────┤
│                                 │
│        ⏱️ 04:32                 │ ← Countdown timer prominente
│         restante                │
│                                 │
│  ════════════════════════════   │
│                                 │
│       💰 $47.500                │ ← Precio actual destacado
│       Tu máxima: $50.000        │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Tu puja máxima:         │   │
│  │ [$__________]           │   │ ← Input para nueva puja
│  │ [  CONFIRMAR PUJA  ]   │   │
│  └─────────────────────────┘   │
│                                 │
│  [ ] Puja automática           │ ← Toggle proxy bid
│     (protege tu máximo)         │
│                                 │
│  ════════════════════════════   │
│                                 │
│  ── Historial de pujas ──       │
│                                 │
│  👤 Carlos G.    $47.500  1m   │
│  🟢 Tú           $46.000  2m   │
│  👤 Juan M.      $45.500  3m   │
│  👤 Diego R.     $45.000  5m   │
│  👤 Martín L.    $44.000  8m   │
│                                 │
│  📊 Ranking: 2do de 4          │
│  ════════════════════════════   │
│                                 │
│  📦 Carga general | 8 tons     │
│  📍 CBA → MDA | 6h viaje       │
│                                 │
│      [ RETIRARME ]             │ ← Salir de la puja
│                                 │
└─────────────────────────────────┘
```

**Descripción del Layout:**
- **Header:** Retorno, título "SUBASTA" con indicador de calor (emoji 🔥).
- **Timer:** Cuenta regresiva prominente en el centro-superior. Formato MM:SS.
- **Precio actual:** Monto destacado grande, seguido de "Tu máxima: $XX" si ya estableció un límite.
- **Input de puja:** Campo numérico para ingresar monto y botón de confirmación.
- **Toggle de puja automática:** Switch para activar proxy bidding — la plataforma pujará automáticamente hasta el máximo definido.
- **Historial:** Lista cronológica invertida de todas las pujas con nombre del competidor, monto y tiempo relativo.
- **Ranking:** Indicador de posición actual del conductor en la puja.
- **Info resumida del viaje:** Debajo del historial para consulta rápida.
- **Botón de retiro:** Opción para salir de la subasta.

**Elementos Interactivos:**
- Input numérico → acepta solo valores superiores al当前 precio mínimo
- Botón "Confirmar puja" → procesa puja y actualiza historial
- Toggle proxy bid → activa/desactiva pujas automáticas
- Pull-to-refresh → actualiza estado de la puja en tiempo real
- Botón "Retirarme" → confirmación antes de salir

**Flujo de Usuario:**
- Desde Trip Detail, el conductor ingresa a la subasta. Puede pujar manualmente, activar proxy bidding, o retirarse. La pantalla actualiza en tiempo real conforme otros conductores pujan. Al terminar (timer o GANADOR), se muestra resultado y opción de aceptar viaje.

**Responsive Mobile-First:**
- Timer fijo en zona superior, no scrollea
- Teclado numérico aparece automáticamente en input
- Botones CTA occupy full width para fácil tap
- Historial scrollable pero timer siempre visible

---

### 4. Pantalla de Tracking (Durante el Viaje)

```
┌─────────────────────────────────┐
│ ← Volver     SEGUIMIENTO 📍     │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │    MAPA INTERACTIVO     │   │ ← Mapa full-width
│  │    con ruta y posición  │   │ ← GPS en tiempo real
│  │                         │   │
│  │   ●━━━━━━━○             │   │ ← Origen → Destino
│  │   📍 Tu ubicación       │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ── Estado del viaje ──         │
│  🚚 EN CAMINO                  │ ← Status badge
│  ETA: 14:30 (2h 15m)          │
│                                 │
│  ████████████░░░░░  65%       │ ← Barra de progreso
│                                 │
│  ── Detalles ──                 │
│  📦 Cemento | 22.000 kg        │
│  🏢 Logísticas del Litoral     │
│  📍 Rosario → Buenos Aires    │
│                                 │
│  ════════════════════════════  │
│                                 │
│  ┌───────────┐ ┌───────────┐   │
│  │ 📸 Com-   │ │ 💬 Men-   │   │
│  │   probante│ │   saje    │   │ ← Botones de acción
│  │   Entrega │ │           │   │
│  └───────────┘ └───────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │     🆘 SOS             │   │ ← Botón de emergencia
│  │  Llamar a emergencias   │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

**Descripción del Layout:**
- **Header:** Retorno, título "SEGUIMIENTO" con emoji de ubicación.
- **Mapa interactivo:**占比约50% del viewport, muestra ruta calculada, posición actual del vehículo (actualizada por GPS), e indicadores de origen/destino.
- **Estado del viaje:** Badge de estado "EN CAMINO", ETA actualizado en tiempo real, y barra de progreso visual.
- **Detalles:** Resumen de carga, empresa, y ruta para consulta rápida.
- **Botones de acción:** Dos cards horizontales — "Comprobante de Entrega" (abre cámara/formulario de POD) y "Mensaje" (chat con la empresa).
- **Botón SOS:** Zona de emergencia prominente con color diferenciado (rojo), toca para llamar a servicios de emergencia.

**Elementos Interactivos:**
- Mapa → pinch-to-zoom, drag para navegar
- Tap en "Comprobante Entrega" → abre cámara + formulario de prueba de entrega
- Tap en "Mensaje" → abre chat con la empresa
- Tap en "SOS" → confirmación y luego llamada a emergencias
- Pull-to-refresh → actualiza posición GPS

**Flujo de Usuario:**
- Esta pantalla se activa automáticamente al confirmar inicio del viaje. El conductor la consulta durante todo el recorrido para seguimiento de ETA, comunicación con la empresa, y eventual registro del comprobante de entrega. Al llegar al destino, debe registrar el POD para liberar el pago.

**Responsive Mobile-First:**
- Mapa occupies majority del viewport para navegación clara
- Botones de acción grandes (mínimo 48px height) para uso en movimiento
- SOS button con contraste alto y positioned para evitar activación accidental
- Safe area respetada en dispositivos con notch

---

### 5. Perfil y Rating (Profile/Rating Screen)

```
┌─────────────────────────────────┐
│ ← Volver       MI PERFIL  ✎    │
├─────────────────────────────────┤
│                                 │
│       ┌───────────┐             │
│       │    👤     │             │ ← Avatar
│       │  (foto)   │             │
│       └───────────┘             │
│                                 │
│    Marcos González              │
│    ⭐ 4.7 (89 reseñas)         │
│                                 │
│  ════════════════════════════   │
│                                 │
│  🏅 Elo: 1.847 puntos          │
│  🥇 Rango: Bronce              │
│  ████████████░░░  72%          │ ← Barra de progreso al siguiente rango
│                                 │
│  🔒 Trust Score: 85%           │
│  ████████████████░░ 85/100    │ ← Meter de confianza
│                                 │
│  ── Estadísticas ──             │
│                                 │
│  ✅ Viajes completados: 127     │
│  📊 Tasa de respuesta: 94%     │
│  ⏰ Entregas a tiempo: 91%     │
│  ⭐ Calificación promedio: 4.7 │
│                                 │
│  ════════════════════════════   │
│                                 │
│  🚛 Mi vehículo                 │
│  ┌─────────────────────────┐   │
│  │ 🚚 Mercedes 1113        │   │
│  │    Volcador | 2018      │   │
│  │    Patente: AB123CD     │   │
│  │    Capacidad: 22 tons   │   │
│  └─────────────────────────┘   │
│                                 │
│  📄 Documentos                   │
│  ┌─────────────────────────┐   │
│  │ ✅ Licencia CNRT        │   │
│  │    Vence: Dic 2027      │   │
│  │ ✅ Seguro obligatorio    │   │
│  │    Vence: Ago 2026      │   │
│  │ ✅ Habilitación carga    │   │
│  │    Estado: Vigente      │   │
│  └─────────────────────────┘   │
│                                 │
│  ── Acciones ──                 │
│  [📊 Ver historial completo]   │
│  [📱 Cambiar teléfono]          │
│  [💳 Métodos de pago]          │
│  [⚙️ Configuración]            │
│                                 │
└─────────────────────────────────┘
```

**Descripción del Layout:**
- **Header:** Retorno, título "MI PERFIL", botón de edición.
- **Avatar y nombre:** Foto de perfil, nombre completo, rating con cantidad de reseñas.
- **Sistema Elo:** Puntos de reputación visualizados con badge de rango (Bronce/Plata/Oro/etc) y barra de progreso al siguiente nivel.
- **Trust Score:** Medidor circular o de barra con porcentaje e indicadores de qué afecta el score.
- **Estadísticas:** Grid de métricas clave — viajes completados, tasa de respuesta, puntualidad, rating.
- **Vehículo:** Card con datos del camión registrado — marca, tipo, año, patente, capacidad.
- **Documentos:** Lista de documentos obligatorios con estado (vigente/vencido/próximo a vencer).
- **Acciones:** Links a historial completo, configuración de contacto, métodos de pago, y settings.

**Elementos Interactivos:**
- Tap en avatar → permite cambiar foto
- Tap en rango Elo → muestra explicación del sistema de puntos
- Tap en vehículo → edita información del camión
- Tap en documento → abre visor del documento cargado
- Tap en acciones → navega a sección correspondiente
- Pull-to-refresh → actualiza estadísticas

**Flujo de Usuario:**
- El conductor accede a su perfil para verificar su reputación, actualizar datos del vehículo, gestionar documentos, o revisar estadísticas de rendimiento. Un buen perfil genera más confianza en las empresas y mayor cantidad de viajes asignados directamente.

**Responsive Mobile-First:**
- Secciones colapsables para reducir scroll en pantallas pequeñas
- Cards de documentos con indicadores de color (verde=ok, amarillo=próximo, rojo=vencido)
- Touch targets de 44px mínimo en todos los botones

---

## Aplicación Web — Screens para Empresas

### 6. Dashboard de la Empresa

```
┌──────────────────────────────────────────────────────────────────┐
│  SPOTTRUCK     🔔  [Avatar]  ▼                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Bienvenido, Logísticas del Litoral                              │
│  ════════════════════════════════════════════════════════════   │
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │    12       │ │    8        │ │    $1.2M    │ │   94%     │  │
│  │ Viajes      │ │ Pujas       │ │ Gastado     │ │ Tasa      │  │
│  │ activos      │ │ pendientes  │ │ este mes    │ │ respuesta │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │
│                                                                  │
│  ════════════════════════════════════════════════════════════   │
│  ── Actividad reciente ──                     [Ver todo →]       │
│                                                                  │
│  • Juan M. ofreció $47.500 por viaje ROS-2024-0892    Hace 2m   │
│  • Martín L. completó entrega en Buenos Aires        Hace 15m  │
│  • Nueva puja para viaje CBA-2024-0891                Hace 1h  │
│  • Carlos G. aceptó oferta directa $52.000            Hace 3h  │
│                                                                  │
│  ════════════════════════════════════════════════════════════   │
│  ── Viajes rápidos ──                         [Crear viaje +]   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🔥 Córdoba → Mendoza | Carga general | $85.000          │  │
│  │    Pickup: 06 Jun 10:00 | Entrega: 07 Jun 18:00         │  │
│  │    4 ofertas | Estado: Abierta                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Rosario → Buenos Aires | Refrigerado | $120.000         │  │
│  │    Pickup: 08 Jun 06:00 | Entrega: 09 Jun 14:00         │  │
│  │    2 ofertas | Estado: Subasta activa                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ════════════════════════════════════════════════════════════   │
│  ── Conductores favoritos ──                                    │
│                                                                  │
│  [👤 Marcos G. ⭐4.7] [👤 Diego R. ⭐4.8] [👤 Carlos G. ⭐4.6]   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Descripción del Layout:**
- **Topbar:** Logo Spottruck, notificaciones con badge de conteo, avatar de empresa con dropdown.
- **KPI Cards:** 4 tarjetas con métricas principales — viajes activos, pujas pendientes, gasto del mes, tasa de respuesta.
- **Actividad reciente:** Feed de eventos cronológicos inversos (notificaciones de ofertas, completados, nuevos mensajes).
- **Viajes rápidos:** Lista compacta de los viajes más relevantes con badge de estado y conteo de ofertas.
- **Conductores favoritos:** Acceso rápido a perfiles de conductores frecuentes.
- **CTA principal:** Botón "Crear viaje" prominente en la sección de viajes rápidos.

**Elementos Interactivos:**
- Click en KPI card → drill-down a reporte detallado
- Click en actividad → navega al detalle del viaje o conductor
- Click en viaje → abre Trip Management con detalles
- Click en conductor favorito → abre Driver Profile Modal
- Click en "Crear viaje" → navega a Create Trip Form
- Hover en notificación → preview rápido

**Flujo de Usuario:**
- El dispatcher o logística de la empresa inicia aquí cada mañana. Revisa KPIs, monitorea viajes activos, responde a nuevas ofertas, y gestiona la creación de nuevos viajes. El dashboard es el centro de comando de la operación diaria.

**Responsive Considerations:**
- Desktop-first (1440px base) pero adaptable a tablet (1024px)
- Cards en grid responsive (4 columnas → 2 columnas)
- Sidebar collapsible en tablet
- Mobile view muestra KPIs en carousel horizontal

---

### 7. Formulario de Creación de Viaje (Create Trip Form)

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Volver     CREAR NUEVO VIAJE                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ●━━━━━━━━━━○━━━━━━━━━━○━━━━━━━━━━○━━━━━━━━━━○                  │
│  1.Origen  2.Carga  3.Fechas  4.Precio  5.Revisar                 │
│                                                                  │
│  ════════════════════════════════════════════════════════════   │
│                                                                  │
│  PASO 1: ORIGEN Y DESTINO                                        │
│  ────────────────────────────────────────────────────────────   │
│                                                                  │
│  📍 Origen                                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ [Seleccionar punto en mapa]                              │   │
│  │ Ciudad: Rosario, Santa Fe                                │   │
│  │ Dirección: Av. Pellegrini 1234                           │   │
│  │ coords: -32.9442, -60.6505                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  📍 Destino                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ [Seleccionar punto en mapa]                              │   │
│  │ Ciudad: Buenos Aires, CABA                               │   │
│  │ Dirección: Av. 9 de Julio 1000                           │   │
│  │ coords: -34.6037, -58.3816                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌───────────────────────┐                                      │
│  │     MAPA INTERACTIVO  │                                      │
│  │                       │                                      │
│  │  [P]────────────────[D]  Distancia: 400km                  │   │
│  │                       │                                      │
│  └───────────────────────┘                                      │
│                                                                  │
│  ── Indicaciones especiales ──                                   │
│  [ ] Requiere GPS en tiempo real                                 │
│  [ ] Descarga en rampa / dock                                   │
│  [ ] Requiere documentación de peligrosidad                      │
│                                                                  │
│  ════════════════════════════════════════════════════════════   │
│                                                                  │
│           [Cancelar]              [Siguiente →]                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Descripción del Layout:**
- **Progress indicator:** Stepper horizontal con 5 pasos, actual destacado.
- **Form fields por paso:**

  **Paso 1 (Origen/Destino):** Campos de ubicación con selector de mapa integrado, coordenadas automáticas, e indicaciones especiales.

  **Paso 2 (Carga):** Tipo demercadería (granel, carga general, refrigerada, peligrosa), peso en kg, volumen en m³, instrucciones de manipulación.

  **Paso 3 (Fechas):** Fecha y hora de pickup, deadline de entrega, tiempo máximo de tránsito, ventanas horarias.

  **Paso 4 (Precio):** Tipo de negociación (subasta vs precio fijo), precio base, rango mínimo/máximo, comisión Spottruck.

  **Paso 5 (Revisar):** Resumen completo de todos los datos ingresados, opción de editar cada sección, botón de publicación.

- **Navegación:** Botones "Cancelar" y "Siguiente" o "Anterior" según el paso.

**Elementos Interactivos:**
- Click en campo de ciudad → autocompletado con suggestions de Google Places / mapa local
- Click en mapa → coloca pin de ubicación
- Toggle de indicaciones especiales → muestra campos condicionales
- Botón "Siguiente" → valida campos obligatorios y avanza
- Botón "Anterior" → retrocede sin perder datos
- Click en paso del stepper → navega directamente (si ya completado)

**Flujo de Usuario:**
- El usuario completa los 5 pasos secuencialmente. Cada paso tiene validación antes de permitir avanzar. En el paso 5 puede revisar todo y volver a cualquier paso para corregir. Al confirmar "Publicar", el viaje entra al sistema y aparece en la lista de viajes disponibles para conductores.

**Responsive Considerations:**
- Desktop-first con form de 2 columnas en pasos 2-4
- Mobile: single column, stepper se convierte en progress bar colapsable
- Mapa responsive con altura adaptativa
- Inputs con labels floating o stacked según breakpoint

---

### 8. Gestión de Viajes (Trip Management)

```
┌──────────────────────────────────────────────────────────────────┐
│  GESTIÓN DE VIAJES                    [🔍 Buscar] [+ Nuevo]     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filtros: [Todas] [Abiertas] [En curso] [Completadas] [Cancel]  │
│  ────────────────────────────────────────────────────────────   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ROS-2024-0892  ● Abierta                                   │ │
│  │ Córdoba → Mendoza                                          │ │
│  │ 📦 Carga general | 15.000 kg | 35m³                       │ │
│  │ 📅 Pickup: 10 Jun 08:00 | Entrega: 11 Jun 16:00            │ │
│  │ 💰 $85.000 (5 ofertas)                    [Ver详情 →]     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ROS-2024-0891  ● Subasta activa                            │ │
│  │ Rosario → Buenos Aires                                    │ │
│  │ 📦 Refrigerado | 8.000 kg | 20m³                          │ │
│  │ 📅 Pickup: 08 Jun 06:00 | Entrega: 09 Jun 14:00            │ │
│  │ 💰 $120.000 (3 ofertas) | Terminando en 2h                 │ │
│  │ 🟢 Mejor oferta: $118.000 (Martín L.)                      │ │
│  │                                    [Ver详情 →] [Cancelar]   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ROS-2024-0889  ◉ En curso                                  │ │
│  │ Mendoza → Córdoba                                          │ │
│  │ 📦 Gral | 22.000 kg | 40m³                                 │ │
│  │ 📅 En camino desde 07 Jun 14:00 | ETA: 08 Jun 10:00        │ │
│  │ 💰 $92.000 | Conductor: Marcos G.                          │ │
│  │                                    [Ver详情 →] [Ver GPS]   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ROS-2024-0885  ✓ Completada                                │ │
│  │ Buenos Aires → La Plata                                    │ │
│  │ 📦 Carga general | 5.000 kg | 12m³                         │ │
│  │ 📅 Entregado: 05 Jun 18:30                                 │ │
│  │ 💰 $45.000 | Conductor: Carlos G.                          │ │
│  │ PAGO LIBERADO ✓                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Descripción del Layout:**
- **Toolbar:** Título de sección, campo de búsqueda, botón de crear nuevo viaje.
- **Filtros por estado:** Tabs horizontales para filtrar por estado del viaje.
- **Lista de viajes:** Cards apiladas verticalmente, cada una con:
  - ID del viaje y badge de estado
  - Ruta (origen → destino)
  - Resumen de carga (tipo, peso, volumen)
  - Fechas de pickup y entrega
  - Precio y cantidad de ofertas
  - CTAs de acción según estado

**Estados de Viaje:**
- **Abierta:** Sin conductor asignado, disponible para ofertas
- **Subasta activa:** En proceso de puja competitiva
- **En curso:** Conductor en camino, GPS tracking activo
- **Completada:** Entregado, pago en proceso o liberado
- **Cancelada:** Viaje cancelado (por empresa o Spottruck)

**Elementos Interactivos:**
- Click en filtro → actualiza lista
- Click en viaje → expande card o navega a detalle completo
- Click en "Ver详情" → abre modal o página de detalle con bid list
- Click en "Ver GPS" → abre mapa con posición del conductor
- Click en "Cancelar" → confirmación antes de cancelar
- Búsqueda → filtra por ID, ruta, o nombre de conductor

**Flujo de Usuario:**
- El usuario llega desde el dashboard. Gestiona todos sus viajes activos: monitorea subastas, rastrea entregas en curso, revisa viajes completados. Desde la vista de detalle puede ver todas las ofertas recibidas, contactar conductores, o gestionar cancelaciones.

**Responsive Considerations:**
- Desktop: Cards en lista completa con todas las métricas visibles
- Tablet: Cards colapsadas, detalles en modal
- Mobile: Cards en lista simple, expand on tap, acciones en bottom sheet

---

### 9. Modal de Perfil de Conductor (Driver Profile Modal)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                    [X] Cerrar   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│       ┌─────────────┐                                           │
│       │     👤      │          Marcos González                  │
│       │  (foto)     │          ⭐ 4.7 (89 reseñas)              │
│       └─────────────┘          🏅 Elo: 1.847 (Bronce)           │
│                                                                  │
│  ── Datos de contacto ──                                         │
│  📱 +54 9 341 123 4567                                          │
│  💬 WhatsApp disponible                                         │
│  📧 marcos.gonzalez@mail.com                                    │
│                                                                  │
│  [💬 Enviar mensaje]  [📞 Llamar]  [⭐ Ver reseñas]             │
│                                                                  │
│  ════════════════════════════════════════════════════════════   │
│                                                                  │
│  ── Mi vehículo ──                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🚚 Mercedes 1113 (2018)                                 │   │
│  │    Tipo: Volcador | Capacidad: 22.000 kg               │   │
│  │    Patente: AB123CD                                     │   │
│  │    [Ver fotos →]                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ── Estadísticas ──                                             │
│  ✅ Viajes completados: 127                                     │
│  ⏰ Puntualidad: 91%                                             │
│  📊 Tasa de respuesta: 94%                                      │
│  🛡️ Incidentes: 0                                               │
│                                                                  │
│  ── Historial reciente ──                                       │
│                                                                  │
│  Fecha       Viaje                  Empresa      Calificación    │
│  ────────────────────────────────────────────────────────────   │
│  02 Jun 2024  ROS → MDA              Logísticas R   ⭐⭐⭐⭐⭐    │
│  28 May 2024  CBA → BA               TransPREST    ⭐⭐⭐⭐⭐    │
│  22 May 2024  ROS → CBA              CargasArg     ⭐⭐⭐⭐⭐    │
│  15 May 2024  MDA → ROS              Logísticas del▼ ⭐⭐⭐⭐     │
│                                                                  │
│  ── Reviews ──                                                  │
│  "Excelente conductor, muy puntual y cuidadoso con la carga."    │
│  — Logísticas del Litoral, Jun 2024                             │
│                                                                  │
│  ── Documentos verificados ──                                    │
│  ✅ Licencia CNRT | ✅ Seguro | ✅ Habilitación                 │
│                                                                  │
│  ════════════════════════════════════════════════════════════   │
│                                                                  │
│              [Asignar directo este viaje]                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Descripción del Layout:**
- **Header del modal:** Botón de cierre, foto de perfil grande, nombre, rating, Elo.
- **Datos de contacto:** Teléfono, email, indicator de WhatsApp.
- **CTAs de contacto:** Botones para enviar mensaje, llamar, o ver reseñas completas.
- **Vehículo:** Card con marca/modelo/año, tipo de cuerpo, capacidad, patente, link a fotos.
- **Estadísticas:** Métricas de rendimiento del conductor (completados, puntualidad, respuesta, incidentes).
- **Historial:** Tabla con últimos 10 viajes — fecha, ruta, empresa, rating dado.
- **Reviews:** Últimas 1-2 reseñas escritas por empresas.
- **Documentos:** Estado de verificaciones obligatorias.
- **CTA final:** Botón de "Asignar directo" para asignar el conductor a un viaje sin pasar por auction.

**Elementos Interactivos:**
- Click en teléfono → copia al portapapeles o abre dialer
- Click en WhatsApp → abre chat directo
- Click en "Ver reseñas" → scroll a sección de reviews o abre modal de reviews
- Click en vehículo fotos → abre lightbox con galería
- Click en historial → navega a perfil completo del conductor
- Click en "Asignar directo" → confirmation modal + asignación

**Flujo de Usuario:**
- Este modal se abre desde Trip Detail (tap en conductor), desde Trip Management (tap en conductor de viaje activo), o desde el Dashboard (conductor favorito). Permite a la empresa evaluar y contactar conductores directamente, o asignar viajes fuera de la dinámica de auction.

**Responsive Considerations:**
- Desktop: Modal centered, 60% width, max-width 700px
- Tablet: Modal 80% width
- Mobile: Bottom sheet full-width, sections collapsible

---

### 10. Pantalla de Pago / Fideicomiso (Payment/Escrow Screen)

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Volver     PAGO Y FIDEICOMISO                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Seleccionar viaje: [ROS-2024-0889: ROS → MDA      ▼]           │
│                                                                  │
│  ════════════════════════════════════════════════════════════   │
│                                                                  │
│  RESUMEN DEL VIAJE                                               │
│  ────────────────────────────────────────────────────────────   │
│  Origen: Rosario, Santa Fe                                       │
│  Destino: Mendoza                                                │
│  Conductor: Marcos González (⭐4.7)                               │
│  Estado: ✅ Entregado - Pendiente de pago                         │
│                                                                  │
│  ════════════════════════════════════════════════════════════   │
│                                                                  │
│  DETALLE DE PAGOS                                                │
│  ────────────────────────────────────────────────────────────   │
│                                                                  │
│  Subtotal del flete                    $92.000                   │
│  Comisiones Spottruck (5%)             $4.600                   │
│  ─────────────────────────────────────────────                  │
│  TOTAL                                 $96.600                   │
│                                                                  │
│  ════════════════════════════════════════════════════════════   │
│                                                                  │
│  MÉTODO DE PAGO                                                  │
│  ────────────────────────────────────────────────────────────   │
│                                                                  │
│  (•) MercadoPago                                               │
│  ( ) Transferencia bancaria                                     │
│  ( ) Tarjeta de crédito (Visa ending 4242)                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 💳 Pagar con MercadoPago                                  │   │
│  │    Saldo disponible: $150.000                           │   │
│  │    [Cambiar método]                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ════════════════════════════════════════════════════════════   │
│                                                                  │
│  ESTADO DEL FIDEICOMISO                                          │
│  ────────────────────────────────────────────────────────────   │
│                                                                  │
│  [D]═══[●]═══[✓]═══[$]                                          │
│  Reservado  En tránsito  Entregado   Liberado                   │
│  02 Jun     05 Jun      08 Jun      --                          │
│                                                                  │
│  El pago está reservado en fideicomiso.                          │
│  Se liberará al conductor cuando confirmes la entrega.          │
│                                                                  │
│  ════════════════════════════════════════════════════════════   │
│                                                                  │
│  [           LIBERAR PAGO AL CONDUCTOR           ]  ← Disabled   │
│                                                                  │
│  ⚠️ Para liberar el pago, primero debes confirmar la entrega     │
│     en la pantalla de seguimiento del viaje.                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Descripción del Layout:**
- **Selector de viaje:** Dropdown para seleccionar cuál viaje se está gestionando (si hay varios pendientes).
- **Resumen del viaje:** Datos clave del viaje seleccionado — ruta, conductor, estado de entrega.
- **Detalle de pagos:** Desglose del costo — subtotal del flete, comisión de plataforma, total.
- **Método de pago:** Opciones de pago configuradas — MercadoPago (recomendado), transferencia bancaria, tarjeta. Radio buttons para selección. Muestra saldo disponible si es MercadoPago.
- **Estado del fideicomiso:** Timeline visual de 4 pasos:
  1. **Reservado:** Pago capturado al confirmar la asignación
  2. **En tránsito:** Durante el viaje, dinero en hold
  3. **Entregado:** Conductor completó entrega (requiere confirmación de POD)
  4. **Liberado:** Pago transferido al conductor
- **CTA de liberar pago:** Botón primario disabled hasta que se confirme entrega. Si está habilitado, al tocar procesa la liberación.
- **Warning banner:** Explicación de por qué el botón está deshabilitado si corresponde.

**Elementos Interactivos:**
- Dropdown de viaje → cambia el contexto de la pantalla
- Radio de método de pago → cambia método seleccionado
- Click en "Cambiar método" → abre gestión de métodos de pago
- Botón "Liberar pago" → confirmation modal → procesamiento → success
- Click en timeline → muestra más detalles de cada étape

**Flujo de Usuario:**
- El flujo comienza cuando la empresa recibe notificación de entrega. Accede a esta pantalla, selecciona el viaje, revisa los detalles, y procede a liberar el pago si todo está en orden. El conductor recibe el depósito en su cuenta MercadoPago o bancaria según configured.

**Responsive Considerations:**
- Desktop: Layout de 2 columnas — resumen a la izquierda, detalle de pago a la derecha
- Tablet: Stack vertical, timeline horizontal compactado
- Mobile: Full stack, timeline se convierte en stepper vertical, sticky CTA al bottom

---

### 11. Centro de Notificaciones (Notification Center)

```
┌──────────────────────────────────────────────────────────────────┐
│  NOTIFICACIONES                                    [⚙️ Filtros]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Todos] [Viajes] [Pagos] [Sistemas]              ← Filtros tabs │
│  ────────────────────────────────────────────────────────────    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ 🔔  Nueva oferta recibida                                │    │
│  │    Juan M. ofreció $47.500 por viaje ROS-2024-0892       │    │
│  │    Hace 2 minutos                          [Ver viaje →] │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ ✅  Viaje completado                                     │    │
│  │    Entregaste en Buenos Aires - Logísticas del Litoral   │    │
│  │    Hace 15 minutos                          [Ver详情 →]  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ 💰  Pago liberado                                        │    │
│  │    $92.000已在你的账户中 disponible                       │    │
│  │    Hace 1 hora                               [Ver pago →]│    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ ⚠️  Documento próximo a vencer                          │    │
│  │    Tu habilitación CNRT vence en 30 días                 │    │
│  │    Hace 3 horas                            [Renovar →]  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ 📋  Nuevo mensaje                                        │    │
│  │    Logísticas del Litoral: "El tráfico está cortado en   │    │
│  │    ruta Alternate"                                      │    │
│  │    Hace 5 horas                             [Ver mensaje]│    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ════════════════════════════════════════════════════════════    │
│  ── Anteriores ──                                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ 🔔  Subasta ganada                                       │    │
│  │    ¡Felicidades! Ganaste la puja por CBA-2024-0891       │    │
│  │    Ayer                                       [Ver viaje]│    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Descripción del Layout:**
- **Header:** Título "NOTIFICACIONES", botón de filtros.
- **Filtros por tipo:** Tabs horizontales — Todos, Viajes, Pagos, Sistemas.
- **Lista de notificaciones:** Cards apiladas con:
  - Ícono de tipo (campana, check, dollar, warning, chat)
  - Título de la notificación
  - Descripción/ cuerpo del mensaje
  - Tiempo relativo ("Hace X minutos/horas")
  - CTA secundario ("Ver viaje", "Ver pago", etc.)
- **Separador "Anteriores":**分割 entre notificaciones nuevas y antiguas.
- **Notificaciones no leídas:** Borde izquierdo de color primario para indicar unread status.

**Estados:**
- No leídas: Borde izquierdo naranja + texto en bold
- Leídas: Fondo gris claro, texto normal
- Hover/press: Background más oscuro, transición de 150ms

**Elementos Interactivos:**
- Tap en tab filtro → filtra lista por tipo
- Tap en notificación → marca como leída + navegación al contexto
- Tap en CTA → navegación directa a la pantalla relevante
- Swipe left en notificación (mobile) → opción de marcar como leída/eliminar
- Pull-to-refresh → busca nuevas notificaciones

**Flujo de Usuario:**
- El usuario accede desde el icono de campana en cualquier pantalla. Aquí recibe y gestiona todas las actualizaciones del sistema. Puede filtrar por tipo para encontrar rápidamente lo que busca. Las notificaciones críticas (pago, documentación) requieren acción.

**Responsive Considerations:**
- Desktop: Panel lateral derecho o modal
- Mobile: Full screen con tabs sticky al top

---

### 12. Dashboard de Administración (Admin Dashboard)

```
┌──────────────────────────────────────────────────────────────────┐
│  SPOTTRUCK ADMIN                                    [Avatar] ▼  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PANEL DE CONTROL                                                │
│  ════════════════════════════════════════════════════════════    │
│                                                                  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────┐ ┌─────────┐  │
│  │   1,247       │ │   89          │ │   $12.4M  │ │   98.2% │  │
│  │ Viajes       │ │ Disputas      │ │ Volumen   │ │ Health  │  │
│  │ este mes     │ │ activas       │ │ mensual   │ │ sistema │  │
│  └───────────────┘ └───────────────┘ └───────────┘ └─────────┘  │
│                                                                  │
│  ════════════════════════════════════════════════════════════    │
│  ── Métricas en Tiempo Real ──                    [Exportar ↓]   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐      │
│  │                                                        │      │
│  │   📈 GRÁFICO DE VELOCIDAD DE VIAJES                   │      │
│  │   (chart de líneas: viajes completados por día)       │      │
│  │                                                        │      │
│  │   ▁▂▃▅▇█▅▃▂▄▆▇█▇▅▄▃▂▂▃▄▅▆▇▇▅▄▃                     │      │
│  │   L  M  X  J  V  S  D  L  M  X  J  V  S  D            │      │
│  │                                                        │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                  │
│  ════════════════════════════════════════════════════════════    │
│  ── Disputas Recientes ──                         [Ver todas →]  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ⚠️ DIS-2024-0234                                        │   │
│  │ Empresa: Logísticas del Litoral vs Conductor: Marcos G. │   │
│  │ Viaje: ROS-2024-0889 | Monto: $92.000                    │   │
│  │ Motivo: Reclamo por delay en entrega                     │   │
│  │ Estado: 🟡 En revisión                    [Ver详情 →]   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ⚠️ DIS-2024-0233                                        │   │
│  │ Empresa: TransPREST vs Conductor: Diego R.               │   │
│  │ Viaje: CBA-2024-0876 | Monto: $45.000                    │   │
│  │ Motivo: Pago noLiberado                                  │   │
│  │ Estado: 🟢 Resuelto                    [Ver详情 →]      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ════════════════════════════════════════════════════════════    │
│  ── Alertas de Sistema ──                                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🟢 API Gateway: Operativo | Response time: 45ms          │   │
│  │ 🟢 Database: Operativo | Connections: 23/100              │   │
│  │ 🟢 Payment Gateway: Operativo | Success rate: 99.8%     │   │
│  │ 🟡 Email Service: Operación lenta | 12 emails en cola    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ════════════════════════════════════════════════════════════    │
│  ── Acciones Rápidas ──                                         │
│                                                                  │
│  [📢 Broadcast] [📊 Reportes] [⚙️ Config] [👥 Usuarios]         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Descripción del Layout:**
- **Topbar:** Logo, título de sección, avatar admin con dropdown.
- **KPI Cards:** 4 métricas principales — viajes en el mes, disputas activas, volumen monetario, health del sistema.
- **Gráfico de velocidad:** Línea de tiempo con completados diarios para identificar tendencias.
- **Disputas recientes:** Lista de conflictos abiertos ordenados por urgencia con badge de estado.
- **Alertas de sistema:** Status de cada componente de infraestructura (API, DB, Payment, Email) con color indicator y métricas.
- **Acciones rápidas:** Botones para funciones administrativas comunes.

**Estados de Health:**
- 🟢 Verde: Operativo normal
- 🟡 Amarillo: Operación degradada o lento
- 🔴 Rojo: fuera de servicio o crítico

**Elementos Interactivos:**
- Click en KPI → drill-down a reporte detallado (analytics)
- Click en Dispute → abre Admin Dispute Detail modal
- Click en status de sistema → historial de uptime y métricas
- Click en acciones rápidas → navegación a sección correspondiente
- Filtro de fechas → actualiza gráfico y métricas
- Click en "Exportar" → descarga CSV/PDF de datos

**Flujo de Usuario:**
- El admin inicia sesión y ve el dashboard con visión全局 del negocio. Monitorea métricas clave, gestiona disputas que requieren intervención manual, supervisa salud del sistema, y ejecuta acciones administrativas. Las disputas se asignan a agents para resolución.

**Responsive Considerations:**
- Desktop-first (1440px base) con data density alta
- Gráficos responsivos con librería Charts.js o similar
- Mobile: KPIs en carousel, gráficos simplificados, alertas prioritarias only

---

### 13. Pantalla de Rating / Calificación (Rating Form)

```
┌─────────────────────────────────┐
│  ← Volver     CALIFICAR VIAJE  │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │ Viaje completado        │   │
│  │ Córdoba → Mendoza       │   │
│  │ 05 Jun 2024              │   │
│  └─────────────────────────┘   │
│                                 │
│  ════════════════════════════  │
│                                 │
│  ¿Cómo fue tu experiencia      │
│  con este viaje?               │
│                                 │
│  ┌─────────────────────────┐   │
│  │  ⭐ ⭐ ⭐ ⭐ ⭐           │   │ ← 5 estrellas interactivas
│  │  (tap para calificar)    │   │
│  └─────────────────────────┘   │
│                                 │
│  Calificación: Excelente        │
│                                 │
│  ════════════════════════════  │
│                                 │
│  ── Categorías ──               │
│                                 │
│  Puntualidad                    │
│  ████████████░░░░  4/5        │
│                                 │
│  Cuidado de la carga            │
│  ████████████░░░░  4/5        │
│                                 │
│  Comunicación                  │
│  ████████████████░  5/5       │
│                                 │
│  Estado del vehículo            │
│  ████████████░░░░  4/5        │
│                                 │
│  ════════════════════════════  │
│                                 │
│  Comentario (opcional)          │
│  ┌─────────────────────────┐    │
│  │ Escribí tu experiencia │    │ ← Textarea
│  │ aquí...                 │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │    ENVIAR CALIFICACIÓN  │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

**Descripción del Layout:**
- **Header:** Retorno, título "CALIFICAR VIAJE".
- **Resumen del viaje:** Card con ruta y fecha del viaje completado.
- **Pregunta guía:** Texto que orienta al usuario sobre qué calificar.
- **Estrellas principales:** 5 estrellas interactivas, tap para seleccionar rating general.
- **Label de rating:** Texto que describe el nivel selected (1=Pésimo, 2=Malo, 3=Regular, 4=Bueno, 5=Excelente).
- **Categorías:** Sub-ratings por aspectos específicos — Puntualidad, Cuidado de carga, Comunicación, Estado del vehículo. Cada una es una barra de 1-5.
- **Textarea:** Campo opcional para comentario textual.
- **CTA:** Botón "ENVIAR CALIFICACIÓN" disabled hasta seleccionar estrellas.

**Estados:**
- Default: 0 estrellas, categorías en 3/5, textarea vacío
- Parcial: Estrellas seleccionadas pero sin categorías completas
- Listo: Todas las estrellas seleccionadas, botón enabled
- Submitting: Spinner en botón
- Success: Animación de check, auto-dismiss

**Elementos Interactivos:**
- Tap en estrella → selecciona rating general (1-5), las anteriores se llenan
- Tap en categoría barra → ajusta rating de 1-5
- Tap en textarea → abre keyboard
- Tap en "Enviar" → valida, submit, success animation
- Swipe down → dismiss keyboard

**Flujo de Usuario:**
- Al completar un viaje (ambos lados: empresa califica conductor, conductor califica empresa), se presenta este form. Es importante que sea rápido y con friction mínima para maximize completion rate. El comment es optional.

**Responsive Mobile-First:**
- Touch targets grandes para estrellas (mínimo 48px cada una)
- Categorías con slider o tap targets
- Keyboard-aware layout

---

## Consideraciones de Diseño Generales

### Mobile-First para App Conductor

La aplicación móvil del conductor debe funcionar en condiciones adversas:震动 del camión, luz solar directa en pantalla, conexión móvil inestable. Por esto:

- **Contraste alto:** Elementos críticos siempre visible bajo luz directa
- **Touch targets grandes:** Mínimo 48px, preferiblemente 56px para acciones principales
- **Tipografía legible:** Body mínimo 16px, headers 20px+
- **Offline basic:** Funcionalidad reducida cuando no hay conexión, queue de acciones
- **Minimal cognitive load:** Máximo 3-4 opciones visibles por pantalla

### Desktop-First para Web de Empresa

La interfaz web para empresas opera en ambiente de oficina, donde:

- **Densidad de información alta:** Más datos por pantalla, menos scrolling
- **Teclado + mouse:** Shortcuts, hover states, drag-drop
- **Multi-tab workflow:** Usuarios trabajan con múltiples viajes simultáneamente
- **Reports & exports:** Necesidad de exportar datos, generar reportes
- **Notifications persistentes:** Badge counts, toast notifications

### Componentes Compartidos

Ambos productos comparten:

- **Colores:** Palette de marca Spottruck
- **Tipografía:** Sistema de fuentes (ej: Inter para UI, Roboto para headings)
- **Iconografía:** Set de íconos consistente (heroicons, phosphor, o custom)
- **Form components:** Inputs, buttons, selects con estados compartidos
- **Sistema de spacing:** 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)

### Terminología Clave en Español Argentino

- **Carga:** Mercadería transportada
- **Flete:** Costo del transporte / el transporte mismo
- **Chófer/Conductor:** Persona que opera el vehículo
- **Cargador/Empresa:** Quien contrata el transporte
- **Viaje/Orden de servicio:** Servicio de transporte solicitado
- **Pickup:** Recogida de la carga
- **Delivery/Entrega:** Dejada de la carga en destino
- **POD (Proof of Delivery):** Comprobante de entrega
- **CNRT:** Comisión Nacional de Regulación del Transporte
- **GPS tracking:** Seguimiento por geolocalización
- **Subasta/Auction:** Mecanismo de puja competitiva
- **Proxy bid:** Puja automática hasta máximo definido
- **Fideicomiso/Escrow:** Dinero retenido hasta confirmación
- **MercadoPago:** Método de pago primario en Argentina
- **ELO:** Sistema de puntaje/reputación del conductor

---

*Documento generado para Spottruck — Plataforma de logística y transporte de carga*
*Versión: 1.0 | Fecha: 2026-06-04*