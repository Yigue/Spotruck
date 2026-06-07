---
title: "Spottruck - Biblioteca de Componentes"
date: 2026-06-04
author: Guillermo Riedel
status: active
tags: [components, ui-library, spottruck]
version: 1.2.0
---

# Spottruck — Biblioteca de Componentes

Componente central de la arquitectura UI de Spottruck. Esta biblioteca define los bloques fundamentales de construcción para todas las interfaces de usuario de la plataforma, desde componentes de navegación hasta elementos interactivos de formularios. Cada componente está diseñado para mantener consistencia visual con el sistema de diseño y garantizar una experiencia de usuario coherente en todas las plataformas (web, iOS, Android).

---

## Tabla de Contenidos

1. [Layout](#componentes-de-layout)
2. [Navegación](#componentes-de-navegación)
3. [Formularios](#componentes-de-formulario)
4. [Botones](#componentes-de-botones)
5. [Feedback](#componentes-de-feedback)
6. [Expansión](#componentes-de-expansión)
7. [Progreso](#componentes-de-progreso)
8. [Mensajería](#componentes-de-mensajería)

---

## Componentes de Layout

### 1. Container

El componente **Container** define el área de contenido principal de la aplicación, estableciendo anchos máximos y márgenes horizontales automáticos que garantizan legibilidad y consistencia visual.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Ancho máximo del contenedor |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Espaciado interno horizontal |
| `centered` | `boolean` | `true` | Centrar contenido verticalmente |

**Tamaños:**

- `sm`: 640px — Formularios de login
- `md`: 768px — Uso general
- `lg`: 1024px — Paneles de administración
- `xl`: 1280px — Dashboard completo
- `full`: 100% del ancho disponible

**Ejemplo de uso:**

```tsx
<Container size="lg" padding="xl">
  <h1>Dashboard Spottruck</h1>
</Container>
```

---

### 2. Stack

El componente **Stack** organiza elementos hijos en dirección vertical (por defecto) u horizontal, aplicando espaciado uniforme entre ellos mediante la propiedad `gap`.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `gap` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl'` | `'md'` | Espacio entre elementos hijos |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | `'stretch'` | Alineación en el eje perpendicular |
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | Dirección del flujo de elementos |
| `wrap` | `boolean` | `false` | Permitir wrapping de elementos |

**Valores de gap:**

| Token | Valor | Uso típico |
|-------|-------|------------|
| `xs` | 4px | Elementos muy juntos |
| `sm` | 8px | Formularios compactos |
| `md` | 16px | Espaciado predeterminado |
| `lg` | 24px | Secciones separadas |
| `xl` | 32px | Grupos de contenido |
| `2xl` | 48px | Separación de secciones |
| `3xl` | 64px | Separación mayor |

**Ejemplo:**

```tsx
<Stack gap="lg" direction="horizontal" align="center">
  <Avatar src={user.avatar} name={user.name} />
  <Stack gap="xs">
    <Text variant="title">{user.name}</Text>
    <Text variant="caption">{user.role}</Text>
  </Stack>
</Stack>
```

---

### 3. Grid

El componente **Grid** implementa un sistema de columnas basado en CSS Grid, permitiendo crear layouts complejos con comportamiento responsive integrado.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `cols` | `1-12` | `1` | Número de columnas base |
| `gap` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Espacio entre celdas |
| `colsSm` | `number` | - | Columnas en breakpoint sm (640px) |
| `colsMd` | `number` | - | Columnas en breakpoint md (768px) |
| `colsLg` | `number` | - | Columnas en breakpoint lg (1024px) |
| `colsXl` | `number` | - | Columnas en breakpoint xl (1280px) |

**Ejemplo:**

```tsx
<Grid cols={1} colsMd={2} colsLg={3} gap="lg">
  <Card>Vehículo 1</Card>
  <Card>Vehículo 2</Card>
  <Card>Vehículo 3</Card>
  <Card>Vehículo 4</Card>
  <Card>Vehículo 5</Card>
  <Card>Vehículo 6</Card>
</Grid>
```

**Comportamiento responsive:** El componente automáticamente aplica las columnas especificadas para cada breakpoint, pasando de 1 columna en móvil a 2 en tablet y 3 en escritorio.

---

### 4. Flex

El componente **Flex** es una utilidad de flexbox que simplifica la creación de layouts basados en el modelo de caja flexible de CSS.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `direction` | `'row' \| 'row-reverse' \| 'col' \| 'col-reverse'` | `'row'` | Dirección del eje principal |
| `justify` | `'start' \| 'center' \| 'end' \| 'between' \| 'around'` | `'start'` | Alineación en el eje principal |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch' \| 'baseline'` | `'stretch'` | Alineación en el eje cruzado |
| `gap` | `string` | - | Espacio entre elementos (CSS gap) |
| `wrap` | `'nowrap' \| 'wrap' \| 'wrap-reverse'` | `'nowrap'` | Comportamiento del wrapping |

**Ejemplo:**

```tsx
<Flex justify="between" align="center" gap="md">
  <Text variant="title">Lista de Viajes</Text>
  <Button variant="primary" leftIcon={<PlusIcon />}>
    Nuevo Viaje
  </Button>
</Flex>
```

---

### 5. Divider

El componente **Divider** crea una línea horizontal o vertical que separa visualmente secciones de contenido.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Orientación de la línea |
| `color` | `string` | `'#E5E7EB'` | Color de la línea |
| `thickness` | `'thin' \| 'medium' \| 'thick'` | `'thin'` | Grosor de la línea |
| `spacing` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Margen vertical/horizontal |

**Ejemplo:**

```tsx
<Stack gap="lg">
  <Section title="Datos del Vehículo" />
  <Divider />
  <Section title="Documentación" />
  <Divider orientation="vertical" spacing="lg" />
  <Section title="Historial de Viajes" />
</Stack>
```

---

## Componentes de Navegación

### 6. Navbar

La **Navbar** es la barra de navegación principal ubicada en la parte superior de la aplicación. Proporciona acceso a las secciones principales y funcionalidades globales.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `logo` | `ReactNode` | - | Componente de logo personalizado |
| `links` | `{ label: string; href: string; active?: boolean }[]` | `[]` | Links de navegación principales |
| `userMenu` | `UserMenuProps` | - | Menú desplegable del usuario |
| `mobileMenu` | `ReactNode` | - | Contenido del menú móvil |
| `fixed` | `boolean` | `true` | Fijar en la parte superior |
| `transparent` | `boolean` | `false` | Fondo transparente (para landing) |

**Estados:**

| Estado | Descripción | Visual |
|--------|-------------|--------|
| `default` | Estado base sin scroll | Fondo blanco sólido |
| `scrolled` | Después de scrolling 50px | Sombra elevate-sm |
| `mobile-open` | Menú móvil expandido | Overlay oscuro |

**Ejemplo:**

```tsx
<Navbar
  logo={<SpottruckLogo />}
  links={[
    { label: 'Viajes', href: '/trips', active: true },
    { label: 'Vehículos', href: '/vehicles' },
    { label: 'Reportes', href: '/reports' }
  ]}
  userMenu={{
    name: 'Juan Pérez',
    avatar: '/avatars/juan.jpg',
    items: [
      { label: 'Perfil', onClick: () => {} },
      { label: 'Configuración', onClick: () => {} },
      { label: 'Cerrar Sesión', onClick: () => {} }
    ]
  }}
/>
```

---

### 7. Sidebar

El componente **Sidebar** proporciona navegación lateral para interfaces de administración y secciones con múltiples subpáginas.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `items` | `SidebarItem[]` | `[]` | Items de navegación con estructura jerárquica |
| `collapsed` | `boolean` | `false` | Estado colapsado (solo iconos) |
| `activeItem` | `string` | - | ID del item activo |
| `onCollapse` | `function` | - | Callback cuando se colapsa/expande |

**Estructura de Item:**

```typescript
interface SidebarItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  badge?: string;
  children?: SidebarItem[];
}
```

**Estados:**

| Estado | Descripción |
|--------|-------------|
| `expanded` | Ancho completo (240px), texto visible |
| `collapsed` | Ancho reducido (64px), solo iconos |
| `hover` | Hover en item muestra tooltip con label |

**Ejemplo:**

```tsx
<Sidebar
  items={[
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon />, href: '/' },
    { id: 'vehicles', label: 'Vehículos', icon: <TruckIcon />, href: '/vehicles' },
    { id: 'trips', label: 'Viajes', icon: <RouteIcon />, href: '/trips' },
    { id: 'reports', label: 'Reportes', icon: <ChartIcon />, href: '/reports', children: [
      { id: 'monthly', label: 'Mensuales', href: '/reports/monthly' },
      { id: 'annual', label: 'Anuales', href: '/reports/annual' }
    ]}
  ]}
  activeItem="vehicles"
  onCollapse={(collapsed) => console.log(collapsed)}
/>
```

---

### 8. Tabs

El componente **Tabs** permite organizar contenido en secciones diferenciadas dentro de una misma vista.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `items` | `{ id: string; label: string; icon?: ReactNode }[]` | - | Items de tabs |
| `activeTab` | `string` | - | ID del tab activo |
| `onChange` | `(id: string) => void` | - | Callback al cambiar tab |
| `variant` | `'underline' \| 'pill' \| 'boxed'` | `'underline'` | Estilo visual de los tabs |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño de los tabs |

**Estados:**

| Estado | Descripción |
|--------|-------------|
| `default` | Tab inactivo con texto gris |
| `hover` | Texto más oscuro, indicador sutil |
| `active` | Texto primary, indicador de barra/pill |
| `disabled` | Texto con opacidad 50%, no clickeable |

**Ejemplo:**

```tsx
<Tabs
  variant="underline"
  activeTab="details"
  onChange={(id) => setActiveTab(id)}
  items={[
    { id: 'details', label: 'Detalles', icon: <InfoIcon /> },
    { id: 'documents', label: 'Documentos', icon: <DocumentIcon /> },
    { id: 'history', label: 'Historial', icon: <ClockIcon /> }
  ]}
/>
```

---

### 9. Breadcrumb

El componente **Breadcrumb** muestra la ruta de navegación actual, permitiendo al usuario retroceder a secciones anteriores.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `items` | `{ label: string; href?: string }[]` | - | Elementos de la ruta |
| `separator` | `ReactNode` | `'/'` | Icono o texto separador |
| `maxItems` | `number` | `5` | Máximo de items a mostrar |
| `homeLabel` | `string` | `'Inicio'` | Label para el elemento inicial |

**Ejemplo:**

```tsx
<Breadcrumb
  items={[
    { label: 'Inicio', href: '/' },
    { label: 'Vehículos', href: '/vehicles' },
    { label: 'Camiones', href: '/vehicles/trucks' },
    { label: 'ABC-1234' }
  ]}
/>
```

**Output visual:** Inicio / Vehículos / Camiones / ABC-1234

---

### 10. Pagination

El componente **Pagination** permite navegar entre páginas de resultados cuando el contenido está paginado.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `currentPage` | `number` | `1` | Página actual |
| `totalPages` | `number` | - | Total de páginas |
| `onPageChange` | `(page: number) => void` | - | Callback al cambiar página |
| `siblingCount` | `number` | `1` | Páginas adyacentes visibles |
| `showFirstLast` | `boolean` | `true` | Mostrar botones de inicio/fin |
| `showPrevNext` | `boolean` | `true` | Mostrar botones prev/next |

**Ejemplo:**

```tsx
<Pagination
  currentPage={3}
  totalPages={15}
  onPageChange={(page) => setCurrentPage(page)}
  siblingCount={1}
  showFirstLast
/>
```

**Variantes de botones:**

- Botones numéricos: 1, 2, 3, 4, 5
- Ellipsis: Cuando hay más de 7 páginas, muestra `...` para omitir rangos
- Flechas: ⟨ ⟩ para navegación previous/next

---

## Componentes de Formulario

### 11. Input

El componente **Input** es el campo de texto fundamental para la entrada de datos en formularios.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `label` | `string` | - | Label superior del campo |
| `placeholder` | `string` | - | Texto placeholder |
| `type` | `'text' \| 'email' \| 'password' \| 'number' \| 'tel'` | `'text'` | Tipo de entrada |
| `value` | `string \| number` | - | Valor controlado |
| `onChange` | `(value: string) => void` | - | Callback al cambiar |
| `error` | `string` | - | Mensaje de error |
| `helperText` | `string` | - | Texto de ayuda debajo |
| `disabled` | `boolean` | `false` | Campo deshabilitado |
| `required` | `boolean` | `false` | Campo obligatorio |
| `prefix` | `ReactNode` | - | Icono/texto al inicio |
| `suffix` | `ReactNode` | - | Icono/texto al final |
| `maxLength` | `number` | - | Longitud máxima |

**Estados:**

| Estado | Borde | Fondo | Icono |
|--------|-------|-------|-------|
| `default` | `#D1D5DB` | white | - |
| `focus` | `#3B82F6` | white | - |
| `success` | `#10B981` | `#F0FDF4` | ✓ |
| `error` | `#EF4444` | `#FEF2F2` | ✗ |
| `disabled` | `#E5E7EB` | `#F9FAFB` | - |

**Ejemplo:**

```tsx
<Input
  label="Patente del Vehículo"
  placeholder="ABC-1234"
  value={plate}
  onChange={setPlate}
  error={errors.plate}
  helperText="Formato: 3 letras, guión, 4 números"
  required
  prefix={<SearchIcon />}
/>
```

---

### 12. Textarea

El componente **Textarea** permite entrada de texto multilínea para comentarios, descripciones y campos extensos.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `label` | `string` | - | Label superior |
| `value` | `string` | - | Valor controlado |
| `onChange` | `(value: string) => void` | - | Callback al cambiar |
| `rows` | `number` | `4` | Número de filas visibles |
| `maxLength` | `number` | - | Longitud máxima |
| `resize` | `'none' \| 'vertical' \| 'both'` | `'vertical'` | Dirección de redimensionado |
| `placeholder` | `string` | - | Texto placeholder |

**Ejemplo:**

```tsx
<Textarea
  label="Descripción del Problema"
  placeholder="Describa el problema encontrado durante el viaje..."
  value={description}
  onChange={setDescription}
  rows={4}
  maxLength={500}
/>
```

---

### 13. Select

El componente **Select** es un menú desplegable que permite seleccionar una opción de una lista de valores predefinidos.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `options` | `{ value: string; label: string; disabled?: boolean }[]` | - | Lista de opciones |
| `value` | `string \| null` | - | Valor seleccionado |
| `onChange` | `(value: string) => void` | - | Callback al seleccionar |
| `placeholder` | `string` | `'Seleccionar...'` | Texto cuando no hay selección |
| `searchable` | `boolean` | `false` | Habilitar búsqueda |
| `disabled` | `boolean` | `false` | Deshabilitado |
| `loading` | `boolean` | `false` | Estado de carga |
| `error` | `string` | - | Mensaje de error |
| `clearable` | `boolean` | `false` | Permitir limpiar selección |

**Características:**

- Debounce de 300ms para búsqueda
- Navegación por teclado (↑↓ Enter Escape)
- Virtualización para listas >100 items

**Ejemplo:**

```tsx
<Select
  label="Tipo de Vehículo"
  options={[
    { value: 'truck', label: 'Camión' },
    { value: 'van', label: 'Furgón' },
    { value: 'trailer', label: 'Remolque', disabled: true }
  ]}
  value={vehicleType}
  onChange={setVehicleType}
  searchable
  placeholder="Seleccione un tipo"
/>
```

---

### 14. Checkbox

El componente **Checkbox** permite selección múltiple individual dentro de un grupo de opciones.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `checked` | `boolean` | - | Estado de selección |
| `onChange` | `(checked: boolean) => void` | - | Callback al cambiar |
| `label` | `string` | - | Texto label |
| `disabled` | `boolean` | `false` | Deshabilitado |
| `indeterminate` | `boolean` | `false` | Estado parcial |
| `name` | `string` | - | Nombre del grupo |

**Estados:**

| Estado | Visual |
|--------|--------|
| `unchecked` | Cuadrado vacío con borde gris |
| `checked` | Cuadrado con marca ✓ azul |
| `indeterminate` | Cuadrado con guión (→) |
| `disabled` | Opacidad 50% |

**Ejemplo:**

```tsx
<Checkbox
  checked={agreeTerms}
  onChange={setAgreeTerms}
  label="Acepto los términos y condiciones"
  name="terms"
/>
```

---

### 15. RadioGroup

El componente **RadioGroup** permite selección exclusiva dentro de un grupo de opciones.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `options` | `{ value: string; label: string; disabled?: boolean }[]` | - | Opciones del grupo |
| `value` | `string` | - | Valor seleccionado |
| `onChange` | `(value: string) => void` | - | Callback al seleccionar |
| `name` | `string` | - | Nombre del grupo |
| `disabled` | `boolean` | `false` | Deshabilitado todo el grupo |
| `direction` | `'horizontal' \| 'vertical'` | `'vertical'` | Layout de opciones |

**Estados:**

| Estado | Visual |
|--------|--------|
| `unselected` | Círculo vacío con borde gris |
| `selected` | Círculo azul con punto central |
| `disabled` | Opacidad 50% |

**Ejemplo:**

```tsx
<RadioGroup
  name="priority"
  value={priority}
  onChange={setPriority}
  direction="horizontal"
  options={[
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' }
  ]}
/>
```

---

### 16. Switch

El componente **Switch** es un interruptor de palanca para activar o desactivar configuraciones binarias.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `checked` | `boolean` | - | Estado del switch |
| `onChange` | `(checked: boolean) => void` | - | Callback al cambiar |
| `label` | `string` | - | Label descriptivo |
| `disabled` | `boolean` | `false` | Deshabilitado |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño del switch |

**Estados:**

| Estado | Fondo | Posición del knob |
|--------|-------|-------------------|
| `off` | `#E5E7EB` | Izquierda |
| `on` | `#3B82F6` | Derecha |
| `disabled` | `#F3F4F6` | Sin cambio, opacidad 50% |

**Ejemplo:**

```tsx
<Switch
  checked={notificationsEnabled}
  onChange={setNotificationsEnabled}
  label="Recibir notificaciones de viajes"
  size="md"
/>
```

---

### 17. DatePicker

El componente **DatePicker** permite seleccionar fechas de un calendario visual.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `Date \| null` | - | Fecha seleccionada |
| `onChange` | `(date: Date) => void` | - | Callback al seleccionar |
| `minDate` | `Date` | - | Fecha mínima seleccionable |
| `maxDate` | `Date` | - | Fecha máxima seleccionable |
| `placeholder` | `string` | `'Seleccionar fecha'` | Texto placeholder |
| `disabled` | `boolean` | `false` | Deshabilitado |
| `format` | `string` | `'DD/MM/YYYY'` | Formato de visualización |
| `rangeMode` | `boolean` | `false` | Permitir selección de rango |
| `disabledDates` | `Date[]` | - | Fechas no seleccionables |

**Características:**

- Navegación entre meses/años
- Selección de rango (con `rangeMode`)
- Deshabilitación de fechas específicas (feriados, días no laborables)

**Ejemplo:**

```tsx
<DatePicker
  value={startDate}
  onChange={setStartDate}
  minDate={new Date()}
  maxDate={addMonths(new Date(), 6)}
  placeholder="Fecha de inicio del viaje"
/>
```

---

### 18. FileUpload

El componente **FileUpload** permite cargar archivos mediante drag & drop o selección tradicional.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `accept` | `string` | - | Tipos MIME aceptados (ej: `.pdf,.jpg`) |
| `maxSize` | `number` | `10` | Tamaño máximo en MB |
| `onUpload` | `(files: File[]) => void` | - | Callback al cargar archivos |
| `progress` | `number` | - | Progreso de subida (0-100) |
| `multiple` | `boolean` | `false` | Permitir múltiples archivos |
| `disabled` | `boolean` | `false` | Deshabilitado |
| `showPreview` | `boolean` | `true` | Mostrar previsualización |

**Estados:**

| Estado | Descripción |
|--------|-------------|
| `idle` | Área de drop visible, texto indicativo |
| `dragover` | Borde azul, fondo azul claro |
| `uploading` | Spinner + barra de progreso |
| `success` | Checkmark verde, nombre del archivo |
| `error` | Mensaje de error en rojo |

**Ejemplo:**

```tsx
<FileUpload
  accept=".pdf,.jpg,.png"
  maxSize={10}
  onUpload={handleFilesUpload}
  multiple
/>
```

---

### 19. SearchInput

El componente **SearchInput** es un campo de búsqueda con icono y funcionalidad de debounce integrada.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `placeholder` | `string` | `'Buscar...'` | Texto placeholder |
| `onSearch` | `(value: string) => void` | - | Callback al buscar |
| `debounceMs` | `number` | `300` | Ms de espera antes de buscar |
| `value` | `string` | - | Valor controlado |
| `onChange` | `(value: string) => void` | - | Callback al escribir |
| `clearable` | `boolean` | `true` | Mostrar botón limpiar |

**Ejemplo:**

```tsx
<SearchInput
  placeholder="Buscar vehículos..."
  onSearch={handleSearch}
  debounceMs={500}
  clearable
/>
```

---

### 20. PhoneInput

El componente **PhoneInput** maneja la entrada de números telefónicos en formato argentino con validación automática.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `string` | - | Número telefónico |
| `onChange` | `(value: string) => void` | - | Callback al cambiar |
| `error` | `string` | - | Mensaje de error |
| `label` | `string` | `'Teléfono'` | Label del campo |
| `placeholder` | `string` | `'11 1234-5678'` | Placeholder |

**Características:**

- Formato automático: `XX XXXX-XXXX`
- Validación de prefijos argentinos (11, 221, 351, etc.)
- Integración con libphonenumber para validación internacional

**Ejemplo:**

```tsx
<PhoneInput
  label="Teléfono de Contacto"
  value={phone}
  onChange={setPhone}
  error={errors.phone}
/>
```

---

## Componentes de Botones

### 21. Button

El componente **Button** es el elemento interactivo principal para acciones del usuario.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Variante visual |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño del botón |
| `leftIcon` | `ReactNode` | - | Icono a la izquierda |
| `rightIcon` | `ReactNode` | - | Icono a la derecha |
| `loading` | `boolean` | `false` | Estado de carga |
| `loadingText` | `string` | - | Texto durante carga |
| `disabled` | `boolean` | `false` | Deshabilitado |
| `fullWidth` | `boolean` | `false` | Ancho completo |
| `onClick` | `function` | - | Handler de click |

**Variantes:**

| Variante | Uso |
|----------|-----|
| `primary` | Acciones principales, submit |
| `secondary` | Acciones secundarias |
| `outline` | Cancelar, volver |
| `ghost` | Acciones menores en contextos densos |
| `danger` | Eliminación, acciones irreversibles |

**Estados:**

| Estado | Descripción |
|--------|-------------|
| `default` | Estado base |
| `hover` | Fondo ligeramente más oscuro |
| `active` | Fondo más oscuro, scale 0.98 |
| `loading` | Spinner reemplaza contenido |
| `disabled` | Opacidad 50%, cursor not-allowed |

**Ejemplo:**

```tsx
<Button
  variant="primary"
  size="lg"
  leftIcon={<PlusIcon />}
  onClick={handleCreate}
  loading={isSubmitting}
  loadingText="Creando..."
>
  Crear Viaje
</Button>
```

---

### 22. IconButton

El componente **IconButton** es un botón que contiene solo un icono, usado para acciones compactas.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `icon` | `ReactNode` | - | Icono a mostrar |
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` | `'ghost'` | Variante visual |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño |
| `ariaLabel` | `string` | - | Label de accesibilidad |
| `loading` | `boolean` | `false` | Estado de carga |
| `disabled` | `boolean` | `false` | Deshabilitado |

**Ejemplo:**

```tsx
<IconButton
  icon={<EditIcon />}
  variant="outline"
  size="md"
  ariaLabel="Editar vehículo"
  onClick={handleEdit}
/>
```

---

### 23. ButtonGroup

El componente **ButtonGroup** organiza múltiples botones relacionados horizontalmente.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `buttons` | `ButtonProps[]` | - | Array de props de botones |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Dirección |
| `connected` | `boolean` | `true` | Botones conectados sin borde |

**Ejemplo:**

```tsx
<ButtonGroup
  orientation="horizontal"
  connected
  buttons={[
    { label: 'Día', onClick: () => setView('day') },
    { label: 'Semana', onClick: () => setView('week') },
    { label: 'Mes', onClick: () => setView('month') }
  ]}
/>
```

---

## Componentes de Feedback

### 24. Spinner

El componente **Spinner** indica que una operación está en progreso.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño del spinner |
| `color` | `string` | `'#3B82F6'` | Color del spinner |
| `label` | `string` | - | Texto descriptivo |

**Tamaños:**

| Size | Dimensión | Uso |
|------|-----------|-----|
| `sm` | 16px | Inline con texto |
| `md` | 24px | Botones, chips |
| `lg` | 40px | Páginas completas |

**Ejemplo:**

```tsx
<Flex justify="center" align="center" gap="md">
  <Spinner size="md" />
  <Text>Cargando vehículos...</Text>
</Flex>
```

---

### 25. Skeleton

El componente **Skeleton** muestra estados de carga mediante placeholders animados.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `'text' \| 'circular' \| 'rectangular'` | `'text'` | Forma del skeleton |
| `width` | `string \| number` | `'100%'` | Ancho |
| `height` | `string \| number` | `'1rem'` | Alto |
| `animation` | `'pulse' \| 'wave' \| 'none'` | `'wave'` | Tipo de animación |

**Ejemplo:**

```tsx
<Stack gap="md">
  <Flex gap="md" align="center">
    <Skeleton variant="circular" width={40} height={40} />
    <Stack gap="xs" flex={1}>
      <Skeleton variant="text" width="60%" height={16} />
      <Skeleton variant="text" width="40%" height={12} />
    </Stack>
  </Flex>
  <Skeleton variant="rectangular" width="100%" height={120} />
</Stack>
```

---

### 26. EmptyState

El componente **EmptyState** muestra cuando no hay contenido o datos para mostrar.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `icon` | `ReactNode` | - | Icono ilustrativo |
| `title` | `string` | - | Título principal |
| `description` | `string` | - | Descripción secundaria |
| `action` | `{ label: string; onClick: () => void }` | - | Acción principal |

**Ejemplo:**

```tsx
<EmptyState
  icon={<TruckIcon />}
  title="No hay vehículos registrados"
  description="Comience agregando su primer vehículo a la flota."
  action={{ label: 'Agregar Vehículo', onClick: handleAddVehicle }}
/>
```

---

### 27. Tooltip

El componente **Tooltip** muestra información adicional al hacer hover sobre un elemento.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `content` | `string \| ReactNode` | - | Contenido del tooltip |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Posición |
| `delay` | `number` | `200` | Ms antes de mostrar |
| `children` | `ReactNode` | - | Elemento trigger |

**Ejemplo:**

```tsx
<Tooltip content="Ver detalles del vehículo" position="top">
  <IconButton icon={<InfoIcon />} />
</Tooltip>
```

---

## Componentes de Expansión

### 28. Accordion

El componente **Accordion** permite expandir y colapsar secciones de contenido.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `items` | `AccordionItem[]` | - | Items del acordeón |
| `allowMultiple` | `boolean` | `false` | Permitir múltiples abiertos |
| `defaultExpanded` | `string[]` | - | IDs expandidos por defecto |
| `variant` | `'default' \| 'bordered' \| 'separated'` | `'default'` | Estilo visual |

**Estructura de Item:**

```typescript
interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
}
```

**Estados:**

| Estado | Descripción |
|--------|-------------|
| `collapsed` | Solo título visible |
| `expanded` | Contenido visible, chevron rotado 180° |
| `disabled` | Opacidad 50%, no interactivo |

**Ejemplo:**

```tsx
<Accordion
  items={[
    {
      id: 'details',
      title: 'Detalles del Vehículo',
      content: <VehicleDetails />,
      icon: <InfoIcon />
    },
    {
      id: 'documents',
      title: 'Documentación',
      content: <VehicleDocuments />,
      icon: <DocumentIcon />
    }
  ]}
  defaultExpanded={['details']}
  allowMultiple
/>
```

---

### 29. Chip

El componente **Chip** (también conocido como Tag) muestra elementos pequeños con acciones opcionales.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `label` | `string` | - | Texto del chip |
| `color` | `'primary' \| 'success' \| 'warning' \| 'error' \| 'gray'` | `'gray'` | Color del chip |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño |
| `removable` | `boolean` | `false` | Mostrar botón X |
| `onRemove` | `function` | - | Callback al remover |
| `icon` | `ReactNode` | - | Icono izquierdo |
| `variant` | `'solid' \| 'outline' \| 'soft'` | `'solid'` | Variante visual |

**Ejemplo:**

```tsx
<Stack direction="horizontal" gap="sm">
  <Chip label="Camión" color="primary" />
  <Chip label="En viaje" color="success" icon={<TruckIcon />} />
  <Chip label="Mantenimiento" color="warning" removable onRemove={() => {}} />
  <Chip label="Urgente" color="error" size="lg" />
</Stack>
```

---

### 30. ProgressBar

El componente **ProgressBar** muestra visualmente el progreso de una operación o el completado de un objetivo.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `number` | - | Valor actual (0-100) |
| `color` | `string` | `'#3B82F6'` | Color de la barra |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Grosor de la barra |
| `showLabel` | `boolean` | `false` | Mostrar porcentaje |
| `label` | `string` | - | Etiqueta descriptiva |
| `indeterminate` | `boolean` | `false` | Modo indeterminado |

**Tamaños:**

| Size | Alto | Uso |
|------|------|-----|
| `sm` | 4px | Indicadores inline |
| `md` | 8px | Uso general |
| `lg` | 12px | Progress destacado |

**Ejemplo:**

```tsx
<Stack gap="sm">
  <Flex justify="between">
    <Text>Capacidad del Tanque</Text>
    <Text variant="caption">75%</Text>
  </Flex>
  <ProgressBar value={75} color="#10B981" size="md" />
</Stack>
```

---

### 31. TripCard

El componente **TripCard** muestra un resumen de un viaje con información del origen, destino, vehículo y conductor asociado.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `trip` | `Trip` | - | Datos del viaje |
| `status` | `'pending' \| 'in_progress' \| 'completed' \| 'cancelled'` | - | Estado del viaje |
| `onPress` | `function` | - | Callback al presionar la tarjeta |
| `compact` | `boolean` | `false` | Variante compacta |

**Estados:**

| Estado | Borde | Badge |
|--------|-------|-------|
| `pending` | `#F59E0B` | Amarillo "Pendiente" |
| `in_progress` | `#3B82F6` | Azul "En Curso" |
| `completed` | `#10B981` | Verde "Completado" |
| `cancelled` | `#EF4444` | Rojo "Cancelado" |

**Ejemplo:**

```tsx
<TripCard
  trip={{
    id: 'TRP-001',
    origin: 'Buenos Aires',
    destination: 'Córdoba',
    date: '2026-06-15',
    vehicle: { plate: 'ABC-1234', brand: 'Scania', model: 'R500' },
    driver: { name: 'Juan Pérez', avatar: '/avatars/juan.jpg' },
    distance: 695,
    duration: '8h 30m'
  }}
  status="in_progress"
  onPress={() => navigate(`/trips/TRP-001`)}
/>
```

---

### 32. AuctionCard

El componente **AuctionCard** muestra una subasta activa con información del viaje, precio base y cuenta regresiva.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `auction` | `Auction` | - | Datos de la subasta |
| `currentBid` | `number` | - | Oferta actual |
| `timeLeft` | `string` | - | Tiempo restante |
| `onBid` | `function` | - | Callback al ofertar |
| `onViewDetails` | `function` | - | Callback ver detalles |

**Estados:**

| Estado | Color | Descripción |
|--------|-------|-------------|
| `active` | Azul primario | Subasta abierta |
| `ending_soon` | Naranja | < 1 hora restante |
| `closed` | Gris | Subasta finalizada |
| `won` | Verde | Ganada por el usuario |

**Ejemplo:**

```tsx
<AuctionCard
  auction={{
    id: 'AUCT-042',
    trip: { origin: 'Rosario', destination: 'Mendoza', date: '2026-06-20' },
    basePrice: 45000,
    vehicleType: 'Camión 12t',
    loadType: 'Carga seca'
  }}
  currentBid={52000}
  timeLeft="2h 15m"
  onBid={() => openBidModal()}
  onViewDetails={() => navigate(`/auctions/AUCT-042`)}
/>
```

---

### 33. BidCard

El componente **BidCard** muestra la oferta de un transportista dentro de una subasta, con su precio, rating y tiempo de respuesta.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `bid` | `Bid` | - | Datos de la oferta |
| `isWinning` | `boolean` | `false` | Indica si es la oferta ganadora |
| `isOwn` | `boolean` | `false` | Indica si es la oferta del usuario actual |
| `onAccept` | `function` | - | Callback aceptar oferta |
| `onReject` | `function` | - | Callback rechazar oferta |

**Estados:**

| Estado | Borde | Badge |
|--------|-------|-------|
| `outbid` | Gris | "Fuera" |
| `winning` | Verde | "Ganadora" |
| `accepted` | Verde sólido | "Aceptada" |
| `rejected` | Rojo | "Rechazada" |

**Ejemplo:**

```tsx
<BidCard
  bid={{
    id: 'BID-123',
    carrier: { name: 'Transportes Norte', rating: 4.8, avatar: '/avatars/norte.jpg' },
    amount: 48500,
    message: 'Puedo realizar el viaje con semirremolque abierto',
    submittedAt: '2026-06-04T10:30:00Z',
    validUntil: '2026-06-04T14:30:00Z'
  }}
  isWinning={true}
  onAccept={() => acceptBid('BID-123')}
  onReject={() => rejectBid('BID-123')}
/>
```

---

### 34. RatingStars

El componente **RatingStars** muestra una calificación visual mediante estrellas, con soporte para entrada interactiva o solo lectura.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `number` | - | Valor de calificación (0-5) |
| `max` | `number` | `5` | Número máximo de estrellas |
| `onChange` | `function` | - | Callback al cambiar calificación |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño de las estrellas |
| `readonly` | `boolean` | `false` | Modo solo lectura |
| `showValue` | `boolean` | `false` | Mostrar valor numérico |
| `count` | `number` | - | Total de reseñas |

**Tamaños:**

| Size | Dimensión | Uso |
|------|-----------|-----|
| `sm` | 14px | Inline con texto |
| `md` | 20px | Cards, listas |
| `lg` | 28px | Páginas de detalle |

**Ejemplo:**

```tsx
<RatingStars
  value={4.5}
  size="lg"
  showValue
  count={127}
  onChange={(rating) => setUserRating(rating)}
/>
```

---

### 35. MapView

El componente **MapView** muestra un mapa interactivo con soporte para rutas, marcadores y geocercas para tracking de vehículos.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `center` | `{ lat: number; lng: number }` | - | Centro del mapa |
| `zoom` | `number` | `12` | Nivel de zoom |
| `markers` | `Marker[]` | `[]` | Marcadores en el mapa |
| `route` | `Route` | - | Ruta a mostrar |
| `showTraffic` | `boolean` | `false` | Mostrar tráfico |
| `onMarkerClick` | `function` | - | Callback al clickear marcador |
| `interactive` | `boolean` | `true` | Habilitar interacción |

**Estructura de Marker:**

```typescript
interface Marker {
  id: string;
  position: { lat: number; lng: number };
  type: 'vehicle' | 'origin' | 'destination' | 'poi';
  label?: string;
  icon?: string;
  color?: string;
}
```

**Estados:**

| Estado | Descripción |
|--------|-------------|
| `loading` | Spinner centrado sobre mapa |
| `ready` | Mapa interactivo |
| `error` | Mensaje de error con retry |
| `no-permission` | Solicitar permisos de ubicación |

**Ejemplo:**

```tsx
<MapView
  center={{ lat: -34.6037, lng: -58.3816 }}
  zoom={10}
  markers={[
    { id: 'v1', position: { lat: -34.6, lng: -58.4 }, type: 'vehicle', label: 'Scania R500' },
    { id: 'o1', position: { lat: -34.5, lng: -58.3 }, type: 'origin', label: 'Depósito Central' },
    { id: 'd1', position: { lat: -34.7, lng: -58.5 }, type: 'destination', label: ' Cliente' }
  ]}
  route={{
    origin: { lat: -34.5, lng: -58.3 },
    destination: { lat: -34.7, lng: -58.5 },
    waypoints: []
  }}
  onMarkerClick={(marker) => openVehicleDetail(marker.id)}
/>
```

---

### 36. Charts

Los componentes de **Charts** proporcionan visualización de datos mediante gráficos de líneas, barras y circulares.

#### LineChart

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `data` | `ChartDataPoint[]` | - | Datos del gráfico |
| `xKey` | `string` | - | Clave del eje X |
| `yKey` | `string` | - | Clave del eje Y |
| `height` | `number` | `200` | Altura del gráfico |
| `showGrid` | `boolean` | `true` | Mostrar línea de grid |
| `showDots` | `boolean` | `false` | Mostrar puntos en línea |
| `color` | `string` | `'#3B82F6'` | Color de la línea |

**Ejemplo:**

```tsx
<LineChart
  data={[
    { date: '2026-01', earnings: 120000 },
    { date: '2026-02', earnings: 145000 },
    { date: '2026-03', earnings: 132000 },
    { date: '2026-04', earnings: 168000 }
  ]}
  xKey="date"
  yKey="earnings"
  height={250}
  showDots
/>
```

#### BarChart

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `data` | `ChartDataPoint[]` | - | Datos del gráfico |
| `xKey` | `string` | - | Clave del eje X |
| `yKey` | `string` | - | Clave del eje Y |
| `height` | `number` | `200` | Altura del gráfico |
| `horizontal` | `boolean` | `false` | Orientación horizontal |
| `color` | `string` | `'#3B82F6'` | Color de las barras |
| `showValues` | `boolean` | `false` | Mostrar valores sobre barras |

**Ejemplo:**

```tsx
<BarChart
  data={[
    { month: 'Ene', trips: 45 },
    { month: 'Feb', trips: 52 },
    { month: 'Mar', trips: 48 },
    { month: 'Abr', trips: 61 }
  ]}
  xKey="month"
  yKey="trips"
  height={200}
  showValues
/>
```

#### PieChart

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `data` | `PieChartDataPoint[]` | - | Datos del gráfico |
| `nameKey` | `string` | - | Clave para nombre de sector |
| `valueKey` | `string` | - | Clave para valor |
| `size` | `number` | `200` | Tamaño del gráfico |
| `showLabels` | `boolean` | `true` | Mostrar etiquetas |
| `donut` | `boolean` | `false` | Variante donut |

**Ejemplo:**

```tsx
<PieChart
  data={[
    { status: 'Completados', value: 65, color: '#10B981' },
    { status: 'En curso', value: 20, color: '#3B82F6' },
    { status: 'Pendientes', value: 10, color: '#F59E0B' },
    { status: 'Cancelados', value: 5, color: '#EF4444' }
  ]}
  nameKey="status"
  valueKey="value"
  size={180}
  donut
/>
```

---

## Uso y Contribución

Esta biblioteca de componentes sigue las pautas del sistema de diseño de Spottruck. Para contribuir con nuevos componentes o modificar existentes:

1. Crear documentación con props, estados y ejemplos
2. Implementar tests unitarios con coverage >90%
3. Incluir variantes de accesibilidad (focus, aria, keyboard)
4. Verificar responsive behavior en diferentes breakpoints

**Versión:** 1.2.0  
**Total de componentes:** 36