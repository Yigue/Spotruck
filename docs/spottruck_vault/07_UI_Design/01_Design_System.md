---
title: Spottruck Design System
date: 2026-06-04
author: Spottruck Design Team
status: active
tags:
  - design-system
  - ui
  - spottruck
  - tokens
  - style-guide
---

# Spottruck Design System

## 1. Introducción y Propósito

El **Design System de Spottruck** es el sistema de diseño oficial para la plataforma de subastas y logística de transporte de carga en Argentina. Este documento establece las bases fundamentales de diseño que rigen todos los aspectos visuales y de interacción de la aplicación, garantizando coherencia, escalabilidad y una experiencia de usuario consistente a través de todas las plataformas y funcionalidades.

El objetivo principal de este design system es proporcionar un lenguaje visual unificado que refleje los valores de Spottruck: **confianza, eficiencia y profesionalismo** en el sector logístico argentino. Cada decisión de diseño ha sido tomada considerando tanto la usabilidad técnica como la accesibilidad, asegurando que la plataforma sea usable para todos los usuarios del ecosistema de transporte de carga.

Este documento está estructurado para servir como referencia técnica completa para desarrolladores, diseñadores y stakeholders que participan en el desarrollo y mantenimiento de la plataforma Spottruck.

---

## 2. Sistema de Color

El sistema de color de Spottruck está diseñado para comunicar profesionalismo y confianza, utilizando una paleta principal basada en azules navales complementados con acentos ámbar que aportan dinamismo y visibilidad a elementos interactivos. Los colores han sido seleccionados siguiendo las pautas WCAG 2.1 para garantizar accesibilidad en todos los modos de visualización.

### 2.1 Paleta Principal (Primary Colors)

Los colores primarios constituyen la columna vertebral visual de la marca Spottruck y se utilizan en elementos de navegación, headers, botones primarios y componentes principales de la interfaz.

```css
:root {
  /* Primary Blue - Color principal de marca */
  --color-primary-50: #E8F4FC;
  --color-primary-100: #C5E2F7;
  --color-primary-200: #9FCFF2;
  --color-primary-300: #78BCEA;
  --color-primary-400: #5AA7E3;
  --color-primary-500: #1E3A5F;  /* Color base - Azul Naval */
  --color-primary-600: #1A3354;
  --color-primary-700: #162C49;
  --color-primary-800: #12253E;
  --color-primary-900: #0E1E33;
  
  /* Aplicaciones típicas */
  --color-primary-default: var(--color-primary-500);
  --color-primary-hover: var(--color-primary-600);
  --color-primary-active: var(--color-primary-700);
  --color-primary-light: var(--color-primary-100);
  --color-primary-subtle: var(--color-primary-50);
}
```

### 2.2 Paleta Secundaria (Secondary Colors)

Los colores secundarios se utilizan para elementos de énfasis, llamadas a la acción secundarias, indicadores de estado activos y elementos decorativos que requieren mayor visibilidad sin competir con los elementos primarios.

```css
:root {
  /* Secondary Amber - Color de acento y CTAs */
  --color-secondary-50: #FEF7E6;
  --color-secondary-100: #FDE9C4;
  --color-secondary-200: #FBD89E;
  --color-secondary-300: #F9C678;
  --color-secondary-400: #F7B452;
  --color-secondary-500: #F59E0B;  /* Color base - ámbar */
  --color-secondary-600: #DC8F0A;
  --color-secondary-700: #C38009;
  --color-secondary-800: #A97108;
  --color-secondary-900: #8F6207;
  
  /* Aplicaciones típicas */
  --color-secondary-default: var(--color-secondary-500);
  --color-secondary-hover: var(--color-secondary-600);
  --color-secondary-active: var(--color-secondary-700);
  --color-secondary-light: var(--color-secondary-100);
  --color-secondary-subtle: var(--color-secondary-50);
}
```

### 2.3 Paleta Neutral

Los grises neutrales proporcionan la base para fondos, bordes, texto secundario y elementos de estructura. La escala neutral es especialmente crítica en una plataforma B2B donde la legibilidad y el contraste apropiado son fundamentales para sesiones de trabajo prolongadas.

```css
:root {
  /* Neutral Gray Scale */
  --color-neutral-0: #FFFFFF;
  --color-neutral-50: #F9FAFB;
  --color-neutral-100: #F3F4F6;
  --color-neutral-200: #E5E7EB;
  --color-neutral-300: #D1D5DB;
  --color-neutral-400: #9CA3AF;
  --color-neutral-500: #6B7280;
  --color-neutral-600: #4B5563;
  --color-neutral-700: #374151;
  --color-neutral-800: #1F2937;
  --color-neutral-900: #111827;
  --color-neutral-950: #030712;
  
  /* Aplicaciones típicas */
  --color-background: var(--color-neutral-50);
  --color-surface: var(--color-neutral-0);
  --color-surface-elevated: var(--color-neutral-0);
  --color-border: var(--color-neutral-200);
  --color-border-strong: var(--color-neutral-300);
  --color-text-primary: var(--color-neutral-900);
  --color-text-secondary: var(--color-neutral-600);
  --color-text-tertiary: var(--color-neutral-400);
  --color-text-inverse: var(--color-neutral-0);
}
```

### 2.4 Colores Semánticos

Los colores semánticos comunican estados, retroalimentación y información contextual. Cada color semántico tiene significados específicos que deben respetarse consistentemente en toda la plataforma.

```css
:root {
  /* Semantic Colors - Success */
  --color-success-50: #ECFDF5;
  --color-success-100: #D1FAE5;
  --color-success-200: #A7F3D0;
  --color-success-300: #6EE7B7;
  --color-success-400: #34D399;
  --color-success-500: #10B981;
  --color-success-600: #059669;
  --color-success-700: #047857;
  --color-success-800: #065F46;
  --color-success-900: #064E3B;
  
  --color-success-default: var(--color-success-500);
  --color-success-hover: var(--color-success-600);
  --color-success-active: var(--color-success-700);
  --color-success-subtle: var(--color-success-50);
  --color-success-text: var(--color-success-700);
  
  /* Semantic Colors - Error */
  --color-error-50: #FEF2F2;
  --color-error-100: #FEE2E2;
  --color-error-200: #FECACA;
  --color-error-300: #FCA5A5;
  --color-error-400: #F87171;
  --color-error-500: #EF4444;
  --color-error-600: #DC2626;
  --color-error-700: #B91C1C;
  --color-error-800: #991B1B;
  --color-error-900: #7F1D1D;
  
  --color-error-default: var(--color-error-500);
  --color-error-hover: var(--color-error-600);
  --color-error-active: var(--color-error-700);
  --color-error-subtle: var(--color-error-50);
  --color-error-text: var(--color-error-700);
  
  /* Semantic Colors - Warning */
  --color-warning-50: #FFFBEB;
  --color-warning-100: #FEF3C7;
  --color-warning-200: #FDE68A;
  --color-warning-300: #FCD34D;
  --color-warning-400: #FBBF24;
  --color-warning-500: #F59E0B;
  --color-warning-600: #D97706;
  --color-warning-700: #B45309;
  --color-warning-800: #92400E;
  --color-warning-900: #78350F;
  
  --color-warning-default: var(--color-warning-500);
  --color-warning-hover: var(--color-warning-600);
  --color-warning-active: var(--color-warning-700);
  --color-warning-subtle: var(--color-warning-50);
  --color-warning-text: var(--color-warning-800);
  
  /* Semantic Colors - Info */
  --color-info-50: #EFF6FF;
  --color-info-100: #DBEAFE;
  --color-info-200: #BFDBFE;
  --color-info-300: #93C5FD;
  --color-info-400: #60A5FA;
  --color-info-500: #3B82F6;
  --color-info-600: #2563EB;
  --color-info-700: #1D4ED8;
  --color-info-800: #1E40AF;
  --color-info-900: #1E3A8A;
  
  --color-info-default: var(--color-info-500);
  --color-info-hover: var(--color-info-600);
  --color-info-active: var(--color-info-700);
  --color-info-subtle: var(--color-info-50);
  --color-info-text: var(--color-info-700);
}
```

### 2.5 Modo Oscuro (Dark Mode)

El soporte para modo oscuro es esencial en una plataforma de uso profesional. Los tokens de modo oscuro redefinen los coloressemánticos mientras mantienen la estructura de tokens original.

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Backgrounds en modo oscuro */
    --color-background: var(--color-neutral-950);
    --color-surface: var(--color-neutral-900);
    --color-surface-elevated: var(--color-neutral-800);
    
    /* Bordes en modo oscuro */
    --color-border: var(--color-neutral-700);
    --color-border-strong: var(--color-neutral-600);
    
    /* Textos en modo oscuro */
    --color-text-primary: var(--color-neutral-100);
    --color-text-secondary: var(--color-neutral-400);
    --color-text-tertiary: var(--color-neutral-500);
    
    /* Ajustes para modo oscuro */
    --color-primary-50: #1E3A5F;
    --color-primary-500: #5AA7E3;
    --color-primary-600: #78BCEA;
    
    --color-secondary-500: #FBBF24;
    --color-secondary-600: #F9C678;
  }
}

/* Dark mode via clase */
.dark-mode {
  --color-background: var(--color-neutral-950);
  --color-surface: var(--color-neutral-900);
  --color-surface-elevated: var(--color-neutral-800);
  --color-border: var(--color-neutral-700);
  --color-border-strong: var(--color-neutral-600);
  --color-text-primary: var(--color-neutral-100);
  --color-text-secondary: var(--color-neutral-400);
  --color-text-tertiary: var(--color-neutral-500);
}
```

---

## 3. Sistema Tipográfico

El sistema tipográfico de Spottruck está diseñado para garantizar la legibilidad en contextos de negocio donde los usuarios leen grandes volúmenes de información técnica, desde detalles de cargas hasta condiciones de subastas. La selección de fuentes prioriza la claridad en pantallas de todos los tamaños.

### 3.1 Familias Tipográficas

```css
:root {
  /* Font Families */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  --font-family-mono: 'Roboto Mono', 'Fira Code', 'JetBrains Mono', Consolas, monospace;
  
  /* Font Family Applications */
  --font-family-body: var(--font-family-sans);
  --font-family-heading: var(--font-family-sans);
  --font-family-ui: var(--font-family-sans);
  --font-family-data: var(--font-family-mono);
  --font-family-code: var(--font-family-mono);
  --font-family-price: var(--font-family-mono);
  --font-family-form: var(--font-family-sans);
}
```

### 3.2 Escala Tipográfica

La escala tipográfica utiliza una progresión modular de 1.25 (Major Third) para mantener proporciones armónicas entre los diferentes tamaños de texto.

```css
:root {
  /* Type Scale */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2rem;      /* 32px */
  --font-size-5xl: 2.5rem;    /* 40px */
  
  /* Line Heights */
  --font-line-height-none: 1;
  --font-line-height-tight: 1.25;
  --font-line-height-snug: 1.375;
  --font-line-height-normal: 1.5;
  --font-line-height-relaxed: 1.625;
  --font-line-height-loose: 2;
  
  /* Letter Spacing */
  --font-letter-spacing-tight: -0.025em;
  --font-letter-spacing-normal: 0;
  --font-letter-spacing-wide: 0.025em;
  --font-letter-spacing-wider: 0.05em;
  --font-letter-spacing-widest: 0.1em;
}
```

### 3.3 Pesos Tipográficos

```css
:root {
  /* Font Weights */
  --font-weight-thin: 100;
  --font-weight-extralight: 200;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
  --font-weight-black: 900;
  
  /* Common weight applications */
  --font-weight-body: var(--font-weight-normal);
  --font-weight-heading: var(--font-weight-semibold);
  --font-weight-ui: var(--font-weight-medium);
  --font-weight-label: var(--font-weight-medium);
  --font-weight-button: var(--font-weight-semibold);
  --font-weight-data: var(--font-weight-medium);
}
```

### 3.4 Estilos Tipográficos Predefinidos

```css
:root {
  /* Heading Styles */
  --text-h1: var(--font-size-4xl) / var(--font-line-height-tight) var(--font-weight-bold);
  --text-h2: var(--font-size-3xl) / var(--font-line-height-tight) var(--font-weight-semibold);
  --text-h3: var(--font-size-2xl) / var(--font-line-height-snug) var(--font-weight-semibold);
  --text-h4: var(--font-size-xl) / var(--font-line-height-snug) var(--font-weight-semibold);
  --text-h5: var(--font-size-lg) / var(--font-line-height-normal) var(--font-weight-medium);
  --text-h6: var(--font-size-base) / var(--font-line-height-normal) var(--font-weight-medium);
  
  /* Body Styles */
  --text-body-lg: var(--font-size-lg) / var(--font-line-height-relaxed) var(--font-weight-normal);
  --text-body: var(--font-size-base) / var(--font-line-height-normal) var(--font-weight-normal);
  --text-body-sm: var(--font-size-sm) / var(--font-line-height-normal) var(--font-weight-normal);
  
  /* UI Styles */
  --text-label: var(--font-size-sm) / var(--font-line-height-none) var(--font-weight-medium);
  --text-caption: var(--font-size-xs) / var(--font-line-height-normal) var(--font-weight-normal);
  --text-overline: var(--font-size-xs) / var(--font-line-height-none) var(--font-weight-semibold);
  
  /* Data & Price Styles - Monospace */
  --text-price-lg: var(--font-size-3xl) / var(--font-line-height-none) var(--font-weight-bold);
  --text-price: var(--font-size-2xl) / var(--font-line-height-none) var(--font-weight-semibold);
  --text-data: var(--font-size-sm) / var(--font-line-height-none) var(--font-weight-medium);
  --text-data-lg: var(--font-size-base) / var(--font-line-height-none) var(--font-weight-medium);
  
  /* Code Styles */
  --text-code: var(--font-size-sm) / var(--font-line-height-normal) var(--font-weight-normal);
  --text-code-sm: var(--font-size-xs) / var(--font-line-height-normal) var(--font-weight-normal);
}
```

---

## 4. Sistema de Espaciado

El sistema de espaciado de Spottruck utiliza una base de 4px con una escala geométrica que facilita la creación de layouts consistentes y visualmente armónicos. Este enfoque basado en múltiplos permite flexibilidad mientras mantiene una rejilla visual coherente.

### 4.1 Escala de Espaciado

```css
:root {
  /* Spacing Scale - Base 4px */
  --spacing-0: 0;
  --spacing-px: 1px;
  --spacing-0-5: 0.125rem;   /* 2px */
  --spacing-1: 0.25rem;      /* 4px */
  --spacing-1-5: 0.375rem;   /* 6px */
  --spacing-2: 0.5rem;       /* 8px */
  --spacing-2-5: 0.625rem;   /* 10px */
  --spacing-3: 0.75rem;      /* 12px */
  --spacing-3-5: 0.875rem;   /* 14px */
  --spacing-4: 1rem;         /* 16px */
  --spacing-5: 1.25rem;      /* 20px */
  --spacing-6: 1.5rem;       /* 24px */
  --spacing-7: 1.75rem;      /* 28px */
  --spacing-8: 2rem;         /* 32px */
  --spacing-9: 2.25rem;      /* 36px */
  --spacing-10: 2.5rem;      /* 40px */
  --spacing-11: 2.75rem;     /* 44px */
  --spacing-12: 3rem;        /* 48px */
  --spacing-14: 3.5rem;      /* 56px */
  --spacing-16: 4rem;        /* 64px */
  --spacing-20: 5rem;        /* 80px */
  --spacing-24: 6rem;        /* 96px */
  --spacing-32: 8rem;        /* 128px */
}
```

### 4.2 Tokens de Espaciado Semántico

```css
:root {
  /* Semantic Spacing Tokens */
  
  /* Inset Spacing (padding inside components) */
  --inset-padding-xs: var(--spacing-1);
  --inset-padding-sm: var(--spacing-2);
  --inset-padding-md: var(--spacing-3);
  --inset-padding-lg: var(--spacing-4);
  --inset-padding-xl: var(--spacing-6);
  --inset-padding-2xl: var(--spacing-8);
  
  /* Stack Spacing (vertical gaps between elements) */
  --stack-spacing-xs: var(--spacing-1);
  --stack-spacing-sm: var(--spacing-2);
  --stack-spacing-md: var(--spacing-4);
  --stack-spacing-lg: var(--spacing-6);
  --stack-spacing-xl: var(--spacing-8);
  --stack-spacing-2xl: var(--spacing-12);
  
  /* Inline Spacing (horizontal gaps between elements) */
  --inline-spacing-xs: var(--spacing-1);
  --inline-spacing-sm: var(--spacing-2);
  --inline-spacing-md: var(--spacing-3);
  --inline-spacing-lg: var(--spacing-4);
  --inline-spacing-xl: var(--spacing-6);
  
  /* Section Spacing (large gaps between sections) */
  --section-spacing-sm: var(--spacing-8);
  --section-spacing-md: var(--spacing-12);
  --section-spacing-lg: var(--spacing-16);
  --section-spacing-xl: var(--spacing-24);
  
  /* Container Padding */
  --container-padding-sm: var(--spacing-4);
  --container-padding-md: var(--spacing-6);
  --container-padding-lg: var(--spacing-8);
  --container-padding-xl: var(--spacing-12);
}
```

---

## 5. Sistema de Sombras (Shadows)

El sistema de sombras de Spottruck proporciona profundidad y jerarquía visual, ayudando a los usuarios a comprender la estructura de la interfaz y la relación entre elementos flotantes y fijos.

### 5.1 Escala de Sombras

```css
:root {
  /* Shadow Scale */
  
  /* Subtle - Para elementos en superficie default, barely elevated */
  --shadow-subtle: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-subtle-md: 0 2px 4px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.1);
  --shadow-subtle-lg: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
  
  /* Small - Para componentes como cards, inputs */
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-sm-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  
  /* Medium - Para dropdowns, popovers, modals pequeños */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-md-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  
  /* Large - Para modales, dialogs principales */
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Extra Large - Para notificaciones, overlays */
  --shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-2xl: 0 32px 64px -16px rgba(0, 0, 0, 0.3);
  
  /* Inner Shadows - Para inputs, wells */
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  --shadow-inner-sm: inset 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  
  /* Focus Ring - Para estados de focus accesibles */
  --shadow-focus-ring: 0 0 0 3px rgba(30, 58, 95, 0.4);
  --shadow-focus-ring-error: 0 0 0 3px rgba(239, 68, 68, 0.4);
  --shadow-focus-ring-success: 0 0 0 3px rgba(16, 185, 129, 0.4);
}
```

### 5.2 Sombras por Componente

```css
:root {
  /* Component-specific shadows */
  --shadow-card: var(--shadow-sm-md);
  --shadow-card-hover: var(--shadow-md-lg);
  --shadow-dropdown: var(--shadow-md-lg);
  --shadow-modal: var(--shadow-lg-xl);
  --shadow-tooltip: var(--shadow-subtle-md);
  --shadow-button: var(--shadow-subtle);
  --shadow-button-hover: var(--shadow-sm);
  --shadow-input: var(--shadow-inner-sm);
  --shadow-input-focus: var(--shadow-focus-ring);
  --shadow-badge: var(--shadow-subtle);
  --shadow-avatar: var(--shadow-sm);
  --shadow-toast: var(--shadow-lg);
}
```

### 5.3 Sombras en Modo Oscuro

```css
@media (prefers-color-scheme: dark) {
  :root {
    --shadow-subtle: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
    --shadow-subtle-md: 0 2px 4px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.4);
    --shadow-subtle-lg: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.4);
    --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.5);
    --shadow-sm-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.5);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.5);
    --shadow-md-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.5);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.5);
    --shadow-lg-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
    --shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
}
```

---

## 6. Sistema de Bordes y Radios

El sistema de bordes define la estructura visual de los componentes, estableciendo límites claros entre elementos mientras mantiene una estética moderna y accesible.

### 6.1 Anchos de Borde

```css
:root {
  /* Border Widths */
  --border-width-none: 0;
  --border-width-xs: 0.5px;
  --border-width-sm: 1px;
  --border-width-md: 1.5px;
  --border-width-lg: 2px;
  --border-width-xl: 3px;
  
  /* Border Width Applications */
  --border-width-default: var(--border-width-sm);
  --border-width-strong: var(--border-width-md);
  --border-width-focus: var(--border-width-lg);
}
```

### 6.2 Radio de Borde (Border Radius)

```css
:root {
  /* Border Radius Scale */
  --radius-none: 0;
  --radius-xs: 0.125rem;     /* 2px */
  --radius-sm: 0.25rem;      /* 4px */
  --radius-md: 0.5rem;       /* 8px */
  --radius-lg: 0.75rem;      /* 12px */
  --radius-xl: 1rem;         /* 16px */
  --radius-2xl: 1.5rem;      /* 24px */
  --radius-3xl: 2rem;        /* 32px */
  --radius-full: 9999px;    /* Pill shape */
  
  /* Semantic Radius Tokens */
  --radius-button: var(--radius-md);
  --radius-input: var(--radius-md);
  --radius-card: var(--radius-lg);
  --radius-modal: var(--radius-xl);
  --radius-dropdown: var(--radius-lg);
  --radius-badge: var(--radius-sm);
  --radius-avatar: var(--radius-full);
  --radius-chip: var(--radius-full);
  --radius-tooltip: var(--radius-sm);
  --radius-toast: var(--radius-lg);
  
  /* Component-specific radii */
  --radius-sm-button: var(--radius-sm);
  --radius-md-button: var(--radius-md);
  --radius-lg-button: var(--radius-lg);
  --radius-pill: var(--radius-full);
  
  /* Image radii */
  --radius-image-sm: var(--radius-sm);
  --radius-image-md: var(--radius-md);
  --radius-image-lg: var(--radius-lg);
  --radius-image-xl: var(--radius-xl);
}
```

### 6.3 Colores de Borde

```css
:root {
  /* Border Colors */
  --border-color-default: var(--color-neutral-200);
  --border-color-strong: var(--color-neutral-300);
  --border-color-subtle: var(--color-neutral-100);
  --border-color-focus: var(--color-primary-500);
  --border-color-error: var(--color-error-500);
  --border-color-success: var(--color-success-500);
  --border-color-warning: var(--color-warning-500);
  
  /* Inverse border colors for dark backgrounds */
  --border-color-inverse: var(--color-neutral-700);
  --border-color-inverse-strong: var(--color-neutral-600);
}

/* Dark mode border adjustments */
@media (prefers-color-scheme: dark) {
  :root {
    --border-color-default: var(--color-neutral-700);
    --border-color-strong: var(--color-neutral-600);
    --border-color-subtle: var(--color-neutral-800);
  }
}
```

---

## 7. Tokens de Componentes Base

Los tokens de componentes base definen los estilos fundamentales que otros componentes heredan, proporcionando una manera de mantener consistencia a través de diferentes variantes y estados.

### 7.1 Tokens de Botones

```css
:root {
  /* Button Base Tokens */
  --button-font-family: var(--font-family-ui);
  --button-font-weight: var(--font-weight-semibold);
  --button-border-radius: var(--radius-md);
  --button-transition-duration: 150ms;
  --button-transition-timing: ease-in-out;
  
  /* Button Padding */
  --button-padding-xs: var(--spacing-1) var(--spacing-2);
  --button-padding-sm: var(--spacing-1-5) var(--spacing-3);
  --button-padding-md: var(--spacing-2) var(--spacing-4);
  --button-padding-lg: var(--spacing-3) var(--spacing-6);
  --button-padding-xl: var(--spacing-4) var(--spacing-8);
  
  /* Button Sizes */
  --button-height-xs: 1.5rem;    /* 24px */
  --button-height-sm: 2rem;      /* 32px */
  --button-height-md: 2.5rem;    /* 40px */
  --button-height-lg: 3rem;      /* 48px */
  --button-height-xl: 3.5rem;    /* 56px */
  
  /* Button Icon Sizes */
  --button-icon-size-xs: 0.875rem;
  --button-icon-size-sm: 1rem;
  --button-icon-size-md: 1.25rem;
  --button-icon-size-lg: 1.5rem;
  --button-icon-size-xl: 1.75rem;
  
  /* Button Gap (icon to text) */
  --button-icon-gap-xs: var(--spacing-1);
  --button-icon-gap-sm: var(--spacing-1-5);
  --button-icon-gap-md: var(--spacing-2);
  --button-icon-gap-lg: var(--spacing-2-5);
  --button-icon-gap-xl: var(--spacing-3);
}
```

### 7.2 Tokens de Inputs

```css
:root {
  /* Input Base Tokens */
  --input-font-family: var(--font-family-form);
  --input-font-size: var(--font-size-base);
  --input-font-weight: var(--font-weight-normal);
  --input-border-radius: var(--radius-md);
  --input-border-width: var(--border-width-sm);
  --input-transition-duration: 150ms;
  
  /* Input Heights */
  --input-height-xs: 1.875rem;   /* 30px */
  --input-height-sm: 2rem;       /* 32px */
  --input-height-md: 2.5rem;     /* 40px */
  --input-height-lg: 3rem;       /* 48px */
  --input-height-xl: 3.5rem;     /* 56px */
  
  /* Input Padding */
  --input-padding-xs: var(--spacing-1) var(--spacing-2);
  --input-padding-sm: var(--spacing-1-5) var(--spacing-3);
  --input-padding-md: var(--spacing-2) var(--spacing-3-5);
  --input-padding-lg: var(--spacing-3) var(--spacing-4);
  --input-padding-xl: var(--spacing-4) var(--spacing-5);
  
  /* Input Colors */
  --input-background: var(--color-surface);
  --input-background-disabled: var(--color-neutral-100);
  --input-border-color: var(--border-color-default);
  --input-border-color-hover: var(--color-neutral-400);
  --input-border-color-focus: var(--color-primary-500);
  --input-border-color-error: var(--color-error-500);
  --input-border-color-success: var(--color-success-500);
  --input-text-color: var(--color-text-primary);
  --input-placeholder-color: var(--color-text-tertiary);
  --input-text-disabled: var(--color-text-tertiary);
}
```

### 7.3 Tokens de Cards

```css
:root {
  /* Card Base Tokens */
  --card-background: var(--color-surface);
  --card-border-radius: var(--radius-lg);
  --card-border-width: var(--border-width-sm);
  --card-border-color: var(--border-color-subtle);
  --card-shadow: var(--shadow-card);
  --card-shadow-hover: var(--shadow-card-hover);
  --card-transition-duration: 200ms;
  
  /* Card Padding */
  --card-padding-xs: var(--spacing-3);
  --card-padding-sm: var(--spacing-4);
  --card-padding-md: var(--spacing-5);
  --card-padding-lg: var(--spacing-6);
  --card-padding-xl: var(--spacing-8);
  
  /* Card Header/Footer */
  --card-header-border-width: var(--border-width-sm);
  --card-header-border-color: var(--border-color-subtle);
  --card-footer-border-width: var(--border-width-sm);
  --card-footer-border-color: var(--border-color-subtle);
}
```

---

## 8. Z-Index Scale

La escala de z-index establece el orden de apilamiento de los elementos en la interfaz, evitando conflictos y comportamientos inesperados.

```css
:root {
  /* Z-Index Scale */
  --z-index-base: 0;
  --z-index-dropdown: 1000;
  --z-index-sticky: 1100;
  --z-index-fixed: 1200;
  --z-index-modal-backdrop: 1300;
  --z-index-modal: 1400;
  --z-index-popover: 1500;
  --z-index-tooltip: 1600;
  --z-index-toast: 1700;
  --z-index-skip-link: 1800;
  
  /* Overlay levels */
  --z-index-overlay-light: 400;
  --z-index-overlay-medium: 500;
  --z-index-overlay-heavy: 600;
}
```

---

## 9. Iconografía

Los iconos en Spottruck comunican funcionalidad y estado de manera inmediata. El sistema de iconografía establece las bases para la selección, sizing y aplicación de iconos en toda la plataforma.

### 9.1 Principios de Iconografía

```css
:root {
  /* Icon Sizing */
  --icon-size-xs: 0.75rem;    /* 12px */
  --icon-size-sm: 0.875rem;   /* 14px */
  --icon-size-md: 1rem;       /* 16px */
  --icon-size-lg: 1.25rem;    /* 20px */
  --icon-size-xl: 1.5rem;     /* 24px */
  --icon-size-2xl: 2rem;      /* 32px */
  --icon-size-3xl: 2.5rem;    /* 40px */
  --icon-size-4xl: 3rem;      /* 48px */
  
  /* Icon Stroke Width */
  --icon-stroke-xs: 1.5px;
  --icon-stroke-sm: 1.5px;
  --icon-stroke-md: 2px;
  --icon-stroke-lg: 2px;
  --icon-stroke-xl: 2.5px;
  
  /* Icon Colors - inherit from parent by default */
  --icon-color-default: currentColor;
  --icon-color-muted: var(--color-text-tertiary);
  --icon-color-subtle: var(--color-text-secondary);
  --icon-color-primary: var(--color-primary-default);
  --icon-color-inverse: var(--color-text-inverse);
  
  /* Icon Spacing (gap from adjacent text) */
  --icon-spacing-xs: var(--spacing-1);
  --icon-spacing-sm: var(--spacing-1-5);
  --icon-spacing-md: var(--spacing-2);
  --icon-spacing-lg: var(--spacing-2-5);
}
```

### 9.2 Líneas de Guía para Iconos

- **Familia de iconos recomendada**: Lucide Icons (licencia MIT, consistente, moderna)
- **Alternativa**: Heroicons (outline para UI, solid para status)
- **Iconos de transporte**: Custom icons para tipos de vehículos (camión, acoplado, semirremolque)
- **Iconos monetarios**: Para precios y valores usar estilo numérico
- **Accesibilidad**: Todos los iconos interactivos deben tener `aria-label` o `aria-hidden` según corresponda

---

## 10. Animaciones y Transiciones

Las animaciones en Spottruck proporcionan feedback visual y guían la atención del usuario, mejorando la experiencia sin comprometer el rendimiento.

```css
:root {
  /* Transition Duration */
  --duration-instant: 50ms;
  --duration-fast: 100ms;
  --duration-normal: 150ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;
  --duration-slowest: 700ms;
  
  /* Transition Timing Functions */
  --ease-default: ease-in-out;
  --ease-in: ease-in;
  --ease-out: ease-out;
  --ease-in-out: ease-in-out;
  --ease-linear: linear;
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Common Transitions */
  --transition-colors: color var(--duration-fast) var(--ease-default),
                       background-color var(--duration-fast) var(--ease-default),
                       border-color var(--duration-fast) var(--ease-default);
  --transition-opacity: opacity var(--duration-normal) var(--ease-default);
  --transition-transform: transform var(--duration-normal) var(--ease-smooth);
  --transition-all: all var(--duration-normal) var(--ease-default);
  
  /* Transform Scale */
  --scale-hover: scale(1.02);
  --scale-active: scale(0.98);
  --scale-focus: scale(1.05);
}
```

---

## 11. Tokens de Theme para Plataformas Móviles

```css
/* iOS specific adjustments */
@supports (-webkit-touch-callout: none) {
  :root {
    --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --shadow-subtle: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    --button-border-radius: var(--radius-lg);
    --input-border-radius: var(--radius-lg);
  }
}

/* Safe area handling for notched devices */
.safe-area-inset-top {
  padding-top: env(safe-area-inset-top);
}
.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
.safe-area-inset-left {
  padding-left: env(safe-area-inset-left);
}
.safe-area-inset-right {
  padding-right: env(safe-area-inset-right);
}
```

---

## 12. Accesibilidad

El sistema de diseño de Spottruck prioriza la accesibilidad como característica fundamental, no como añadido.

### 12.1 Contraste de Color

```css
:root {
  /* Minimum contrast ratios (WCAG 2.1 AA) */
  /* Large text: minimum 3:1 ratio */
  /* Normal text: minimum 4.5:1 ratio */
  /* UI components: minimum 3:1 ratio */
  
  /* Focus indicators */
  --focus-ring-width: 3px;
  --focus-ring-color: rgba(30, 58, 95, 0.4);
  --focus-ring-offset: 2px;
  
  /* Touch targets - minimum 44x44px for mobile */
  --touch-target-min: 2.75rem;  /* 44px */
}
```

### 12.2 Estados de Foco y Accesibilidad

```css
:root {
  /* Focus visible styles */
  --focus-visible-outline-width: var(--border-width-lg);
  --focus-visible-outline-style: solid;
  --focus-visible-outline-color: var(--color-primary-500);
  --focus-visible-outline-offset: 2px;
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    :root {
      --border-width-default: var(--border-width-md);
      --shadow-subtle: none;
      --radius-sm: 0;
      --radius-md: 0;
      --radius-lg: 0;
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    :root {
      --duration-instant: 0ms;
      --duration-fast: 0ms;
      --duration-normal: 0ms;
      --duration-slow: 0ms;
      --duration-slower: 0ms;
      --duration-slowest: 0ms;
    }
  }
}
```

---

## 13. Convenciones de Uso y Nomenclatura

### 13.1 Estructura de Tokens CSS

```
--[category]-[variant]-[state]-[property]

category: color, font, spacing, shadow, radius, z
variant: primary, secondary, neutral, success, error, warning
state: default, hover, active, disabled, focus
property: default, light, dark, subtle, text, border, bg
```

**Ejemplos:**
- `--color-primary-default` — Color primario en estado default
- `--color-error-hover` — Color de error en hover
- `--font-size-lg` — Tamaño de fuente large
- `--shadow-card-hover` — Sombra de card en hover
- `--spacing-inline-md` — Espaciado inline mediano

### 13.2 Aplicación de Tokens

```css
/* Correcto: Usar tokens semánticos */
.button {
  background-color: var(--color-primary-default);
  color: var(--color-text-inverse);
  padding: var(--button-padding-md);
  border-radius: var(--button-border-radius);
  font-family: var(--button-font-family);
  font-weight: var(--button-font-weight);
  transition: var(--transition-colors);
}

/* Correcto: Usar tokens de escala para casos específicos */
.custom-element {
  padding: var(--spacing-6);
  font-size: var(--font-size-lg);
  border-radius: var(--radius-xl);
}

/* Incorrecto: Hardcoded values */
.button {
  background-color: #1E3A5F;
  padding: 8px 16px;
  border-radius: 8px;
}
```

---

## 14. Referencias y Recursos

- **Inter Font**: https://fonts.google.com/specimen/Inter
- **Roboto Mono**: https://fonts.google.com/specimen/Roboto+Mono
- **Lucide Icons**: https://lucide.dev/
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **CSS Custom Properties**: https://developer.mozilla.org/en-US/docs/Web/CSS/--*
- **Tailwind CSS (referencia de spacing)**: https://tailwindcss.com/docs/customizing-spacing

---

## 15. Changelog

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0.0 | 2026-06-04 | Versión inicial del Design System |

---

*Este documento es parte del Spottruck Design System y debe ser actualizado conforme evolucionen las necesidades del producto.*
