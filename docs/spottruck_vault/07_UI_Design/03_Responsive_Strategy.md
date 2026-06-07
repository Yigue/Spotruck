---
title: "03 - Responsive Strategy"
date: "2026-06-04"
author: "Spottruck Design Team"
status: "active"
tags:
  - responsive-design
  - mobile-first
  - breakpoints
  - ui-design
  - spottruck
---

# Estrategia de Diseño Responsivo — Spottruck

## 1. Visión General

La estrategia de diseño responsivo de Spottruck establece el marco técnico y metodológico para garantizar que la plataforma de subastas y logística de transporte de carga funcione de manera óptima en cualquier dispositivo, contexto de uso o condición de red. Dado que el público objetivo de Spottruck incluyeTransportistas que operan en rutas nacionales con dispositivos móviles de gama media, Despachantes y operadores logísticos que acceden desde oficinas con monitores de escritorio, y Cargadores y empresas que consultan desde equipos variados, el sistema responsivo debe equilibrar rendimiento, accesibilidad y funcionalidad.

Spottruck adopta un enfoque **mobile-first** que prioriza la experiencia en dispositivos móviles durante la fase de diseño y desarrollo, expandiendo progresivamente hacia pantallas mayores. Esta estrategia responde a las estadísticas de uso reales en Argentina, donde el acceso a plataformas logísticas desde smartphones y tablets representa más del 60% de las sesiones activas, especialmente en contextos de campo donde los transportistas consultan estado de cargas y ofertan en subastas desde sus dispositivos móviles durante trayectos.

El enfoque mobile-first no significa que mobile sea la versión "limitada" del producto. Significa que partimos de las restricciones reales de las pantallas pequeñas, conexiones lentas y contextos de uso interrumpidos, y desde ahí construimos hacia arriba. Las decisiones de diseño que funcionan en móvil — navegación clara, contenido prioritario, acciones directas — terminan mejorando la experiencia en todos los dispositivos.

---

## 2. Sistema de Breakpoints

El sistema de breakpoints de Spottruck define cuatro rangos de anchura que determinan los cambios de layout, tipografía y funcionalidad a través de la interfaz. Cada breakpoint representa no solo una medida de pantalla, sino un contexto de uso característico con sus propias necesidades y posibilidades.

### 2.1 Definición de Breakpoints

| Breakpoint | Rango | Dispositivos Representativos | Contexto Principal |
|------------|-------|------------------------------|---------------------|
| **Mobile** | < 640px | Smartphones Android/iOS, dispositivos de gama baja | Uso en ruta, consulta rápida, ofertar desde el camino |
| **Tablet** | 640px – 1024px | Tablets en modo portrait y landscape, smartphones en landscape | Trabajo de campo, revisión de estados, gestión de múltiples cargas |
| **Desktop** | 1024px – 1440px | Laptops, monitores de oficina, all-in-one | Gestión operativa, análisis de datos, supervisión de subastas |
| **Large** | > 1440px | Monitores 2K/4K, pantallas wide | Visualización de múltiples paneles, dashboards de control |

### 2.2 Estrategia de Implementación

Los breakpoints se implementan utilizando **media queries con el enfoque de contenido primero**, donde los cambios ocurren cuando el contenido lo requiere, no cuando la pantalla alcanza una medida arbitraria. Esto significa que los componentes no cambian de breakpoint a breakpoint de manera rígida, sino que se adaptan al espacio disponible real.

```
/* Mobile (base) - estilos por defecto */
.card { padding: 12px; }

/* Tablet+ */
@media (min-width: 640px) {
  .card { padding: 20px; }
}

/* Desktop+ */
@media (min-width: 1024px) {
  .card { padding: 24px; display: grid; grid-template-columns: 1fr 1fr; }
}

/* Large+ */
@media (min-width: 1440px) {
  .card { max-width: 1200px; margin: 0 auto; }
}
```

La implementación utiliza `min-width` de manera consistente para el flujo mobile-first, donde cada breakpoint representa "a partir de este tamaño, aplica estos estilos adicionales". Esta decisión facilita la legibilidad del código y garantiza que los estilos base (mobile) sean los que siempre se aplican cuando no hay media query que los invalide.

### 2.3 Breakpoints Especiales de Comportamiento

Además de los breakpoints de pantalla, Spottruck utiliza breakpoints de **capacidad de navegador** para funcionalidades avanzadas:

- **Soporte touch**: Detecta capacidad táctil para ajustar hit targets (44px mínimo en elementos interactivos).
- **Precisión de puntero**: Distingue entre dispositivos de entrada táctil y de puntero preciso para adaptar menus contextuales y dropdowns.
- **Soporte hover**: Detecta si el dispositivo soporta interacciones hover para decidir si mostrar tooltips informativos o acceder directamente al contenido.

---

## 3. Sistema de Grid

### 3.1 Arquitectura del Grid de 12 Columnas

El sistema de grid de Spottruck se construye sobre una base de **12 columnas con gutter de 16px en móvil, 24px en tablet y 32px en desktop**. Estegrid proporciona flexibilidad suficiente para crear layouts que van desde una sola columna en móvil hasta configuraciones complejas de múltiples paneles en desktop, manteniendo una unidad de medida coherente a través de todos los breakpoints.

```
Grid base (mobile < 640px):
├── 1 columna (span-1): 100% del contenedor
├── 2 columnas (span-2): 50% del contenedor
├── 3 columnas (span-3): Not used - demasiado angosto
└── 4 columnas (span-4): 25% - solo en landscape extremo

Tablet (640px - 1024px):
├── 1 columna: 100%
├── 2 columnas: 50%
├── 3 columnas: 33.33%
├── 4 columnas: 25%
├── 6 columnas: 50% (grid de 2x3 en row)
└── 12 columnas: 100%

Desktop+ (1024px+):
├── Todas las configuraciones de tablet disponibles
├── Más 8 columnas: 66.66%
├── Más 9 columnas: 75%
├── Más 10 columnas: 83.33%
└── Más 11 columnas: 91.66%
```

### 3.2 Clases de Grid Responsive

El sistema de utilidades CSS define clases de grid que responden a cada breakpoint mediante modificadores:

| Clase | Descripción | Mobile | Tablet | Desktop |
|-------|-------------|--------|--------|---------|
| `.col-span-1` | Ancho completo | ✓ | ✓ | ✓ |
| `.col-span-2` | Mitad del ancho | ✓ | ✓ | ✓ |
| `.col-span-3` | Un tercio | — | ✓ | ✓ |
| `.col-span-4` | Un cuarto | — | ✓ | ✓ |
| `.col-span-6` | Mitad (grid de 2) | — | ✓ | ✓ |
| `.col-span-8` | Dos tercios | — | — | ✓ |
| `.col-span-12` | Ancho completo | ✓ | ✓ | ✓ |

El patrón de nomenclatura sigue el formato `<comportamiento>-<breakpoint>-<valor>` donde comportamiento puede ser `col-span`, `col-start`, `col-end`, `gap`, o `margin`. Los breakpoints se abrevian como `sm` (640px+), `md` (1024px+), `lg` (1440px+).

### 3.3 Contenedores y Márgenes

Los contenedores de Spottruck utilizan un sistema de **max-width con padding lateral responsive** que evita que el contenido se estreche demasiado en pantallas grandes mientras mantiene márgenes adecuados en pantallas pequeñas:

- **Mobile**: max-width 100%, padding lateral 16px
- **Tablet**: max-width 720px (centrado), padding lateral 32px
- **Desktop**: max-width 1200px (centrado), padding lateral 48px
- **Large**: max-width 1440px (centrado), padding lateral 64px

Este sistema se implementa con una variable CSS que cambia según el breakpoint activo, permitiendo que los contenedores respondan sin necesidad de reescribir las reglas de layout:

```css
.container {
  width: 100%;
  padding-inline: var(--container-padding-mobile);
  margin-inline: auto;
}

@media (min-width: 640px) {
  .container { --container-padding-mobile: 32px; }
}

@media (min-width: 1024px) {
  .container { --container-padding-mobile: 48px; }
}

@media (min-width: 1440px) {
  .container { --container-padding-mobile: 64px; }
}
```

---

## 4. Tipografía Responsive

### 4.1 Sistema de Escala Tipográfica

La escala tipográfica de Spottruck utiliza un sistema modular con ratio de 1.25 (major third) que garantiza armonía visual y legibilidad en todos los tamaños. Los tamaños base y los ajustes por breakpoint se definen para garantizar que el texto sea legible sin forzar zoom en ningún dispositivo.

**Escala de tamaños:**

| Token | Mobile | Tablet | Desktop | Uso |
|-------|--------|--------|---------|-----|
| `text-xs` | 12px | 12px | 12px | Labels secundarios, metadata |
| `text-sm` | 14px | 14px | 14px | Cuerpo secundario, notas |
| `text-base` | 16px | 16px | 16px | Cuerpo principal, readability óptima |
| `text-lg` | 18px | 18px | 18px | Destacados, introducciones |
| `text-xl` | 20px | 22px | 24px | Subtítulos de sección |
| `text-2xl` | 24px | 26px | 28px | Títulos de sección |
| `text-3xl` | 28px | 32px | 36px | Títulos de página |
| `text-4xl` | 32px | 38px | 44px | Hero headlines |
| `text-5xl` | — | 44px | 52px | Títulos principales desktop |

### 4.2 Principios de Implementación

La tipografía responsive de Spottruck sigue principios que garantizan legibilidad y rendimiento:

**Unidades relativas para escalado fluido**: Los tamaños se definen en `rem` para respetar las preferencias de accesibilidad del usuario. En lugar de tamaños fijos pixel-perfect, se utiliza un rango de `clamp()` que permite ajustes suaves entre breakpoints sin saltos bruscos:

```css
.headline {
  font-size: clamp(1.5rem, 2vw + 1rem, 2rem);
  /* Mínimo 24px, máximo 32px, óptimo 2vw + 16px */
}
```

**Línea height adaptativa**: El interlineado aumenta en pantallas pequeñas para mantener legibilidad, ya que los usuarios tienden a sostener dispositivos móviles más cerca de sus ojos:

- Cuerpo en mobile: `line-height: 1.6`
- Cuerpo en desktop: `line-height: 1.5`
- Títulos en mobile: `line-height: 1.25`
- Títulos en desktop: `line-height: 1.2`

**Máximo de caracteres por línea**: Para evitar líneas excesivamente largas que dificulten la lectura, los contenedores de texto establecen un `max-width` basado en `ch` (caracteres):

- Cuerpo de lectura: `max-width: 65ch`
- Textos largos: `max-width: 75ch`
- UI labels: `max-width: 45ch`

### 4.3 Consideraciones de Accesibilidad

La estrategia tipográfica incorpora requisitos de accesibilidad desde el diseño base:

- **Contraste mínimo**: Todos los tamaños de texto cumplen con WCAG 2.1 nivel AA con ratios de contraste 4.5:1 para texto normal y 3:1 para texto grande.
- **Escalado de texto del navegador**: Los layouts no bloquean el escalado del usuario mediante fixed heights o overflow hidden, permitiendo zoom hasta 200% sin pérdida de funcionalidad.
- **Unidades de fuente escalables**: El font-size del root se establece en 16px por defecto, permitiendo que los usuarios con configuraciones diferentes de navegador obtengan el tamaño que esperan.

---

## 5. Adaptación de Componentes por Breakpoint

### 5.1 Estrategia de Adaptación Componentes

Cada componente de Spottruck implementa un patrón de adaptación que sigue tres categorías principales según el breakpoint:

**1. Ocultar/Mostrar (Visibility Patterns)**:
 Algunos elementos tienen sentido solo en ciertos contextos. La tabla de ofertas detalladas muestra información relevante en desktop pero se resume en chips de estado en mobile.

**2. Redimensionar (Resize Patterns)**:
 Los componentes que cambian de tamaño manteniendo su esencia — cards que pasan de stacked a side-by-side, imágenes que escalan proporcionalmente.

**3. Reflujo (Reflow Patterns)**:
 Componentes que reorganizan su layout interno según el espacio disponible — navegación que pasa de horizontal a vertical, formularios que apilan campos en móvil y los despliegan en grid en desktop.

### 5.2 Ejemplos de Adaptación por Componente

**Card de Carga (CargoCard)**:

```
Mobile (< 640px):
┌─────────────────────────┐
│ [Imagen]  120x80px      │
│ Estado: En tránsito      │
│ Origen → Destino         │
│ Precio: $45.000          │
│ [Ofertar] [Ver detalles] │
└─────────────────────────┘

Tablet (640px - 1024px):
┌─────────────────────────────────────┐
│ [Imagen]        Estado: En tránsito  │
│ 200x120px       Origen → Destino     │
│                 Peso: 2.500 kg       │
│                 Precio: $45.000       │
│                 [Ofertar] [Ver más]   │
└─────────────────────────────────────┘

Desktop (1024px+):
┌──────────────────────────────────────────────────────┐
│ [Imagen]  │ Estado │ Origen    │ Destino │ Precio   │
│ 240x160px │        │ Buenos    │ Córdoba │ $45.000  │
│           │        │ Aires     │         │          │
│           │        │           │         │ [Ofertar]│
└──────────────────────────────────────────────────────┘
```

**Tabla de Subastas**:

```
Mobile: Cards apiladas con expandable details
Tablet: Tabla compacta con columnas críticas visibles
Desktop: Tabla completa con todas las columnas ordenables
```

**Formulario de Oferta**:

```
Mobile:
┌─────────────────────┐
│ Tu oferta:          │
│ [____________] $    │
│                     │
│ Límite máximo: $XX  │
│                     │
│ [Cancelar][Enviar]  │
└─────────────────────┘

Tablet+:
┌──────────────────────────────────────────┐
│ Tu oferta    │  Límite máximo: $XX      │
│ [_________]$ │  Tu posición: #3 de 12    │
│               │  [Cancelar] [Enviar]     │
└──────────────────────────────────────────┘
```

### 5.3 Matriz de Adaptación de Componentes Principales

| Componente | Mobile | Tablet | Desktop | Large |
|------------|--------|--------|---------|-------|
| **Header/Navbar** | Logo + hamburger | Logo + nav items | Logo + nav + user | Logo + nav + user + acciones |
| **CargoCard** | Stacked layout | 2 columnas | Grid 3-4 columnas | Grid 4+ columnas con sidebar |
| **AuctionTable** | Cards expandibles | Tabla compacta | Tabla completa | Tabla + panel de detalle |
| **BidForm** | Full-width stacked | Inline con info | Side-by-side con historial | Modal con dashboard |
| **FilterPanel** | Bottom sheet | Collapsible sidebar | Sidebar persistente | Sidebar + presets |
| **UserMenu** | Bottom sheet | Dropdown | Dropdown | Dropdown + badges |

### 5.4 Composición de Layouts

Los layouts de página en Spottruck se construyen combinando componentes según el espacio disponible, utilizando patrones de layout consistentes:

**Layout de Dashboard (móvil)**:
```
┌──────────────────────────────┐
│ Header: Spottruck [Menú]     │
├──────────────────────────────┤
│ Stats cards (stacked)        │
│ [Active] [Pending] [Won]     │
├──────────────────────────────┤
│ Auction list (cards)         │
│ - Cargo 1                    │
│ - Cargo 2                    │
│ - Cargo 3                    │
├──────────────────────────────┤
│ [Ver más cargas]             │
└──────────────────────────────┘
     ↑ Scroll               │
     │              [Bottom Nav]
```

**Layout de Dashboard (tablet/desktop)**:
```
┌──────────────────────────────────────────────────────────┐
│ Header: Spottruck [Nav] [User]           [Notif] [Ajustes]│
├──────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│ │ Active 4 │ │ Pending  │ │ Won 2    │  ← Stats row      │
│ └──────────┘ └──────────┘ └──────────┘                  │
├──────────────────────────────────────────────────────────┤
│ Sidebar    │ Main content area                           │
│ [Filters]  │ ┌─────────────────────────────────────────┐ │
│ [Recent]   │ │ Auction table / Cargo grid              │ │
│            │ │                                         │ │
│            │ │                                         │ │
│            │ └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Adaptación de Navegación

### 6.1 Navegación Mobile: Bottom Navigation Bar

En dispositivos móviles, Spottruck implementa un sistema de **bottom navigation bar** que coloca las acciones principales al alcance del pulgar en la zona inferior de la pantalla. Este patrón responde a estudios de usabilidad que demuestran que la zona inferior de la pantalla es el área más accesible en dispositivos táctiles cuando el usuario sostiene el teléfono con una mano.

**Estructura de Bottom Nav (móvil)**:
```
┌──────────────────────────────────────────────────────────┐
│                                                    [↑]   │
│                    Contenido                            │
│                                                      [✓] │
├──────────────────────────────────────────────────────────┤
│ [Home]   [Cargas]   [Subastas]   [Mi Cuenta]             │
│   🏠        📦          🔨           👤                  │
└──────────────────────────────────────────────────────────┘
```

**Criterios de selección de items en bottom nav**:
- Máximo 5 items para evitar sobrecarga cognitiva
- El item activo muestra icono filled + label + indicador visual
- Los items incluyen iconos (para reconocimiento rápido) y labels (para claridad)
- El área táctil de cada item es mínimo 44x44px según guidelines de Apple y Google
- El bottom nav se fija en la parte inferior con `position: fixed` y no realiza scroll con el contenido

### 6.2 Navegación Tablet: Hybrid Approach

Los dispositivos tablet representan un punto intermedio donde el bottom nav seguiría funcionando pero el espacio adicional permite una navegación más eficiente. En tablet, Spottruck utiliza un **top navigation bar expandida** combinada con un rail lateral contextual para secciones secundarias.

```
┌──────────────────────────────────────────────────────────────┐
│ [≡] Spottruck  Home  Cargas  Subastas  [Search]  [User] [Notif]│
├──────────────────────────────────────────────────────────────┤
│                    Contenido principal                        │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Sidebar contextual: Filtros | Recientes | Categorías         │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 Navegación Desktop: Sidebar Persistente con Mega Menu

En desktop, Spottruck implementa una **sidebar persistente de 240px de ancho** que proporciona acceso permanente a todas las secciones principales, complementada con menús desplegables para subsecciones y acciones contextuales.

**Estructura de navegación desktop**:
```
┌─────────────┬─────────────────────────────────────────────────┐
│ [Logo]      │ Header: Search [🔍]    [Notif] [Help] [Avatar] │
├─────────────┤─────────────────────────────────────────────────┤
│ NAVIGACIÓN  │                                                 │
│             │                                                 │
│ 🏠 Inicio   │     Contenido principal                         │
│ 📦 MisCargas│     con sidebar de contexto                     │
│ 🔨 Subastas │     derecha collapsible                         │
│ 📊 Analytics│                                                 │
│ ⚙️ Ajustes  │                                                 │
│             │                                                 │
│ ─────────── │                                                 │
│ [Cerrar     │                                                 │
│  sesión]    │                                                 │
└─────────────┴─────────────────────────────────────────────────┘
```

### 6.4 Navegación Large: Multi-Window Ready

En pantallas grandes (> 1440px), la navegación expande sus áreas de manera proporcional y permite layouts de múltiples paneles donde el usuario puede ver y navegar entre varias secciones simultáneamente. El sidebar se expande a 280px y puede configurarse para mostrar información adicional como recent items o shortcuts personalizables.

### 6.5 Transiciones entre Navegaciones

Las transiciones entre los diferentes sistemas de navegación no son abruptas. Se implementa una estrategia de **progressive enhancement** donde los elementos de navegación de breakpoints menores se mantienen disponibles en breakpoints mayores como fallback:

- El bottom nav en tablet tiene un modo "collapsed" que puede expandirse
- El sidebar en desktop puede minimizarse a un rail de iconos de 64px
- Todas las navegaciones mantienen un acceso claro al home y a las funciones críticas (buscar, notificaciones)

---

## 7. Consideraciones de Rendimiento para Móvil

### 7.1 Estrategia de Optimización de Carga

El rendimiento en dispositivos móviles es crítico para Spottruck considerando que los transportistas pueden acceder desde zonas con conectividad limitada o不稳定. La estrategia de rendimiento responde a tres objetivos: **velocidad de carga inicial**, **interactividad temprana**, y **fluidez de scroll y animaciones**.

**Estrategia de Lazy Loading**:
- Las imágenes que están fuera del viewport inicial se cargan solo cuando se aproximan a la zona visible mediante Intersection Observer.
- Los componentes heavy como mapas y gráficos se cargan de manera diferida cuando el usuario llega a la sección correspondiente.
- La información de subastas activas se carga primero; los detalles históricos se cargan bajo demanda.

**Estrategia de Payload Optimization**:
- La API de Spottruck soporta respuestas parciales donde el cliente especifica qué campos necesita, evitando transferir datos innecesarios en conexiones lentas.
- Las listas largas se virtualizan usando windowing, donde solo se renderizan los items visibles en el viewport actual más un buffer de items adyacentes.
- Los assets estáticos (iconos, fuentes) se sirvendesde CDN con cache headers agresivos y compression gzip/brotli.

### 7.2 Adaptación de Imágenes Responsive

El sistema de imágenes responsivo de Spottruck utiliza los atributos `srcset` y `sizes` para servir imágenes del tamaño apropiado según el dispositivo y el espacio disponible en el layout:

```html
<img 
  src="cargo-400.jpg"
  srcset="cargo-400.jpg 400w,
          cargo-800.jpg 800w,
          cargo-1200.jpg 1200w"
  sizes="(max-width: 640px) 100vw,
         (max-width: 1024px) 50vw,
         400px"
  alt="Carga #1234 - Contenedor refrigerado"
  loading="lazy"
/>
```

**Formatossop ortados**:
- WebP como formato primario con fallback a JPEG para navegadores legacy
- AVIF para navegadores que lo soporten, proporcionando mejor compresión
- SVGs para iconos y gráficos vectoriales, escalando sin pérdida
- LQIP (Low Quality Image Placeholders) para progressive loading visual

### 7.3 Critical CSS y Code Splitting

Spottruck implementa una estrategia de **critical CSS inline** donde los estilos necesarios para renderizar el contenido above-the-fold se incluyen directamente en el HTML inicial, evitando el bloqueo de renderizado por hojas de estilo externas.

El código JavaScript se fragmenta mediante code splitting, donde cada ruta/página de la aplicación tiene su propio chunk que solo se carga cuando el usuario navega a esa sección. Esto reduce el tamaño del bundle inicial y mejora los tiempos de Time to Interactive (TTI).

```
Initial bundle: ~80KB (critical CSS + core JS)
Route chunks:
├── Home: ~45KB
├── Auction list: ~120KB
├── Auction detail: ~90KB
├── Bid form: ~60KB
├── User dashboard: ~100KB
└── Settings: ~40KB
```

### 7.4 Network-Aware UX

La interfaz de Spottruck monitorea las condiciones de red del dispositivo mediante la Network Information API (donde está disponible) y adapta su comportamiento correspondientemente:

- **Conexión lenta detectada**: Reduce la calidad de imágenes, desactiva animaciones no esenciales, prioriza contenido de texto sobre visual.
- **Modo offline**: Permite acceso a datos previamente cacheados (estado de cargas activas, favoritos) con una interfaz que indica claramente la limitación y muestra cuándo se sincronizará.
- **Reconexión**: Detecta cuando la conexión se restaura y sincroniza automáticamente, actualizando la interfaz con nueva información.

---

## 8. Testing y Validación de Estrategia Responsive

### 8.1 Framework de Testing

La validación de la estrategia responsiva se realiza mediante testing automatizado y manual estructurado en tres niveles:

**Testing automatizado**:
- Visual regression tests con Percy o Chromatic para cada breakpoint principal
- Pruebas de renderizado de componentes con Storybook que muestran estados en diferentes tamaños
- Lighthouse CI en cada PR para detectar regresiones de rendimiento

**Testing manual**:
- Revisión de flujos de usuario completos (auction browsing, bidding, tracking) en cada breakpoint usando BrowserStack
- Evaluación de accesibilidad con VoiceOver (iOS) y TalkBack (Android)
- Pruebas de usabilidad con usuarios reales en sus dispositivos

### 8.2 Dispositivos de Referencia

Las pruebas manuales se realizan en una matriz de dispositivos que representa la diversidad del mercado argentino:

| Dispositivo | Pantalla | Breakpoint | Notas |
|-------------|----------|------------|-------|
| Samsung Galaxy A14 | 720p | Mobile | Dispositivo popular en Argentina |
| iPhone 13 | 1080p | Mobile | Referencia iOS |
| iPad 9na gen | 1620x2160 | Tablet | iOS tablet representative |
| Samsung Tab A8 | 1920x1200 | Tablet | Android tablet representative |
| MacBook Air 13" | 2560x1600 | Desktop | Referencia laptop |
| Monitor 24" 1080p | 1920x1080 | Desktop | Setup de oficina típico |
| iMac 27" 4K | 3840x2160 | Large | Referencia high-res |

### 8.3 Métricas de Éxito

El éxito de la estrategia responsiva se mide mediante métricas específicas alineadas con los objetivos de negocio:

- **Largest Contentful Paint (LCP)**: < 2.5s en móvil 3G
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Tasa de abandono en móvil**: < 15% por debajo de desktop
- **Completitud de bidding en móvil**: > 70% de la tasa desktop

---

## 9. Implementación y Herramientas

### 9.1 Stack Tecnológico

La implementación de la estrategia responsiva utiliza las siguientes tecnologías:

- **CSS**: Variables CSS custom para breakpoints, Grid y Flexbox para layouts
- **PostCSS**: Autoprefixer para soporte de navegadores, cssnano para minificación
- **Tailwind CSS**: Utilidades responsive con modificadores de breakpoint (sm:, md:, lg:, xl:)
- **Testing**: Playwright para e2e, Chromatic para visual regression, Storybook para component development

### 9.2 Comandos de Desarrollo

```bash
# Desarrollo con hot reload y simulación de breakpoints
npm run dev

# Visual testing en todos los breakpoints
npm run test:visual

# Performance audit
npm run audit:performance

# Generar reporte de coverage responsive
npm run test:responsive-coverage
```

---

## 10. Resumen de Implementación

La estrategia de diseño responsivo de Spottruck establece un marco integral que abarca desde breakpoints definidos hasta sistemas de navegación diferenciados, grid de 12 columnas adaptable, tipografía fluida y consideraciones de rendimiento específicas para el contexto móvil latinoamericano. La implementación sigue principios mobile-first donde las decisiones de diseño para pantallas pequeñas guían y mejoran la experiencia en pantallas mayores.

Los próximos pasos de implementación incluyen la migración de componentes existentes al nuevo sistema de breakpoints, la creación de stories de Storybook para cada breakpoint, y la validación mediante testing automatizado y sesiones de usuario en campo.

---

*Documento creado como parte del Sistema de Diseño de Spottruck*
*Versión: 1.0*
*Última actualización: 2026-06-04*