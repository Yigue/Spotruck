# Páginas y Funcionalidades — Análisis del Sistema Legacy vs. Estado Actual

Este documento presenta una auditoría técnica y funcional completa del sistema legacy de **Spottruck** (desarrollado originalmente con PHP, HTML5, JavaScript vanilla, Materialize CSS y Bootstrap) en comparación con la implementación moderna actual (React 18, Vite, TailwindCSS, TypeScript, Node.js REST API, Prisma ORM y WebSockets).

---

## 📌 1. Visión General del Sistema Legacy

El sistema legacy fue estructurado bajo un patrón MVC tradicional en PHP:
- **Vista (`/legacy/Vista`):** Archivos HTML/PHP divididos por rol de usuario (`Empresa`, `Camionero`, `Login`, `Extra`).
- **Control (`/legacy/Control`):** Scripts PHP que procesaban peticiones HTTP POST/GET y operaciones a la base de datos MySQL/MariaDB.
- **Model (`/legacy/Model`):** Clases y scripts de conexión y manipulación de datos (`bd.php`, `usuario.php`, etc.).
- **JS (`/legacy/JS`):** Controladores del cliente en Javascript vanilla / jQuery para consumo de APIs y manipulación del DOM mediante plantillas HTML (`<template>`).

---

## 📂 2. Análisis Detallado de Páginas Legacy

### 🔑 A. Flujo de Autenticación y Perfil

#### 1. `index.html` / `publispotruck.html` (Landing de Bienvenida)
- **Diseño y Función:** Página pública de aterrizaje. Presenta el concepto de Spottruck como solución logística para transporte de carga pesada.
- **Prerrequisitos:** Ninguno (acceso público sin autenticación).
- **Acciones Disponibles:**
  - Botón "Iniciar Sesión" (redirecciona a `login.html`).
  - Botón "Registrarse" (redirecciona a `register.html`).
- **Reglas de Negocio:** Ninguna regla estricta; meramente informativa y punto de entrada al embudo de conversión.

#### 2. `legacy/Vista/Login/login.html`
- **Diseño y Función:** Formulario limpio de inicio de sesión centrado en pantalla usando utilidades de Bootstrap/Materialize.
- **Prerrequisitos:** Usuario registrado previamente en la base de datos.
- **Acciones Disponibles:**
  - Ingresar correo electrónico y contraseña.
  - Enviar formulario vía POST hacia `/legacy/Control/login.php`.
- **Reglas de Negocio:**
  - Validación de campos no vacíos.
  - Verificación de credenciales (email y hash de contraseña).
  - Redirección automática según el rol del usuario autenticado:
    - Si `rol == 'Empresa'` $\rightarrow$ `Vista/Empresa/paginaEmpresa.html`.
    - Si `rol == 'Camionero'` $\rightarrow$ `Vista/Camionero/paginaCamionero.html`.

#### 3. `legacy/Vista/register.html` y `registerEmpresa.html`
- **Diseño y Función:** Formulario de registro por pasos. `register.html` permite seleccionar el tipo de cuenta (`Empresa` o `Camionero`), mientras que `registerEmpresa.html` solicita los datos corporativos específicos.
- **Prerrequisitos:** No haber iniciado sesión previamente.
- **Acciones Disponibles:**
  - Selección de rol (`Empresa` o `Transportista`).
  - Ingreso de email, contraseña, teléfono, CUIT y Razón Social (para empresas).
- **Reglas de Negocio:**
  - Validación de formato CUIT argentino mediante `cuit_validator.php`.
  - Unicidad de correo electrónico en la base de datos.
  - Creación de cuenta con estado inicial de perfil incompleto o pendiente de activación.

#### 4. `legacy/Vista/perfil.html`
- **Diseño y Función:** Panel de visualización de datos personales y de la empresa/transportista.
- **Prerrequisitos:** Usuario con sesión activa en el sistema.
- **Acciones Disponibles:**
  - Ver información de contacto (email, teléfono, dirección, CUIT).
  - Editar datos de perfil mediante formulario interactivo.
  - Cerrar sesión (`btnLogout`).
- **Reglas de Negocio:**
  - Solamente el usuario dueño de la cuenta puede ver y modificar su propio perfil.
  - Campos críticos como el CUIT quedan inmutables tras su validación inicial.

---

### 🏢 B. Módulo Empresa (Dante de Carga)

#### 1. `legacy/Vista/Empresa/paginaEmpresa.html` (Dashboard de Empresa)
- **Diseño y Función:** Panel principal de la empresa dante de carga. Utiliza una barra de navegación lateral desplegable (*toggle menu*), tarjetas de Materialize CSS para listar publicaciones de fletes activas y un botón flotante (`+`) para publicar.
- **Prerrequisitos:** Usuario autenticado con rol `Empresa`.
- **Acciones Disponibles:**
  - Ver listado de viajes/publicaciones propias creadas.
  - Hacer clic en una tarjeta de publicación para ver sus ofertas/detalles.
  - Navegar a `publicaciones.html` mediante el botón flotante para crear un nuevo flete.
  - Cerrar sesión.
- **Reglas de Negocio:**
  - La vista filtra estrictamente los registros para mostrar solo las publicaciones pertenecientes al ID de la empresa en sesión.

#### 2. `legacy/Vista/Empresa/publicaciones.html` (Crear Publicación de Viaje)
- **Diseño y Función:** Formulario para registrar una nueva necesidad de transporte de carga pesada.
- **Prerrequisitos:** Sesión activa de `Empresa`.
- **Acciones Disponibles:**
  - Seleccionar origen y destino (dirección y coordenadas).
  - Definir tipo de carga (granel, paletizada, refrigerada, etc.), peso en kg y descripción.
  - Indicar fecha pactada de carga y precio base tope a pagar ($ ARS).
  - Enviar formulario.
- **Reglas de Negocio:**
  - El precio base debe ser mayor a cero.
  - La fecha de carga no puede ser en el pasado.
  - El estado inicial de la publicación se registra como `OPEN` o `DRAFT`.

#### 3. `legacy/Vista/Empresa/verPublicacion.html` (Gestión de Subasta y Pujas Recibidas)
- **Diseño y Función:** Vista de detalle de una publicación específica. Muestra la información del viaje y una tabla HTML dinámica con el listado de ofertas/postulaciones enviadas por los camioneros.
- **Prerrequisitos:** Ser el usuario `Empresa` propietario de la publicación.
- **Acciones Disponibles:**
  - Ver ofertas recibidas (Nombre del transportista, precio ofertado, fecha y camión).
  - Abrir modal de detalle de la oferta (`tpl_modal`).
  - Aceptar oferta (`btnAceptar`) $\rightarrow$ Adjudica el flete al camionero.
  - Rechazar oferta (`btnRechazar`).
- **Reglas de Negocio:**
  - Al hacer clic en "Aceptar", la oferta pasa a estado `ACCEPTED`, el viaje cambia su estado a `ASSIGNED` y se cierran las demás postulaciones (`REJECTED`).
  - No se permite aceptar ofertas en publicaciones que ya hayan sido adjudicadas o canceladas.

#### 4. `legacy/Vista/Empresa/verViaje.html` (Monitoreo de Viaje Asignado)
- **Diseño y Función:** Vista de seguimiento del viaje una vez adjudicado. Presenta información del transportista asignado, estado de tránsito y datos de contacto.
- **Prerrequisitos:** Viaje en estado `ASSIGNED` o `IN_PROGRESS` perteneciente a la empresa.
- **Acciones Disponibles:**
  - Ver datos del camionero (nombre, teléfono, patente del camión asignado).
  - Visualizar la ruta o mapa estático.
  - Confirmar recepción de mercadería (finalizar viaje).
- **Reglas de Negocio:**
  - La confirmación de entrega cambia el viaje a `DELIVERED` / `SETTLED`.

---

### 🚛 C. Módulo Camionero (Transportista)

#### 1. `legacy/Vista/Camionero/paginaCamionero.html` (Explorador de Viajes)
- **Diseño y Función:** Panel principal del transportista. Incluye un mapa interactivo (Google Maps API / Leaflet) que muestra los viajes disponibles geolocalizados y una lista de tarjetas de fletes en los que puede postularse.
- **Prerrequisitos:** Usuario autenticado con rol `Camionero`.
- **Acciones Disponibles:**
  - Explorar fletes en mapa y lista.
  - Filtrar o hacer clic en "Ver detalles" de un viaje (`vModal`).
  - Clic en el botón "Postularse" $\rightarrow$ Redirecciona a `postularse.html?idViaje=X`.
  - Acceder a "Mis Camiones" o "Mis Postulaciones" desde el menú lateral.
- **Reglas de Negocio:**
  - Solo se muestran publicaciones activas en estado `OPEN` o `AUCTION`.

#### 2. `legacy/Vista/Camionero/registerCamion.html` / `Camiones.html` (Gestión de Flota)
- **Diseño y Función:** Formulario y listado de gestión de vehículos del camionero.
- **Prerrequisitos:** Sesión activa de `Camionero`.
- **Acciones Disponibles:**
  - Registrar nuevo camión (Patente, tipo de vehículo, capacidad máxima en kg, habilitación SENASA).
  - Listar flota registrada en tabla/tarjetas.
- **Reglas de Negocio:**
  - La patente debe ser única.
  - La capacidad en kg debe ser positiva.
  - El camión queda vinculado al ID del transportista en sesión (`ownerId`).

#### 3. `legacy/Vista/Camionero/postularse.html` (Formulario de Puja / Oferta)
- **Diseño y Función:** Pantalla de oferta para una subasta específica. Contiene un formulario con un selector `<select>` de camiones de la flota del chofer, un campo de precio ofertado y una tabla con el historial de pujas.
- **Prerrequisitos:**
  - Sesión activa de `Camionero`.
  - Tener al menos un camión registrado en la flota.
- **Acciones Disponibles:**
  - Seleccionar vehículo de la flota (`idCamion`).
  - Ingresar monto ofertado ($ ARS) y nota/aclaración.
  - Enviar oferta (`btnPostularse`).
- **Reglas de Negocio:**
  - El monto ofertado debe ser menor que el precio base o la mejor puja actual (regla de subasta inversa).
  - El camión seleccionado debe estar activo.

#### 4. `legacy/Vista/Camionero/misPostulaciones.html` (Historial de Ofertas)
- **Diseño y Función:** Vista que agrupa todas las postulaciones realizadas por el transportista.
- **Prerrequisitos:** Sesión activa de `Camionero`.
- **Acciones Disponibles:**
  - Ver listado de ofertas enviadas y su estado actual (`PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`).
  - Opción para retirar una oferta activa en estado `PENDING`.
- **Reglas de Negocio:**
  - No se pueden retirar ofertas de subastas cerradas o ya adjudicadas.

---

## 📊 3. Matriz Comparativa: Sistema Legacy vs. Sistema Actual (V1.0.0)

| Módulo / Funcionalidad | Sistema Legacy (PHP / JS Vanilla / HTML) | Sistema Actual (React 18 + Node.js + Prisma) | Mejora / Justificación Arquitectónica |
|---|---|---|---|
| **Arquitectura Frontend** | HTML estático con plantillas `<template>` en DOM, jQuery y scripts independientes por vista. | Single Page Application (SPA) modular con React 18, Vite, TypeScript y React Router. | Eliminación de recargas de página, código tipado libre de errores de runtime y componentes reutilizables. |
| **Diseño y CSS** | Mezcla heterogénea de Materialize CSS, Bootstrap 4/5 y archivos CSS nativos fragmentados. | Design System coherente con TailwindCSS, variables CSS centralizadas y modo oscuro/industrial. | Experiencia visual uniforme, responsiva, moderna y con micro-interacciones fluidas. |
| **Autenticación y RBAC** | Sesiones nativas PHP (`$_SESSION`) con llamadas directas a scripts PHP (`login.php`). | Autenticación stateless mediante Tokens JWT (Access Token 15m + Refresh Token 7d) y Guards en React. | Mayor seguridad, escalabilidad horizontal de servidores backend y protección contra ataques CSRF. |
| **Subastas e Invariantes** | Envío de oferta básico en PHP. Subasta simple sin control de tiempos dinámicos ni anti-sniping. | Motor de subastas inversas multinivel (`OPEN`, `DUTCH`, `SEALED`) con algoritmo **Anti-sniping** (extensión 2m). | Evita ofertas de último segundo especulativas y garantiza un proceso de puja transparente y justo. |
| **Pagos y Financiamiento** | Inexistente (acuerdo informativo entre partes sin procesamiento de dinero). | **Escrow (Retención en garantía)** integrado con API MercadoPago y retención del 8% de fee. | Garantía de cobro para el transportista y de servicio para la empresa antes de iniciar el tránsito. |
| **Telemetría GPS y Tracking** | Mapa estático Leaflet/Google Maps sin actualización en tiempo real. | Telemetría GPS en vivo vía **WebSockets (`ws://`)** con historial de coordenadas, velocidad y rumbo. | Monitoreo preciso minuto a minuto de la ubicación del flete durante todo el trayecto. |
| **Flota y Validación Documental** | Formulario básico de patente y modelo sin verificación documental. | Sistema de homologación de choferes (`DocumentsStatus`), validación SENASA y seguro JSON. | Cumplimiento regulatorio alimenticio y fiscal para transporte de carga pesada en Argentina. |
| **Calificaciones y Reputación** | Sin sistema de puntuación. | Evaluación bidireccional post-entrega (1-5 estrellas) con desgloses y cálculo nocturno de `trustScore`. | Creación de historial crediticio y reputacional transparente para la comunidad logística. |
