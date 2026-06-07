---
title: "01 - Esquema de Base de Datos"
description: "Esquema PostgreSQL completo del proyecto Spottruck con todas las tablas, columnas, tipos, constraints, defaults, índices y relaciones.
created: 2026-06-03
tags:
  - spottruck
  - postgresql
  - database
  - schema
  - data-model
area: Proyectos
project: Spottruck
module: "04_Data_Model"
---

# Spottruck — Esquema de Base de Datos PostgreSQL

## 1. Introducción y Visión General

Este documento describe el **esquema completo de la base de datos PostgreSQL** que sirve como capa de persistencia para la plataforma **Spottruck**, un sistema integral de gestión de flotas de vehículos pesados con capacidades de tracking GPS, subastas en tiempo real, ofertas comerciales, y orquestación de viajes. El diseño sigue un enfoque **relacional normalizado hasta la tercera forma normal (3NF)**, garantizando integridad referencial en todas las operaciones y optimizando el almacenamiento para consultas frecuentes en el contexto de logística y transporte de carga.

El motor de base de datos elegido es **PostgreSQL 15** o superior, aprovechando características avanzadas como tipos de datos nativos JSONB para metadata flexible, Row Level Security (RLS) para multi-tenancy, partial indexes para optimización de consultas frecuentes, logical replication para arquitecturas de alta disponibilidad, y generational columns mediante GENERATED ALWAYS AS IDENTITY para claves primarias auto-incrementales.

### 1.1 Objetivos del Diseño

El esquema está diseñado para satisfacer los siguientes objetivos arquitectónicos: primero, garantizar la **consistencia transaccional** mediante constraints a nivel de base de datos que validan reglas de negocio críticas, incluyendo validaciones de formato en identificadores tributarios, rangos válidos para coordenadas geográficas, y restricciones temporales que impiden fechas inválidas en registros de viajes. Segundo, optimizar el **rendimiento de consultas** mediante una estrategia de indexación híbrida que combina índices B-tree para búsquedas por igualdad, GIST para búsquedas geoespaciales, y partial indexes para escenarios frecuentes como vehículos activos o licencias próximas a vencer. Tercero, soportar la **escalabilidad horizontal** mediante sequences separadas para cada tabla, evitando cuellos de botella en la generación de IDs y permitiendo distribución futura del sistema.

### 1.2 Convenciones de Nomenclatura

La siguiente tabla establece las convenciones de nomenclatura que se aplican consistentemente en todo el esquema, facilitando la navegación y mantenimiento del código SQL:

| Elemento         | Convención                  | Ejemplo                          |
|------------------|-----------------------------|----------------------------------|
| Tablas           | snake_case, plural          | `vehicles`, `drivers`            |
| Columnas         | snake_case                  | `vehicle_id`, `created_at`       |
| FK               | `*_id` suffix               | `vehicle_id`, `driver_id`        |
| PK               | `id` (bigint, serial)       | `id BIGSERIAL PRIMARY KEY`       |
| Índices          | `idx_<tabla>_<columna>`     | `idx_vehicles_plate`             |
| Constraints      | `chk_<tabla>_<descripcion>` | `chk_vehicles_year_range`        |
| Sequences        | `seq_<tabla>_<columna>`     | `seq_vehicles_id`                |
| Enums            | `*_status`, `*_type` suffix | `vehicle_status`, `order_status`  |
| Timestamps       | `*_at` suffix               | `created_at`, `updated_at`       |

---

## 2. Extensiones y Tipos de Dominio (ENUM Types)

Antes de definir las tablas, se establecen tipos enumerados que encapsulan reglas de negocio fundamentales y evitan la proliferación de valores mágicos en constraints CHECK. Los ENUMs se crean en orden de dependencia para respetar las relaciones de referencía.

```sql
-- ============================================================
-- ENUM: Estados de vehículo
-- Describe el ciclo de vida completo de un vehículo en la flota
-- ============================================================
CREATE TYPE vehicle_status AS ENUM (
  'available',       -- Disponible para asignación
  'in_transit',      -- En viaje activo
  'maintenance',    -- En taller o mantenimiento programado
  'out_of_service', -- Fuera de servicio (temporal o definitivo)
  'reserved'        -- Reservado para un viaje específico
);

-- ============================================================
-- ENUM: Estados de orden de servicio
-- Controla el flujo de trabajo de creación a completación
-- ============================================================
CREATE TYPE order_status AS ENUM (
  'pending',       -- Creada, esperando asignación
  'assigned',      -- Asignada a un conductor y vehículo
  'in_progress',  -- Viaje iniciado
  'completed',    -- Entregada exitosamente
  'cancelled'     -- Cancelada por alguna parte
);

-- ============================================================
-- ENUM: Prioridades de orden
-- Permite区分 urgencia en la programación de servicios
-- ============================================================
CREATE TYPE order_priority AS ENUM (
  'low',           -- Prioridad baja, puede esperar
  'normal',        -- Prioridad estándar
  'high',          -- Prioridad alta, preferir asignación rápida
  'urgent'         -- Urgencia máxima, requiere acción inmediata
);

-- ============================================================
-- ENUM: Tipos de documento fiscal
-- Tipos de documentos contables emitidos
-- ============================================================
CREATE TYPE document_type AS ENUM (
  'invoice',       -- Factura principal
  'receipt',       -- Recibo de pago
  'credit_note',   -- Nota de crédito
  'debit_note'     -- Nota de débito
);

-- ============================================================
-- ENUM: Estados de pago
-- Seguimiento del ciclo de vida de un pago
-- ============================================================
CREATE TYPE payment_status AS ENUM (
  'pending',       -- Pago creado, esperando procesamiento
  'partial',       -- Pago parcial realizado
  'paid',          -- Pagado completamente
  'overdue',       -- Vencido, sin pago completo
  'refunded'       -- Reembolsado total o parcialmente
);

-- ============================================================
-- ENUM: Estados de subasta
-- Controla las fases de una subasta de viaje
-- ============================================================
CREATE TYPE auction_status AS ENUM (
  'draft',         -- Subasta creada pero no publicada
  'active',        -- Abierta para ofertas
  'closed',        -- Cerrada, esperando resolución
  'completed',     -- Finalizada con ganador seleccionado
  'cancelled'      -- Cancelada sin ganador
);

-- ============================================================
-- ENUM: Estados de oferta comercial
-- Ciclo de vida de una oferta en respuesta a un viaje
-- ============================================================
CREATE TYPE offer_status AS ENUM (
  'submitted',     -- Enviada por la empresa
  'under_review',  -- Siendo evaluada por el cliente
  'accepted',      -- Aceptada como oferta ganadora
  'rejected',      -- Rechazada por el cliente
  'withdrawn'      -- Retirada por la empresa antes de decisión
);

-- ============================================================
-- ENUM: Tipos de vehículo
-- Clasificación funcional de la flota
-- ============================================================
CREATE TYPE vehicle_type AS ENUM (
  'light_truck',   -- Camioneta ligera (2-3 toneladas)
  'medium_truck',  -- Camión mediano (5-8 toneladas)
  'heavy_truck',   -- Camión pesado (más de 8 toneladas)
  'trailer',       -- Trailer o semirremolque
  'flatbed',       -- Camión de plataforma
  'tanker',        -- Camión cisterna
  'van',           -- Van de reparto
  'bus'            -- Autobús
);

-- ============================================================
-- ENUM: Roles de usuario
-- Sistema de control de acceso basado en roles
-- ============================================================
CREATE TYPE user_role AS ENUM (
  'super_admin',   -- Administrador del sistema completo
  'company_admin', -- Administrador de empresa
  'branch_manager',-- Gerente de sucursal
  'dispatcher',    -- Despachador de operaciones
  'driver',        -- Conductor
  'customer',      -- Cliente externo
  'finance'        -- Personal de finanzas
);

-- ============================================================
-- ENUM: Estados de notificación
-- Seguimiento del estado de entrega de notificaciones
-- ============================================================
CREATE TYPE notification_status AS ENUM (
  'created',       -- Creada, en cola de envío
  'sent',          -- Enviada exitosamente
  'delivered',     -- Confirmada como entregada
  'read',          -- Leída por el destinatario
  'failed',        -- Falló el envío
  'cancelled'      -- Cancelada antes de envío
);
```

---

## 3. Tablas del Sistema — Definiciones Completas

### 3.1 `users` — Usuarios del Sistema

La tabla `users` representa la identidad de autenticación de todas las personas que acceden a la plataforma Spottruck. Cada usuario puede tener diferentes roles según su función, y la separación entre autenticación (users) y datos operativos (drivers, customers) permite un modelo de seguridad flexible con multi-tenancy a nivel de empresa.

| Columna           | Tipo                          | Constraints                          | Descripción                                    |
|-------------------|-------------------------------|--------------------------------------|------------------------------------------------|
| `id`              | `BIGSERIAL`                   | `PRIMARY KEY`                        | Identificador único de usuario                 |
| `company_id`      | `BIGINT`                      | `NOT NULL REFERENCES companies(id)`  | Empresa a la que pertenece el usuario         |
| `email`           | `VARCHAR(255)`                | `UNIQUE NOT NULL`                    | Correo electrónico (login principal)          |
| `password_hash`   | `VARCHAR(255)`                | `NOT NULL`                           | Hash bcrypt de la contraseña                   |
| `full_name`       | `VARCHAR(255)`                | `NOT NULL`                           | Nombre completo del usuario                    |
| `phone`           | `VARCHAR(30)`                 |                                      | Teléfono de contacto                           |
| `role`            | `user_role`                   | `NOT NULL DEFAULT 'customer'`        | Rol en el sistema                              |
| `avatar_url`      | `VARCHAR(500)`                |                                      | URL de fotografía de perfil                    |
| `language`        | `VARCHAR(10)`                 | `DEFAULT 'es'`                       | Idioma preferido (es, en, pt)                  |
| `timezone`        | `VARCHAR(50)`                 | `DEFAULT 'America/Mexico_City'`      | Zona horaria preferida                         |
| `last_login_at`   | `TIMESTAMPTZ`                 |                                      | Timestamp del último inicio de sesión           |
| `failed_login_attempts` | `SMALLINT`               | `DEFAULT 0`                          | Intentos de login fallidos consecutivos        |
| `locked_until`    | `TIMESTAMPTZ`                 |                                      | Bloqueo temporal de cuenta                     |
| `password_changed_at` | `TIMESTAMPTZ`             | `DEFAULT NOW()`                      | Fecha del último cambio de contraseña         |
| `requires_password_change` | `BOOLEAN`             | `DEFAULT FALSE`                      | Forzar cambio de contraseña en próximo login  |
| `is_email_verified` | `BOOLEAN`                   | `DEFAULT FALSE`                      | Verificación de correo electrónico             |
| `email_verification_token` | `VARCHAR(100)`        |                                      | Token para verificación de email                |
| `two_factor_enabled` | `BOOLEAN`                  | `DEFAULT FALSE`                      | Autenticación de dos factores habilitada       |
| `two_factor_secret` | `VARCHAR(255)`            |                                      | Secreto TOTP para 2FA                          |
| `is_active`       | `BOOLEAN`                    | `NOT NULL DEFAULT TRUE`              | Estado activo/inactivo de la cuenta           |
| `deactivated_at`  | `TIMESTAMPTZ`                 |                                      | Timestamp de desactivación                     |
| `deactivation_reason` | `VARCHAR(255)`            |                                      | Razón de desactivación                          |
| `metadata`        | `JSONB`                      | `DEFAULT '{}'`                       | Datos adicionales flexibles                    |
| `created_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de creación                          |
| `updated_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de última modificación               |

**Constraints de Validación:**
```sql
ALTER TABLE users ADD CONSTRAINT chk_users_email_format
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE users ADD CONSTRAINT chk_users_phone_format
  CHECK (phone IS NULL OR phone ~ '^[+]?[0-9]{7,20}$');
ALTER TABLE users ADD CONSTRAINT chk_users_failed_attempts_range
  CHECK (failed_login_attempts >= 0 AND failed_login_attempts <= 10);
```

**Índices:**
```sql
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE is_active = TRUE;
CREATE UNIQUE INDEX idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_users_last_login ON users(last_login_at DESC) WHERE last_login_at IS NOT NULL;
```

**Función de Actualización Automática:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

### 3.2 `companies` — Empresas o Corporaciones

La tabla `companies` es la entidad raíz de multi-tenancy en Spottruck. Cada empresa opera de forma independiente con su propia configuración fiscal, preferencias monetarias, y datos operativos. La relación jerárquica empresas → sucursales → operaciones permite modelar desde pequeñas flotas hasta grandes corporaciones multinacionales con múltiples subsidiarias.

| Columna           | Tipo                          | Constraints                          | Descripción                                    |
|-------------------|-------------------------------|--------------------------------------|------------------------------------------------|
| `id`              | `BIGSERIAL`                   | `PRIMARY KEY`                        | Identificador único de empresa                 |
| `name`            | `VARCHAR(255)`                | `NOT NULL`                           | Razón social o nombre comercial                |
| `slug`            | `VARCHAR(100)`                | `UNIQUE NOT NULL`                    | Slug URL-friendly para la empresa              |
| `tax_id`          | `VARCHAR(50)`                 | `UNIQUE NOT NULL`                    | Identificación tributaria (RUC/CUIT/NIT)      |
| `registration_number` | `VARCHAR(50)`             |                                      | Número de registro mercantil                   |
| `legal_representative` | `VARCHAR(255)`           |                                      | Nombre del representante legal                 |
| `address`         | `TEXT`                        |                                      | Dirección fiscal completa                      |
| `city`            | `VARCHAR(100)`                |                                      | Ciudad                                         |
| `state`           | `VARCHAR(100)`                |                                      | Estado o provincia                             |
| `postal_code`     | `VARCHAR(20)`                 |                                      | Código postal                                  |
| `country`         | `VARCHAR(100)`                | `NOT NULL DEFAULT 'México'`          | País de operación                              |
| `phone`           | `VARCHAR(30)`                 |                                      | Teléfono principal de contacto                 |
| `email`           | `VARCHAR(255)`                |                                      | Correo electrónico principal                   |
| `website`         | `VARCHAR(255)`                |                                      | Sitio web corporativo                          |
| `logo_url`        | `VARCHAR(500)`                |                                      | URL del logotipo corporativo                   |
| `currency`        | `CHAR(3)`                     | `NOT NULL DEFAULT 'MXN'`             | Código de moneda ISO 4217                      |
| `timezone`        | `VARCHAR(50)`                 | `NOT NULL DEFAULT 'America/Mexico_City'` | Zona horaria principal                       |
| `fiscal_year_start_month` | `SMALLINT`           | `DEFAULT 1`                          | Mes de inicio del año fiscal (1-12)           |
| `tax_regime`     | `VARCHAR(50)`                 |                                      | Régimen fiscal (general, simplificado, etc.)  |
| `iva_rate`        | `DECIMAL(4,3)`                | `DEFAULT 0.160`                      | Tasa de IVA/impuesto al valor                 |
| `default_payment_terms` | `VARCHAR(50)`          | `DEFAULT 'net_30'`                   | Términos de pago por defecto                   |
| `max_fleet_size`  | `INTEGER`                     |                                      | Límite de tamaño de flota (licencia)           |
| `fleet_count`     | `INTEGER`                     | `DEFAULT 0`                          | Conteo actual de vehículos en la flota         |
| `metadata`        | `JSONB`                       | `DEFAULT '{}'`                       | Datos adicionales flexibles                   |
| `is_active`       | `BOOLEAN`                     | `NOT NULL DEFAULT TRUE`              | Estado activo/inactivo                        |
| `activated_at`    | `TIMESTAMPTZ`                 |                                      | Timestamp de activación                        |
| `deactivated_at`  | `TIMESTAMPTZ`                 |                                      | Timestamp de desactivación                      |
| `created_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de creación                          |
| `updated_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de última modificación               |

**Constraints de Validación:**
```sql
ALTER TABLE companies ADD CONSTRAINT chk_companies_tax_id_format
  CHECK (tax_id ~ '^[A-Z0-9]{8,20}$');
ALTER TABLE companies ADD CONSTRAINT chk_companies_currency_iso
  CHECK (currency ~ '^[A-Z]{3}$');
ALTER TABLE companies ADD CONSTRAINT chk_companies_slug_format
  CHECK (slug ~ '^[a-z0-9-]{3,100}$');
ALTER TABLE companies ADD CONSTRAINT chk_companies_iva_rate
  CHECK (iva_rate >= 0 AND iva_rate <= 1);
ALTER TABLE companies ADD CONSTRAINT chk_companies_fiscal_year_month
  CHECK (fiscal_year_start_month BETWEEN 1 AND 12);
```

**Índices:**
```sql
CREATE UNIQUE INDEX idx_companies_tax_id ON companies(tax_id);
CREATE UNIQUE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_country ON companies(country);
CREATE INDEX idx_companies_active ON companies(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_companies_fleet_count ON companies(fleet_count);
```

---

### 3.3 `drivers` — Conductores

La tabla `drivers` almacena la información profesional y operativa de los conductores de la flota. La separación entre `users` (autenticación) y `drivers` (datos operativos) permite que un mismo usuario tenga múltiples roles o que el perfil operativo sea actualizado sin afectar las credenciales de acceso. Los conductores están vinculados a una empresa, pero también tienen una relación muchos-a-uno con usuarios para el sistema de autenticación.

| Columna           | Tipo                          | Constraints                          | Descripción                                    |
|-------------------|-------------------------------|--------------------------------------|------------------------------------------------|
| `id`              | `BIGSERIAL`                   | `PRIMARY KEY`                        | Identificador único de conductor               |
| `user_id`         | `BIGINT`                      | `UNIQUE REFERENCES users(id)`        | Usuario de autenticación asociado              |
| `company_id`      | `BIGINT`                      | `NOT NULL REFERENCES companies(id)`   | Empresa empleadora                             |
| `employee_number` | `VARCHAR(50)`                 | `UNIQUE NOT NULL`                    | Número de empleado interno                     |
| `first_name`      | `VARCHAR(100)`                | `NOT NULL`                           | Nombre                                         |
| `middle_name`     | `VARCHAR(100)`                |                                      | Segundo nombre                                 |
| `last_name`      | `VARCHAR(100)`                | `NOT NULL`                           | Apellido paterno                               |
| `second_last_name` | `VARCHAR(100)`               |                                      | Apellido materno                               |
| `date_of_birth`   | `DATE`                        |                                      | Fecha de nacimiento                            |
| `gender`          | `VARCHAR(20)`                 |                                      | Género                                         |
| `curp`            | `VARCHAR(18)`                 |                                      | CURP mexicana (para conductores nacionales)    |
| `rfc`             | `VARCHAR(13)`                 |                                      | RFC mexicano (identificación fiscal)           |
| `license_number`  | `VARCHAR(50)`                 | `NOT NULL`                           | Número de licencia de conducir                 |
| `license_class`   | `VARCHAR(10)`                 | `NOT NULL`                           | Clase: A (particular), B (comercial ligero), C (comercial pesado), D (autobús), E (articulado) |
| `license_expiry`  | `DATE`                        | `NOT NULL`                           | Fecha de vencimiento de licencia               |
| `license_state`   | `VARCHAR(100)`                |                                      | Estado/emisor de la licencia                   |
| `license_document_url` | `VARCHAR(500)`            |                                      | URL del documento escaneado de licencia        |
| `hire_date`       | `DATE`                        | `NOT NULL`                           | Fecha de contratación                         |
| `termination_date` | `DATE`                        |                                      | Fecha de finalización de relación laboral      |
| `department`      | `VARCHAR(100)`                |                                      | Departamento o área asignada                   |
| `position`        | `VARCHAR(100)`                |                                      | Puesto o cargo específico                      |
| `status`          | `VARCHAR(30)`                 | `NOT NULL DEFAULT 'active'`          | Estado: active, on_leave, suspended, terminated |
| `employment_type` | `VARCHAR(30)`                 | `DEFAULT 'full_time'`                | Tipo: full_time, part_time, contract         |
| `emergency_contact_name` | `VARCHAR(255)`        |                                      | Nombre de contacto de emergencia              |
| `emergency_contact_phone` | `VARCHAR(30)`          |                                      | Teléfono de emergencia                        |
| `emergency_contact_relationship` | `VARCHAR(50)`     |                                      | Parentesco del contacto de emergencia          |
| `blood_type`      | `VARCHAR(5)`                  |                                      | Tipo de sangre (A+, A-, B+, B-, AB+, AB-, O+, O-) |
| `allergies`       | `TEXT`                        |                                      | Alergias conocidas                             |
| `medical_conditions` | `TEXT`                     |                                      | Condiciones médicas relevantes                |
| `medical_card_expiry` | `DATE`                    |                                      | Vencimiento de tarjeta médica oficial         |
| `photo_url`       | `VARCHAR(500)`                |                                      | URL de fotografía del conductor                |
| `address`         | `TEXT`                        |                                      | Dirección de residencia                       |
| `city`            | `VARCHAR(100)`                |                                      | Ciudad de residencia                           |
| `state`           | `VARCHAR(100)`                |                                      | Estado de residencia                           |
| `postal_code`     | `VARCHAR(20)`                 |                                      | Código postal de residencia                    |
| `base_branch_id`  | `BIGINT`                      | `REFERENCES branches(id)`            | Sucursal base para asignaciones                |
| `shift_preference`| `VARCHAR(20)`                 |                                      | Preferencia: day, night, rotating, any        |
| `home_terminal`   | `VARCHAR(255)`                |                                      | Terminal o ciudad base para dispatch          |
| `salary`          | `DECIMAL(10,2)`               |                                      | Salario base mensual                           |
| `hourly_rate`     | `DECIMAL(8,2)`                |                                      | Tarifa por hora (para tiempo extra)           |
| `rating`          | `DECIMAL(3,2)`                | `DEFAULT 5.00`                       | Calificación promedio (1.00-5.00)             |
| `total_trips`     | `INTEGER`                     | `DEFAULT 0`                          | Total de viajes completados                   |
| `total_distance_km` | `DECIMAL(12,2)`              | `DEFAULT 0`                          | Distancia total recorrida (km)                |
| `total_accidents` | `INTEGER`                     | `DEFAULT 0`                          | Número de accidentes reportados               |
| `safety_violations` | `INTEGER`                   | `DEFAULT 0`                          | Infracciones de seguridad registradas          |
| `last_medical_exam` | `DATE`                      |                                      | Fecha del último examen médico                |
| `next_medical_exam` | `DATE`                     |                                      | Fecha del próximo examen médico               |
| `training_completed` | `BOOLEAN`                  | `DEFAULT FALSE`                      | Capacitación completa de seguridad            |
| `training_expiry` | `DATE`                       |                                      | Vencimiento de certificación de entrenamiento |
| `metadata`        | `JSONB`                       | `DEFAULT '{}'`                       | Datos adicionales flexibles                    |
| `is_active`       | `BOOLEAN`                     | `NOT NULL DEFAULT TRUE`              | Estado activo                                 |
| `created_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de creación                          |
| `updated_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de última modificación               |

**Constraints de Validación:**
```sql
ALTER TABLE drivers ADD CONSTRAINT chk_drivers_license_class
  CHECK (license_class IN ('A', 'B', 'C', 'D', 'E'));
ALTER TABLE drivers ADD CONSTRAINT chk_drivers_rating_range
  CHECK (rating BETWEEN 1.00 AND 5.00);
ALTER TABLE drivers ADD CONSTRAINT chk_drivers_hire_date_past
  CHECK (hire_date <= CURRENT_DATE);
ALTER TABLE drivers ADD CONSTRAINT chk_drivers_license_expiry_future
  CHECK (license_expiry > CURRENT_DATE);
ALTER TABLE drivers ADD CONSTRAINT chk_drivers_curp_format
  CHECK (curp IS NULL OR LENGTH(curp) = 18);
ALTER TABLE drivers ADD CONSTRAINT chk_drivers_rfc_format
  CHECK (rfc IS NULL OR LENGTH(rfc) = 12 OR LENGTH(rfc) = 13);
ALTER TABLE drivers ADD CONSTRAINT chk_drivers_blood_type
  CHECK (blood_type IS NULL OR blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));
```

**Índices:**
```sql
CREATE UNIQUE INDEX idx_drivers_employee_number ON drivers(employee_number);
CREATE UNIQUE INDEX idx_drivers_user_id ON drivers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_drivers_company ON drivers(company_id);
CREATE INDEX idx_drivers_license_expiry ON drivers(license_expiry) WHERE status = 'active';
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_license_class ON drivers(license_class);
CREATE INDEX idx_drivers_rating ON drivers(rating DESC);
CREATE INDEX idx_drivers_base_branch ON drivers(base_branch_id) WHERE base_branch_id IS NOT NULL;
CREATE INDEX idx_drivers_next_medical ON drivers(next_medical_exam) 
  WHERE next_medical_exam IS NOT NULL AND next_medical_exam < CURRENT_DATE + INTERVAL '30 days';
CREATE INDEX idx_drivers_active_company ON drivers(company_id, is_active) WHERE is_active = TRUE;
```

---

### 3.4 `vehicles` — Vehículos de la Flota

La tabla `vehicles` es el núcleo de la gestión de activos de transporte. Cada vehículo tiene un ciclo de vida completo desde la adquisición hasta la baja, con seguimiento de mantenimiento preventivo, costos operativos, y capacidad de carga. La relación con companies establece el ownership, mientras que las relaciones opcionales con branches y drivers permiten tracking de ubicación actual y asignación.

| Columna           | Tipo                          | Constraints                          | Descripción                                    |
|-------------------|-------------------------------|--------------------------------------|------------------------------------------------|
| `id`              | `BIGSERIAL`                   | `PRIMARY KEY`                        | Identificador único de vehículo                |
| `company_id`      | `BIGINT`                      | `NOT NULL REFERENCES companies(id)`   | Empresa propietaria                            |
| `branch_id`       | `BIGINT`                      | `REFERENCES branches(id)`            | Sucursal asignada actualmente                  |
| `vin`             | `VARCHAR(17)`                 | `UNIQUE NOT NULL`                    | Vehicle Identification Number (17 caracteres)  |
| `license_plate`   | `VARCHAR(20)`                 | `NOT NULL`                           | Matrícula o placa de circulación              |
| `vehicle_type`    | `vehicle_type`                | `NOT NULL`                           | Tipo de vehículo (light_truck, heavy_truck, etc.) |
| `make`            | `VARCHAR(100)`                | `NOT NULL`                           | Marca o fabricante (Kenworth, Volvo, Freightliner) |
| `model`           | `VARCHAR(100)`                | `NOT NULL`                           | Modelo específico                              |
| `year`            | `SMALLINT`                    | `NOT NULL`                           | Año de fabricación                             |
| `model_year`      | `SMALLINT`                    |                                      | Año del modelo (puede diferir del year)       |
| `color`           | `VARCHAR(50)`                 |                                      | Color del vehículo                             |
| `body_style`      | `VARCHAR(50)`                 |                                      | Estilo de carrocería                           |
| `fuel_type`       | `VARCHAR(30)`                 | `NOT NULL DEFAULT 'diesel'`          | Tipo: diesel, gasoline, natural_gas, electric, hybrid |
| `transmission`    | `VARCHAR(30)`                 | `NOT NULL DEFAULT 'manual'`          | Transmisión: manual, automatic, automated_manual |
| `drive_configuration` | `VARCHAR(20)`             | `DEFAULT '6x4'`                      | Configuración de tracción (4x2, 6x4, 8x4)     |
| `axles`           | `SMALLINT`                    | `NOT NULL DEFAULT 2`                 | Número de ejes                                 |
| `wheelbase_cm`    | `INTEGER`                     |                                      | Distancia entre ejes (cm)                      |
| `length_cm`       | `INTEGER`                     |                                      | Longitud total (cm)                            |
| `width_cm`        | `INTEGER`                     |                                      | Ancho total (cm)                               |
| `height_cm`       | `INTEGER`                     |                                      | Altura total (cm)                              |
| `gross_weight_kg` | `DECIMAL(10,2)`               |                                      | Peso bruto vehicular (kg)                      |
| `curb_weight_kg`  | `DECIMAL(10,2)`               |                                      | Peso en vacío (kg)                             |
| `load_capacity_kg`| `DECIMAL(10,2)`               |                                      | Capacidad de carga útil (kg)                  |
| `volume_capacity_m3` | `DECIMAL(10,2)`             |                                      | Capacidad volumétrica (m³)                     |
| `tire_count`      | `SMALLINT`                    | `NOT NULL DEFAULT 10`                | Cantidad de neumáticos                         |
| `tire_size`       | `VARCHAR(20)`                 |                                      | Medida de neumáticos                            |
| `tire_pressure_psi` | `DECIMAL(5,2)`              |                                      | Presión recomendada (PSI)                      |
| `fuel_capacity_l` | `DECIMAL(6,2)`                |                                      | Capacidad del tanque de combustible (litros)   |
| `fuel_efficiency_l_100km` | `DECIMAL(6,2)`        |                                      | Eficiencia promedio (L/100km)                 |
| `status`          | `vehicle_status`              | `NOT NULL DEFAULT 'available'`       | Estado actual del vehículo                     |
| `previous_status` | `vehicle_status`              |                                      | Estado anterior (para historial)              |
| `status_changed_at` | `TIMESTAMPTZ`                |                                      | Timestamp del último cambio de estado          |
| `status_reason`   | `VARCHAR(255)`                |                                      | Razón o nota del cambio de estado              |
| `acquisition_date`| `DATE`                        |                                      | Fecha de adquisición                           |
| `acquisition_cost`| `DECIMAL(12,2)`               |                                      | Costo de adquisición                           |
| `depreciation_method` | `VARCHAR(30)`              |                                      | Método de depreciación contable               |
| `useful_life_years` | `SMALLINT`                  |                                      | Vida útil estimada en años                     |
| `salvage_value`   | `DECIMAL(12,2)`               |                                      | Valor residual al final de vida útil           |
| `current_km`      | `BIGINT`                      | `DEFAULT 0`                          | Kilometraje actual                             |
| `last_service_km` | `BIGINT`                      | `DEFAULT 0`                          | Kilometraje al último servicio                |
| `next_service_km` | `BIGINT`                     |                                      | Próximo servicio programado                   |
| `last_service_date` | `DATE`                      |                                      | Fecha del último servicio                     |
| `next_service_date` | `DATE`                      |                                      | Fecha del próximo servicio                    |
| `average_fuel_consumption_l_100km` | `DECIMAL(6,2)`  |                                      | Consumo promedio calculado                    |
| `insurance_policy` | `VARCHAR(100)`                |                                      | Número de póliza de seguro                    |
| `insurance_provider` | `VARCHAR(100)`              |                                      | Aseguradora                                    |
| `insurance_expiry`| `DATE`                        |                                      | Vencimiento del seguro                         |
| `insurance_document_url` | `VARCHAR(500)`          |                                      | URL del documento de seguro                   |
| `annual_inspection_expiry` | `DATE`                |                                      | Vencimiento de inspección anual               |
| `emissions_cert_expiry` | `DATE`                 |                                      | Vencimiento de certificado de emisiones        |
| `license_plate_expiry` | `DATE`                 |                                      | Vencimiento de placa                          |
| `image_url`       | `VARCHAR(500)`                |                                      | URL de fotografía principal                    |
| `images`          | `JSONB`                       | `DEFAULT '[]'`                       | Array de URLs de fotografías                   |
| `documents`       | `JSONB`                       | `DEFAULT '[]'`                       | Documentos asociados (manuales, certificados) |
| `metadata`        | `JSONB`                       | `DEFAULT '{}'`                       | Datos adicionales flexibles                    |
| `is_active`       | `BOOLEAN`                     | `NOT NULL DEFAULT TRUE`              | Estado activo                                 |
| `created_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de creación                          |
| `updated_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de última modificación               |

**Constraints de Validación:**
```sql
ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_vin_length
  CHECK (LENGTH(vin) = 17);
ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_vin_format
  CHECK (vin ~ '^[A-HJ-NPR-Z0-9]{17}$');
ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_year_range
  CHECK (year BETWEEN 1980 AND EXTRACT(YEAR FROM CURRENT_DATE) + 1);
ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_gross_weight_positive
  CHECK (gross_weight_kg IS NULL OR gross_weight_kg > 0);
ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_load_capacity_positive
  CHECK (load_capacity_kg IS NULL OR load_capacity_kg > 0);
ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_acquisition_date_past
  CHECK (acquisition_date IS NULL OR acquisition_date <= CURRENT_DATE);
ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_axles_range
  CHECK (axles BETWEEN 2 AND 10);
ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_tire_count
  CHECK (tire_count >= 4 AND tire_count <= 24);
ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_fuel_efficiency_positive
  CHECK (fuel_efficiency_l_100km IS NULL OR fuel_efficiency_l_100km > 0);
```

**Índices:**
```sql
CREATE UNIQUE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE UNIQUE INDEX idx_vehicles_license_plate ON vehicles(company_id, license_plate);
CREATE INDEX idx_vehicles_company ON vehicles(company_id);
CREATE INDEX idx_vehicles_branch ON vehicles(branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_year_make_model ON vehicles(year, make, model);
CREATE INDEX idx_vehicles_next_service ON vehicles(next_service_km) 
  WHERE next_service_km IS NOT NULL;
CREATE INDEX idx_vehicles_insurance_expiry ON vehicles(insurance_expiry) 
  WHERE insurance_expiry IS NOT NULL AND insurance_expiry < CURRENT_DATE + INTERVAL '30 days';
CREATE INDEX idx_vehicles_license_expiry ON vehicles(license_plate_expiry) 
  WHERE license_plate_expiry IS NOT NULL;
CREATE INDEX idx_vehicles_status_company ON vehicles(company_id, status) 
  WHERE is_active = TRUE;
```

---

### 3.5 `trips` — Viajes o Recorridos

La tabla `trips` representa la unidad fundamental de operación logística. Cada viaje encapsula la planificación y ejecución de un recorrido desde un origen hasta un destino, involucrando un vehículo, conductor(es), y potencialmente una orden de servicio asociada. Los campos de tracking geoespacial permiten monitoreo en tiempo real, mientras que los campos de costos y combustible facilitan el control operativo y financiero.

| Columna           | Tipo                          | Constraints                          | Descripción                                    |
|-------------------|-------------------------------|--------------------------------------|------------------------------------------------|
| `id`              | `BIGSERIAL`                   | `PRIMARY KEY`                        | Identificador único de viaje                   |
| `company_id`      | `BIGINT`                      | `NOT NULL REFERENCES companies(id)`   | Empresa                                        |
| `vehicle_id`      | `BIGINT`                      | `NOT NULL REFERENCES vehicles(id)`   | Vehículo asignado                             |
| `driver_id`       | `BIGINT`                      | `NOT NULL REFERENCES drivers(id)`    | Conductor principal                            |
| `co_driver_id`    | `BIGINT`                      | `REFERENCES drivers(id)`             | Copiloto (si aplica)                          |
| `order_id`        | `BIGINT`                      | `REFERENCES orders(id)`             | Orden de servicio asociada                     |
| `trip_number`     | `VARCHAR(50)`                 | `UNIQUE NOT NULL`                    | Número de viaje legible (ej: TRP-2026-000123) |
| `trip_type`       | `VARCHAR(30)`                 | `NOT NULL DEFAULT 'delivery'`        | Tipo: delivery, pickup, transfer, service, reposition |
| `status`          | `VARCHAR(30)`                 | `NOT NULL DEFAULT 'scheduled'`       | Estado: scheduled, en_route_to_origin, at_origin, loaded, en_route_to_dest, at_dest, unloading, completed, cancelled, aborted |
| `priority`        | `order_priority`              | `NOT NULL DEFAULT 'normal'`          | Prioridad del viaje                           |
| `origin_branch_id`| `BIGINT`                      | `REFERENCES branches(id)`            | Sucursal de origen                            |
| `destination_branch_id` | `BIGINT`                | `REFERENCES branches(id)`            | Sucursal de destino                           |
| `origin_address`  | `TEXT`                        | `NOT NULL`                           | Dirección de origen libre                     |
| `origin_city`     | `VARCHAR(100)`                | `NOT NULL`                           | Ciudad de origen                              |
| `origin_state`    | `VARCHAR(100)`                |                                      | Estado de origen                              |
| `origin_country`  | `VARCHAR(100)`                | `NOT NULL`                           | País de origen                                |
| `origin_postal_code` | `VARCHAR(20)`               |                                      | Código postal de origen                       |
| `origin_lat`      | `DECIMAL(10,8)`               |                                      | Latitud de origen                             |
| `origin_lng`      | `DECIMAL(11,8)`               |                                      | Longitud de origen                           |
| `destination_address` | `TEXT`                    | `NOT NULL`                           | Dirección de destino libre                   |
| `destination_city`| `VARCHAR(100)`                | `NOT NULL`                           | Ciudad de destino                             |
| `destination_state` | `VARCHAR(100)`              |                                      | Estado de destino                             |
| `destination_country` | `VARCHAR(100)`            | `NOT NULL`                           | País de destino                               |
| `destination_postal_code` | `VARCHAR(20)`           |                                      | Código postal de destino                     |
| `dest_lat`        | `DECIMAL(10,8)`               |                                      | Latitud de destino                            |
| `dest_lng`        | `DECIMAL(11,8)`               |                                      | Longitud de destino                           |
| `waypoints`       | `JSONB`                       | `DEFAULT '[]'`                       | Puntos intermedios [{lat, lng, name, arrival, departure}] |
| `scheduled_start` | `TIMESTAMPTZ`                 | `NOT NULL`                           | Fecha/hora programada de inicio              |
| `scheduled_end`   | `TIMESTAMPTZ`                 | `NOT NULL`                           | Fecha/hora programada de fin                  |
| `actual_start`    | `TIMESTAMPTZ`                 |                                      | Timestamp real de inicio                      |
| `actual_end`      | `TIMESTAMPTZ`                 |                                      | Timestamp real de fin                         |
| `start_odometer_km` | `BIGINT`                    |                                      | Odómetro al inicio del viaje (km)            |
| `end_odometer_km`   | `BIGINT`                    |                                      | Odómetro al fin del viaje (km)                |
| `planned_distance_km` | `DECIMAL(10,2)`            |                                      | Distancia planeada (km)                       |
| `actual_distance_km` | `DECIMAL(10,2)`            |                                      | Distancia real recorrida (km)                |
| `planned_duration_min` | `INTEGER`                |                                      | Duración planeada (minutos)                  |
| `actual_duration_min`  | `INTEGER`                |                                      | Duración real (minutos)                      |
| `cargo_description` | `TEXT`                      |                                      | Descripción de la carga                       |
| `cargo_type`      | `VARCHAR(100)`                |                                      | Tipo de mercancía                            |
| `cargo_weight_kg` | `DECIMAL(10,2)`               |                                      | Peso de la carga (kg)                        |
| `cargo_volume_m3` | `DECIMAL(10,2)`               |                                      | Volumen de la carga (m³)                     |
| `cargo_unit_count` | `INTEGER`                    |                                      | Número de unidades/paquetes                  |
| `refrigeration_required` | `BOOLEAN`              | `DEFAULT FALSE`                      | Requiere refrigeración                        |
| `min_temperature_c` | `DECIMAL(5,2)`              |                                      | Temperatura mínima requerida (°C)            |
| `max_temperature_c` | `DECIMAL(5,2)`              |                                      | Temperatura máxima requerida (°C)            |
| `hazardous_cargo` | `BOOLEAN`                    | `DEFAULT FALSE`                      | Mercancía peligrosa                           |
| `hazardous_class`  | `VARCHAR(20)`                 |                                      | Clase de peligro (ver DOT classification)     |
| `fuel_consumed_l` | `DECIMAL(8,2)`                |                                      | Combustible consumido (litros)               |
| `fuel_cost`       | `DECIMAL(10,2)`               |                                      | Costo de combustible                          |
| `average_speed_kmh` | `DECIMAL(5,2)`              |                                      | Velocidad promedio (km/h)                    |
| `max_speed_kmh`    | `DECIMAL(5,2)`                |                                      | Velocidad máxima alcanzada (km/h)            |
| `start_fuel_level` | `DECIMAL(5,2)`              |                                      | Nivel de combustible al inicio (%)           |
| `end_fuel_level`  | `DECIMAL(5,2)`                |                                      | Nivel de combustible al fin (%)              |
| `fuel_added_l`    | `DECIMAL(8,2)`                |                                      | Combustible añadido durante el viaje (L)    |
| `tolls_cost`      | `DECIMAL(10,2)`               | `DEFAULT 0`                          | Costo total de peajes                         |
| `parking_cost`    | `DECIMAL(10,2)`               | `DEFAULT 0`                          | Costo total de estacionamiento               |
| `other_costs`     | `DECIMAL(10,2)`               | `DEFAULT 0`                          | Otros costos asociados al viaje              |
| `total_trip_cost` | `DECIMAL(12,2)`               |                                      | Costo total del viaje (combustible+peajes+otros) |
| `invoiced_amount` | `DECIMAL(12,2)`               |                                      | Monto facturado al cliente                   |
| `profit_margin`   | `DECIMAL(10,2)`               |                                      | Margen de ganancia del viaje                 |
| `driver_payment_amount` | `DECIMAL(10,2)`          |                                      | Pago al conductor por este viaje             |
| `notes`           | `TEXT`                        |                                      | Notas u observaciones del dispatcher          |
| `customer_notes`  | `TEXT`                        |                                      | Notas visibles al cliente                     |
| `internal_comments` | `TEXT`                     |                                      | Comentarios internos de operaciones          |
| `rating`          | `DECIMAL(3,2)`                |                                      | Calificación del viaje (1-5)                  |
| `customer_feedback` | `TEXT`                      |                                      | Retroalimentación del cliente                |
| `driver_rating`   | `DECIMAL(3,2)`                |                                      | Calificación del conductor sobre el viaje     |
| `on_time_performance` | `BOOLEAN`                |                                      | ¿El viaje llegó a tiempo?                    |
| `delay_minutes`   | `INTEGER`                     |                                      | Minutos de retraso respecto a lo programado  |
| `delay_reason`    | `VARCHAR(255)`                |                                      | Causa del retraso                             |
| `loading_start`   | `TIMESTAMPTZ`                 |                                      | Timestamp inicio de carga                     |
| `loading_end`     | `TIMESTAMPTZ`                 |                                      | Timestamp fin de carga                        |
| `unloading_start` | `TIMESTAMPTZ`                 |                                      | Timestamp inicio de descarga                  |
| `unloading_end`   | `TIMESTAMPTZ`                 |                                      | Timestamp fin de descarga                     |
| `proof_of_delivery_url` | `VARCHAR(500)`         |                                      | URL del comprobante de entrega firmado        |
| `signed_receiver_name` | `VARCHAR(255)`         |                                      | Nombre de quien recibió                      |
| `signed_at`       | `TIMESTAMPTZ`                 |                                      | Timestamp de la firma/recepción               |
| `metadata`        | `JSONB`                       | `DEFAULT '{}'`                       | Datos adicionales flexibles                   |
| `created_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de creación                          |
| `updated_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de última modificación               |

**Constraints de Validación:**
```sql
ALTER TABLE trips ADD CONSTRAINT chk_trips_scheduled_dates
  CHECK (scheduled_start < scheduled_end);
ALTER TABLE trips ADD CONSTRAINT chk_trips_actual_dates
  CHECK (actual_start IS NULL OR actual_end IS NULL OR actual_start < actual_end);
ALTER TABLE trips ADD CONSTRAINT chk_trips_cargo_weight_positive
  CHECK (cargo_weight_kg IS NULL OR cargo_weight_kg > 0);
ALTER TABLE trips ADD CONSTRAINT chk_trips_fuel_levels
  CHECK (start_fuel_level IS NULL OR (start_fuel_level >= 0 AND start_fuel_level <= 100));
ALTER TABLE trips ADD CONSTRAINT chk_trips_end_fuel_level
  CHECK (end_fuel_level IS NULL OR (end_fuel_level >= 0 AND end_fuel_level <= 100));
ALTER TABLE trips ADD CONSTRAINT chk_trips_temperature_range
  CHECK (min_temperature_c IS NULL OR max_temperature_c IS NULL OR min_temperature_c <= max_temperature_c);
ALTER TABLE trips ADD CONSTRAINT chk_trips_distance_positive
  CHECK (actual_distance_km IS NULL OR actual_distance_km >= 0);
ALTER TABLE trips ADD CONSTRAINT chk_trips_delay_positive
  CHECK (delay_minutes IS NULL OR delay_minutes >= 0);
```

**Índices:**
```sql
CREATE UNIQUE INDEX idx_trips_trip_number ON trips(trip_number);
CREATE INDEX idx_trips_company ON trips(company_id);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_co_driver ON trips(co_driver_id) WHERE co_driver_id IS NOT NULL;
CREATE INDEX idx_trips_order ON trips(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_priority ON trips(priority);
CREATE INDEX idx_trips_type ON trips(trip_type);
CREATE INDEX idx_trips_scheduled_start ON trips(scheduled_start);
CREATE INDEX idx_trips_actual_start ON trips(actual_start DESC) WHERE actual_start IS NOT NULL;
CREATE INDEX idx_trips_actual_end ON trips(actual_end DESC) WHERE actual_end IS NOT NULL;
CREATE INDEX idx_trips_origin_city ON trips(origin_city);
CREATE INDEX idx_trips_destination_city ON trips(destination_city);
CREATE INDEX idx_trips_scheduled_period ON trips(scheduled_start, scheduled_end) 
  WHERE status IN ('scheduled', 'en_route_to_origin');
CREATE INDEX idx_trips_active_driver ON trips(driver_id, status) 
  WHERE status NOT IN ('completed', 'cancelled');
CREATE INDEX idx_trips_vehicle_active ON trips(vehicle_id, status) 
  WHERE status NOT IN ('completed', 'cancelled');
CREATE INDEX idx_trips_delayed ON trips(delay_minutes) 
  WHERE delay_minutes > 15;
```

---

### 3.6 `offers` — Ofertas Comerciales

La tabla `offers` captura las propuestas comerciales que las empresas de transporte envían en respuesta a viajes publicados por clientes. Cada oferta incluye el precio propuesto, términos de servicio, y puede estar asociada a una subasta competitiva o ser una respuesta directa a una solicitud de servicio.

| Columna           | Tipo                          | Constraints                          | Descripción                                    |
|-------------------|-------------------------------|--------------------------------------|------------------------------------------------|
| `id`              | `BIGSERIAL`                   | `PRIMARY KEY`                        | Identificador único de oferta                  |
| `company_id`      | `BIGINT`                      | `NOT NULL REFERENCES companies(id)`   | Empresa que envía la oferta                   |
| `trip_id`         | `BIGINT`                      | `NOT NULL REFERENCES trips(id)`      | Viaje al que responde                          |
| `offer_number`    | `VARCHAR(50)`                 | `UNIQUE NOT NULL`                    | Número de oferta legible                       |
| `status`          | `offer_status`                | `NOT NULL DEFAULT 'submitted'`       | Estado de la oferta                           |
| `price`           | `DECIMAL(12,2)`               | `NOT NULL`                           | Monto total предложения                       |
| `currency`        | `CHAR(3)`                     | `NOT NULL DEFAULT 'MXN'`            | Moneda del предложения                        |
| `valid_until`     | `TIMESTAMPTZ`                 |                                      | Fecha de validez de la oferta                 |
| `estimated_distance_km` | `DECIMAL(10,2)`          |                                      | Distancia estimada                            |
| `estimated_duration_hrs` | `DECIMAL(6,2)`           |                                      | Duración estimada (horas)                    |
| `vehicle_type_offered` | `VARCHAR(50)`           |                                      | Tipo de vehículo ofertado                     |
| `vehicle_id`      | `BIGINT`                      | `REFERENCES vehicles(id)`            | Vehículo específico propuesto (si se define)  |
| `driver_id`       | `BIGINT`                      | `REFERENCES drivers(id)`             | Conductor propuesto                           |
| `includes_fuel`   | `BOOLEAN`                     | `DEFAULT TRUE`                       | Incluye combustible en el precio              |
| `includes_tolls`  | `BOOLEAN`                     | `DEFAULT FALSE`                      | Incluye peajes en el precio                   |
| `includes_insurance` | `BOOLEAN`                | `DEFAULT TRUE`                      | Incluye seguro en el precio                   |
| `payment_terms`  | `VARCHAR(50)`                 | `DEFAULT 'net_30'`                   | Términos de pago                               |
| `coverage_area`   | `TEXT`                        |                                      | Área de cobertura del servicio                |
| `response_time_hrs` | `DECIMAL(5,2)`            |                                      | Tiempo de respuesta garantizado (horas)       |
| `service_terms`   | `TEXT`                        |                                      | Términos y condiciones del servicio            |
| `notes`           | `TEXT`                        |                                      | Notas adicionales del oferente                |
| `awards_count`    | `INTEGER`                     | `DEFAULT 0`                          | Veces que esta empresa ha ganado ofertas       |
| `cancellation_rate` | `DECIMAL(4,3)`              | `DEFAULT 0`                          | Tasa de cancelación historica                |
| `rating`          | `DECIMAL(3,2)`                | `DEFAULT 5.00`                       | Calificación promedio de la empresa           |
| `rank`            | `INTEGER`                     |                                      | Ranking de la oferta (1=mejor)               |
| `submitted_at`    | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de envío                            |
| `reviewed_at`     | `TIMESTAMPTZ`                 |                                      | Timestamp de revisión                         |
| `accepted_at`     | `TIMESTAMPTZ`                 |                                      | Timestamp de aceptación                       |
| `rejected_at`     | `TIMESTAMPTZ`                 |                                      | Timestamp de rechazo                          |
| `withdrawn_at`    | `TIMESTAMPTZ`                 |                                      | Timestamp de retiro                           |
| `metadata`        | `JSONB`                       | `DEFAULT '{}'`                       | Datos adicionales flexibles                   |
| `created_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de creación                          |
| `updated_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de última modificación               |

**Constraints de Validación:**
```sql
ALTER TABLE offers ADD CONSTRAINT chk_offers_price_positive
  CHECK (price > 0);
ALTER TABLE offers ADD CONSTRAINT chk_offers_currency_iso
  CHECK (currency ~ '^[A-Z]{3}$');
ALTER TABLE offers ADD CONSTRAINT chk_offers_estimated_distance_positive
  CHECK (estimated_distance_km IS NULL OR estimated_distance_km > 0);
ALTER TABLE offers ADD CONSTRAINT chk_offers_rank_positive
  CHECK (rank IS NULL OR rank > 0);
```

**Índices:**
```sql
CREATE UNIQUE INDEX idx_offers_offer_number ON offers(offer_number);
CREATE INDEX idx_offers_company ON offers(company_id);
CREATE INDEX idx_offers_trip ON offers(trip_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_price ON offers(price);
CREATE INDEX idx_offers_submitted ON offers(submitted_at DESC);
CREATE INDEX idx_offers_trip_company ON offers(trip_id, company_id);
CREATE INDEX idx_offers_valid ON offers(valid_until) 
  WHERE valid_until > NOW() AND status = 'submitted';
```

---

### 3.7 `auctions` — Subastas de Viajes

La tabla `auctions` gestiona el mecanismo de subastas inversas donde los clientes publican la necesidad de un servicio de transporte y las empresas competidor ofrecen sus precios. Las subastas pueden ser abiertas (todos ven las ofertas) o ciegas (ofertas ocultas), y tienen tiempos definidos de inicio y fin con extensión automática si hay actividad cerca del cierre.

| Columna           | Tipo                          | Constraints                          | Descripción                                    |
|-------------------|-------------------------------|--------------------------------------|------------------------------------------------|
| `id`              | `BIGSERIAL`                   | `PRIMARY KEY`                        | Identificador único de subasta                 |
| `company_id`      | `BIGINT`                      | `NOT NULL REFERENCES companies(id)`   | Empresa organizadora (cliente)                 |
| `trip_id`         | `BIGINT`                      | `REFERENCES trips(id)`              | Viaje asociado (puede crearse con la subasta)  |
| `auction_number`  | `VARCHAR(50)`                 | `UNIQUE NOT NULL`                    | Número de subasta legible                      |
| `title`           | `VARCHAR(255)`                | `NOT NULL`                           | Título de la subasta                           |
| `description`     | `TEXT`                        |                                      | Descripción detallada                         |
| `status`          | `auction_status`              | `NOT NULL DEFAULT 'draft'`           | Estado de la subasta                           |
| `auction_type`    | `VARCHAR(30)`                 | `NOT NULL DEFAULT 'reverse'`         | Tipo: reverse (cliente busca), forward (transportista ofrece) |
| `visibility`      | `VARCHAR(20)`                 | `NOT NULL DEFAULT 'public'`          | Visibilidad: public, private, invite_only      |
| `invited_companies` | `JSONB`                      | `DEFAULT '[]'`                       | Lista de IDs de empresas invitadas (si es privada) |
| `start_time`      | `TIMESTAMPTZ`                 | `NOT NULL`                           | Fecha/hora de inicio de la subasta             |
| `end_time`        | `TIMESTAMPTZ`                 | `NOT NULL`                           | Fecha/hora de fin de la subasta                |
| `original_end_time` | `TIMESTAMPTZ`                |                                      | Hora de fin original (para extensiones)        |
| `extension_threshold_secs` | `INTEGER`             | `DEFAULT 120`                        | Segundos antes del fin para extender           |
| `extension_count` | `SMALLINT`                    | `DEFAULT 0`                          | Número de veces que se extendió                |
| `max_extensions`  | `SMALLINT`                    | `DEFAULT 3`                          | Máximo de extensiones permitidas              |
| `min_bid`         | `DECIMAL(12,2)`               |                                      | Oferta mínima requerida                       |
| `max_bid`         | `DECIMAL(12,2)`               |                                      | Oferta máxima esperada (referencia)            |
| `reserve_price`   | `DECIMAL(12,2)`               |                                      | Precio de reserva (mínimo aceptable)           |
| `current_best_bid` | `DECIMAL(12,2)`              |                                      | Mejor oferta actual                           |
| `bid_count`       | `INTEGER`                     | `DEFAULT 0`                          | Conteo de ofertas recibidas                    |
| `unique_bidders`  | `INTEGER`                     | `DEFAULT 0`                          | Conteo de ofertantes únicos                   |
| `winner_company_id` | `BIGINT`                     |                                      | Empresa ganadora                              |
| `winning_bid_id`  | `BIGINT`                      |                                      | ID de la oferta ganadora                      |
| `winning_amount`  | `DECIMAL(12,2)`               |                                      | Monto de la oferta ganadora                   |
| `auction_result_notes` | `TEXT`                  |                                      | Notas sobre el resultado de la subasta         |
| `auto_assign_winner` | `BOOLEAN`               | `DEFAULT TRUE`                       | Auto-asignar ganador al cerrar                |
| `notification_preference` | `VARCHAR(30)`        | `DEFAULT 'instant'`                  | Notificación: instant, digest, none           |
| `metadata`        | `JSONB`                       | `DEFAULT '{}'`                       | Datos adicionales flexibles                    |
| `created_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de creación                          |
| `updated_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de última modificación               |

**Constraints de Validación:**
```sql
ALTER TABLE auctions ADD CONSTRAINT chk_auctions_time_range
  CHECK (start_time < end_time);
ALTER TABLE auctions ADD CONSTRAINT chk_auctions_min_bid_positive
  CHECK (min_bid IS NULL OR min_bid > 0);
ALTER TABLE auctions ADD CONSTRAINT chk_auctions_bid_range
  CHECK (max_bid IS NULL OR min_bid IS NULL OR max_bid >= min_bid);
ALTER TABLE auctions ADD CONSTRAINT chk_auctions_extension_threshold
  CHECK (extension_threshold_secs > 0);
```

**Índices:**
```sql
CREATE UNIQUE INDEX idx_auctions_auction_number ON auctions(auction_number);
CREATE INDEX idx_auctions_company ON auctions(company_id);
CREATE INDEX idx_auctions_trip ON auctions(trip_id) WHERE trip_id IS NOT NULL;
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_type ON auctions(auction_type);
CREATE INDEX idx_auctions_visibility ON auctions(visibility);
CREATE INDEX idx_auctions_end_time ON auctions(end_time) 
  WHERE status IN ('draft', 'active');
CREATE INDEX idx_auctions_current_best ON auctions(current_best_bid) 
  WHERE current_best_bid IS NOT NULL;
CREATE INDEX idx_auctions_active_public ON auctions(visibility, status, end_time) 
  WHERE visibility = 'public' AND status IN ('active', 'closed');
```

---

### 3.8 `payments` — Pagos y Transacciones Financieras

La tabla `payments` centraliza todas las transacciones financieras del sistema, incluyendo pagos de clientes por servicios, pagos a conductores por viajes completados, y reembolsos. Cada pago está vinculado a un viaje u orden específica, permitiendo trazabilidad completa y conciliación contable.

| Columna           | Tipo                          | Constraints                          | Descripción                                    |
|-------------------|-------------------------------|--------------------------------------|------------------------------------------------|
| `id`              | `BIGSERIAL`                   | `PRIMARY KEY`                        | Identificador único de pago                   |
| `company_id`      | `BIGINT`                      | `NOT NULL REFERENCES companies(id)`   | Empresa que recibe/procesa el pago             |
| `trip_id`         | `BIGINT`                      | `REFERENCES trips(id)`              | Viaje asociado                                 |
| `order_id`        | `BIGINT`                      | `REFERENCES orders(id)`             | Orden asociada                                 |
| `invoice_id`      | `BIGINT`                      | `REFERENCES invoices(id)`           | Factura asociada                               |
| `payment_number`  | `VARCHAR(50)`                 | `UNIQUE NOT NULL`                    | Número de pago legible                         |
| `payment_type`    | `VARCHAR(30)`                 | `NOT NULL`                           | Tipo: customer_payment, driver_payout, refund, expense |
| `direction`       | `VARCHAR(10)`                 | `NOT NULL`                           | Dirección: inbound, outbound                  |
| `amount`          | `DECIMAL(12,2)`               | `NOT NULL`                           | Monto del pago                                 |
| `currency`        | `CHAR(3)`                     | `NOT NULL DEFAULT 'MXN'`            | Moneda del pago                                |
| `exchange_rate`   | `DECIMAL(12,6)`               | `DEFAULT 1.000000`                   | Tipo de cambio si es diferente de la base     |
| `amount_in_base_currency` | `DECIMAL(12,2)`        |                                      | Monto en moneda base de la empresa           |
| `status`          | `payment_status`              | `NOT NULL DEFAULT 'pending'`         | Estado del pago                                |
| `payment_method`  | `VARCHAR(30)`                 |                                      | Método: credit_card, bank_transfer, cash, check, wallet |
| `payment_gateway` | `VARCHAR(50)`                 |                                      | Gateway: stripe, paypal, MercadoPago           |
| `gateway_transaction_id` | `VARCHAR(255)`       |                                      | ID de transacción del gateway                 |
| `gateway_response` | `JSONB`                      |                                      | Respuesta completa del gateway                 |
| `authorization_code` | `VARCHAR(100)`              |                                      | Código de autorización del banco              |
| `reference_number` | `VARCHAR(100)`              |                                      | Número de referencia del pago                 |
| `bank_name`       | `VARCHAR(100)`                |                                      | Nombre del banco                               |
| `bank_account_last_digits` | `VARCHAR(10)`         |                                      | Últimos 4 dígitos de la cuenta               |
| `scheduled_date`  | `DATE`                        |                                      | Fecha programada de ejecución                  |
| `processed_at`    | `TIMESTAMPTZ`                 |                                      | Timestamp de procesamiento                    |
| `completed_at`    | `TIMESTAMPTZ`                 |                                      | Timestamp de completación                     |
| `failed_at`       | `TIMESTAMPTZ`                 |                                      | Timestamp de fallo                             |
| `failure_reason`  | `VARCHAR(255)`                |                                      | Razón del fallo                                |
| `retry_count`     | `SMALLINT`                    | `DEFAULT 0`                          | Intentos de retry                              |
| `max_retries`     | `SMALLINT`                    | `DEFAULT 3`                          | Máximo de reintentos                          |
| `next_retry_at`   | `TIMESTAMPTZ`                 |                                      | Próximo intento de retry                      |
| `refund_id`       | `BIGINT`                      | `REFERENCES payments(id)`            | Pago de reembolso asociado                     |
| `refunded_amount` | `DECIMAL(12,2)`               |                                      | Monto reembolsado                              |
| `refund_reason`   | `VARCHAR(255)`                |                                      | Razón del reembolso                            |
| `notes`           | `TEXT`                        |                                      | Notas internas                                 |
| `receipt_url`      | `VARCHAR(500)`                |                                      | URL del comprobante de pago                   |
| `tax_withheld`    | `DECIMAL(12,2)`               | `DEFAULT 0`                          | Impuesto retenido                              |
| `metadata`        | `JSONB`                       | `DEFAULT '{}'`                       | Datos adicionales flexibles                    |
| `created_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de creación                          |
| `updated_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de última modificación               |

**Constraints de Validación:**
```sql
ALTER TABLE payments ADD CONSTRAINT chk_payments_amount_positive
  CHECK (amount > 0);
ALTER TABLE payments ADD CONSTRAINT chk_payments_currency_iso
  CHECK (currency ~ '^[A-Z]{3}$');
ALTER TABLE payments ADD CONSTRAINT chk_payments_exchange_rate_positive
  CHECK (exchange_rate > 0);
ALTER TABLE payments ADD CONSTRAINT chk_payments_retry_count
  CHECK (retry_count >= 0 AND retry_count <= max_retries);
```

**Índices:**
```sql
CREATE UNIQUE INDEX idx_payments_payment_number ON payments(payment_number);
CREATE INDEX idx_payments_company ON payments(company_id);
CREATE INDEX idx_payments_trip ON payments(trip_id) WHERE trip_id IS NOT NULL;
CREATE INDEX idx_payments_order ON payments(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_payments_invoice ON payments(invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_type ON payments(payment_type);
CREATE INDEX idx_payments_direction ON payments(direction);
CREATE INDEX idx_payments_scheduled_date ON payments(scheduled_date) 
  WHERE scheduled_date IS NOT NULL AND status = 'pending';
CREATE INDEX idx_payments_gateway ON payments(gateway_transaction_id) 
  WHERE gateway_transaction_id IS NOT NULL;
CREATE INDEX idx_payments_pending_retry ON payments(next_retry_at) 
  WHERE next_retry_at IS NOT NULL AND status = 'pending';
```

---

### 3.9 `ratings` — Calificaciones y Reseñas

La tabla `ratings` almacena las evaluaciones mutuas entre las partes de un viaje: clientes califican a la empresa/conductor, empresas califican a los clientes, y se registran calificaciones específicas por aspectos como puntualidad, condición del vehículo, profesionalismo, y calidad de servicio.

| Columna           | Tipo                          | Constraints                          | Descripción                                    |
|-------------------|-------------------------------|--------------------------------------|------------------------------------------------|
| `id`              | `BIGSERIAL`                   | `PRIMARY KEY`                        | Identificador único de calificación            |
| `trip_id`         | `BIGINT`                      | `NOT NULL REFERENCES trips(id)`      | Viaje evaluado                                 |
| `rating_from_user_id` | `BIGINT`                    | `NOT NULL REFERENCES users(id)`      | Usuario que califica                           |
| `rating_from_driver_id` | `BIGINT`                  | `REFERENCES drivers(id)`            | Conductor que califica (si aplica)             |
| `rating_from_company_id` | `BIGINT`                 | `REFERENCES companies(id)`          | Empresa que califica (si aplica)               |
| `rating_to_user_id` | `BIGINT`                    | `REFERENCES users(id)`               | Usuario calificado                             |
| `rating_to_driver_id` | `BIGINT`                  | `REFERENCES drivers(id)`            | Conductor calificado                           |
| `rating_to_company_id` | `BIGINT`                  | `REFERENCES companies(id)`          | Empresa calificada                             |
| `rating_type`     | `VARCHAR(30)`                 | `NOT NULL`                           | Tipo: trip_rating, company_rating, driver_rating, customer_rating |
| `overall_score`   | `DECIMAL(3,2)`                | `NOT NULL`                           | Calificación general (1.00-5.00)               |
| `punctuality_score` | `DECIMAL(3,2)`              |                                      | Calificación de puntualidad (1-5)             |
| `communication_score` | `DECIMAL(3,2)`            |                                      | Calificación de comunicación (1-5)             |
| `condition_score`  | `DECIMAL(3,2)`                |                                      | Calificación de condición (1-5)               |
| `professionalism_score` | `DECIMAL(3,2)`         |                                      | Calificación de profesionalismo (1-5)         |
| `value_score`     | `DECIMAL(3,2)`                |                                      | Calificación de relación valor/precio (1-5)    |
| `comment`         | `TEXT`                        |                                      | Comentario o reseña textual                    |
| `pros`            | `TEXT`                        |                                      | Aspectos positivos                             |
| `cons`            | `TEXT`                        |                                      | Aspectos a mejorar                            |
| `response_comment` | `TEXT`                       |                                      | Respuesta del calificado                       |
| `responded_at`    | `TIMESTAMPTZ`                 |                                      | Timestamp de respuesta                         |
| `is_public`       | `BOOLEAN`                     | `DEFAULT TRUE`                       | Si la calificación es pública                  |
| `is_verified`     | `BOOLEAN`                     | `DEFAULT TRUE`                       | Calificación verificada (viaje completado)     |
| `helpful_count`   | `INTEGER`                     | `DEFAULT 0`                          | Cantidad de votos útiles                      |
| `report_count`    | `INTEGER`                     | `DEFAULT 0`                          | Cantidad de reportes de abuso                 |
| `is_hidden`       | `BOOLEAN`                     | `DEFAULT FALSE`                      | Oculta por el administrador                    |
| `hidden_reason`   | `VARCHAR(255)`                |                                      | Razón de ocultamiento                         |
| `metadata`        | `JSONB`                       | `DEFAULT '{}'`                       | Datos adicionales flexibles                    |
| `created_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de creación                          |
| `updated_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de última modificación               |

**Constraints de Validación:**
```sql
ALTER TABLE ratings ADD CONSTRAINT chk_ratings_overall_score_range
  CHECK (overall_score BETWEEN 1.00 AND 5.00);
ALTER TABLE ratings ADD CONSTRAINT chk_ratings_punctuality_range
  CHECK (punctuality_score IS NULL OR (punctuality_score >= 1 AND punctuality_score <= 5));
ALTER TABLE ratings ADD CONSTRAINT chk_ratings_communication_range
  CHECK (communication_score IS NULL OR (communication_score >= 1 AND communication_score <= 5));
ALTER TABLE ratings ADD CONSTRAINT chk_ratings_condition_range
  CHECK (condition_score IS NULL OR (condition_score >= 1 AND condition_score <= 5));
ALTER TABLE ratings ADD CONSTRAINT chk_ratings_professionalism_range
  CHECK (professionalism_score IS NULL OR (professionalism_score >= 1 AND professionalism_score <= 5));
ALTER TABLE ratings ADD CONSTRAINT chk_ratings_value_range
  CHECK (value_score IS NULL OR (value_score >= 1 AND value_score <= 5));
```

**Índices:**
```sql
CREATE INDEX idx_ratings_trip ON ratings(trip_id);
CREATE INDEX idx_ratings_from_user ON ratings(rating_from_user_id);
CREATE INDEX idx_ratings_to_user ON ratings(rating_to_user_id) WHERE rating_to_user_id IS NOT NULL;
CREATE INDEX idx_ratings_to_driver ON ratings(rating_to_driver_id) WHERE rating_to_driver_id IS NOT NULL;
CREATE INDEX idx_ratings_to_company ON ratings(rating_to_company_id) WHERE rating_to_company_id IS NOT NULL;
CREATE INDEX idx_ratings_type ON ratings(rating_type);
CREATE INDEX idx_ratings_score ON ratings(overall_score DESC);
CREATE INDEX idx_ratings_created ON ratings(created_at DESC);
CREATE INDEX idx_ratings_public_company ON ratings(rating_to_company_id, is_public) 
  WHERE is_public = TRUE AND is_hidden = FALSE;
CREATE INDEX idx_ratings_public_driver ON ratings(rating_to_driver_id, is_public) 
  WHERE is_public = TRUE AND is_hidden = FALSE;
```

---

### 3.10 `notifications` — Sistema de Notificaciones

La tabla `notifications` implementa el sistema de notificaciones multi-canal del sistema Spottruck. Soporta notificaciones por correo electrónico, SMS, push notifications, y dentro de la aplicación. Cada notificación puede ser creada, enviada, entregada, y leída con seguimiento completo del ciclo de vida.

| Columna           | Tipo                          | Constraints                          | Descripción                                    |
|-------------------|-------------------------------|--------------------------------------|------------------------------------------------|
| `id`              | `BIGSERIAL`                   | `PRIMARY KEY`                        | Identificador único de notificación            |
| `user_id`         | `BIGINT`                      | `REFERENCES users(id)`              | Usuario destinatario                           |
| `company_id`      | `BIGINT`                      | `REFERENCES companies(id)`           | Empresa asociada                              |
| `driver_id`       | `BIGINT`                      | `REFERENCES drivers(id)`            | Conductor asociado (si aplica)                 |
| `trip_id`         | `BIGINT`                      | `REFERENCES trips(id)`              | Viaje asociado (si aplica)                     |
| `order_id`        | `BIGINT`                      | `REFERENCES orders(id)`             | Orden asociada (si aplica)                     |
| `notification_type` | `VARCHAR(50)`                | `NOT NULL`                           | Tipo: trip_assignment, payment_received, rating_received, auction_update, system_alert, document_ready, reminder, approval_required |
| `channel`         | `VARCHAR(20)`                 | `NOT NULL`                           | Canal: in_app, email, sms, push                |
| `priority`        | `VARCHAR(20)`                 | `DEFAULT 'normal'`                   | Prioridad: low, normal, high, urgent          |
| `status`          | `notification_status`        | `NOT NULL DEFAULT 'created'`         | Estado de la notificación                     |
| `title`           | `VARCHAR(255)`                | `NOT NULL`                           | Título de la notificación                     |
| `body`            | `TEXT`                        | `NOT NULL`                           | Cuerpo/mensaje de la notificación              |
| `summary`         | `VARCHAR(500)`                |                                      | Resumen (para listas y previews)              |
| `data`            | `JSONB`                       | `DEFAULT '{}'`                       | Datos estructurados adicionales               |
| `action_url`      | `VARCHAR(500)`                |                                      | URL de acción al hacer clic                   |
| `action_label`   | `VARCHAR(100)`                |                                      | Etiqueta del botón de acción                  |
| `image_url`       | `VARCHAR(500)`                |                                      | Imagen asociada a la notificación             |
| `email_to`        | `VARCHAR(255)`                |                                      | Destinatario de email                          |
| `email_cc`        | `VARCHAR(255)`                |                                      | CC de email                                    |
| `email_bcc`       | `VARCHAR(255)`                |                                      | BCC de email                                   |
| `email_subject`   | `VARCHAR(255)`                |                                      | Subject del email                              |
| `email_template_id` | `VARCHAR(100)`              |                                      | ID de plantilla de email usada                |
| `email_rendered_content` | `TEXT`                  |                                      | Contenido HTML renderizado                    |
| `sms_to`          | `VARCHAR(30)`                 |                                      | Número de teléfono para SMS                   |
| `sms_provider`    | `VARCHAR(50)`                 |                                      | Proveedor de SMS usado                        |
| `sms_message_id`  | `VARCHAR(100)`                |                                      | ID del mensaje en el proveedor                |
| `push_device_tokens` | `JSONB`                    | `DEFAULT '[]'`                       | Tokens de dispositivos para push              |
| `push_provider`   | `VARCHAR(50)`                 |                                      | Proveedor de push (FCM, APNS)                 |
| `push_message_id` | `VARCHAR(100)`                |                                      | ID del mensaje push                           |
| `scheduled_at`    | `TIMESTAMPTZ`                 |                                      | Fecha/hora de envío programada                |
| `sent_at`         | `TIMESTAMPTZ`                 |                                      | Timestamp de envío                             |
| `delivered_at`    | `TIMESTAMPTZ`                 |                                      | Timestamp de entrega                           |
| `read_at`         | `TIMESTAMPTZ`                 |                                      | Timestamp de lectura                           |
| `clicked_at`      | `TIMESTAMPTZ`                 |                                      | Timestamp de clic en acción                   |
| `failed_at`       | `TIMESTAMPTZ`                 |                                      | Timestamp de fallo                             |
| `failure_code`    | `VARCHAR(50)`                 |                                      | Código de error del proveedor                 |
| `failure_message` | `VARCHAR(255)`                |                                      | Mensaje de error descriptivo                  |
| `retry_count`     | `SMALLINT`                    | `DEFAULT 0`                          | Intentos de reintento                         |
| `expires_at`      | `TIMESTAMPTZ`                 |                                      | Fecha de expiración de la notificación         |
| `is_read`         | `BOOLEAN`                     | `DEFAULT FALSE`                      | Si ha sido leída                              |
| `is_archived`     | `BOOLEAN`                     | `DEFAULT FALSE`                      | Si ha sido archivada por el usuario            |
| `is_deleted`      | `BOOLEAN`                     | `DEFAULT FALSE`                      | Soft-delete                                    |
| `deleted_at`      | `TIMESTAMPTZ`                 |                                      | Timestamp de eliminación                       |
| `metadata`        | `JSONB`                       | `DEFAULT '{}'`                       | Datos adicionales flexibles                    |
| `created_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de creación                          |
| `updated_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de última modificación               |

**Índices:**
```sql
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_company ON notifications(company_id);
CREATE INDEX idx_notifications_driver ON notifications(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_notifications_trip ON notifications(trip_id) WHERE trip_id IS NOT NULL;
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_channel ON notifications(channel);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) 
  WHERE is_read = FALSE AND is_deleted = FALSE;
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_at) 
  WHERE scheduled_at IS NOT NULL AND status = 'created';
CREATE INDEX idx_notifications_created_recent ON notifications(created_at DESC) 
  WHERE created_at > NOW() - INTERVAL '30 days';
```

---

### 3.11 `gps_locations` — Tracking GPS en Tiempo Real

La tabla `gps_locations` almacena los datos de posicionamiento global de los vehículos en tiempo real. Cada registro representa un punto en el historial de ruta de un vehículo, incluyendo coordenadas, velocidad, dirección, y datos del sensor que permiten reconstruir el traycto completo y calcular métricas de eficiencia de combustible y tiempo.

| Columna           | Tipo                          | Constraints                          | Descripción                                    |
|-------------------|-------------------------------|--------------------------------------|------------------------------------------------|
| `id`              | `BIGSERIAL`                   | `PRIMARY KEY`                        | Identificador único del registro GPS           |
| `vehicle_id`      | `BIGINT`                      | `NOT NULL REFERENCES vehicles(id)`   | Vehículo al que pertenece                      |
| `trip_id`         | `BIGINT`                      | `REFERENCES trips(id)`              | Viaje activo (si está en uno)                  |
| `driver_id`       | `BIGINT`                      | `REFERENCES drivers(id)`            | Conductor en ese momento                        |
| `device_id`       | `VARCHAR(100)`                |                                      | ID del dispositivo GPS/trackeador              |
| `provider`        | `VARCHAR(50)`                 |                                      | Proveedor: gps, cellular, satellite            |
| `recorded_at`     | `TIMESTAMPTZ`                 | `NOT NULL`                           | Timestamp de la lectura GPS                    |
| `latitude`        | `DECIMAL(10,8)`               | `NOT NULL`                           | Latitud (-90 a 90)                             |
| `longitude`       | `DECIMAL(11,8)`               | `NOT NULL`                           | Longitud (-180 a 180)                          |
| `altitude_m`      | `DECIMAL(8,2)`                |                                      | Altitud sobre el nivel del mar (metros)        |
| `accuracy_m`      | `DECIMAL(6,2)`                |                                      | Precisión de la ubicación (metros)            |
| `speed_kmh`       | `DECIMAL(6,2)`                |                                      | Velocidad instantanea (km/h)                   |
| `heading_deg`     | `DECIMAL(5,2)`                |                                      | Dirección en grados (0-360, 0=Norte)           |
| `speed_limit_kmh` | `INTEGER`                     |                                      | Límite de velocidad en ese tramo (km/h)       |
| `satellites`      | `SMALLINT`                    |                                      | Número de satélites usados                     |
| `hdop`            | `DECIMAL(4,2)`                |                                      | Horizontal Dilution of Precision              |
| `vdop`            | `DECIMAL(4,2)`                |                                      | Vertical Dilution of Precision                 |
| `battery_level`   | `DECIMAL(4,1)`                |                                      | Nivel de batería del dispositivo (%)          |
| `signal_strength` | `SMALLINT`                    |                                      | Fuerza de señal (0-100)                        |
| `fuel_level_pct`  | `DECIMAL(5,2)`                |                                      | Nivel de combustible (%)                       |
| `engine_rpm`      | `INTEGER`                     |                                      | RPM del motor                                  |
| `engine_temp_c`   | `DECIMAL(5,2)`                |                                      | Temperatura del motor (°C)                    |
| `odometer_km`     | `BIGINT`                      |                                      | Odómetro en ese momento (km)                  |
| `engine_hours`    | `DECIMAL(8,2)`                |                                      | Horas de operación del motor                  |
| `idle_time_min`   | `INTEGER`                     |                                      | Tiempo en ralentí (minutos desde última lectura) |
| `moving_time_min` | `INTEGER`                     |                                      | Tiempo en movimiento (minutos)                |
| `stop_time_min`   | `INTEGER`                     |                                      | Tiempo detenido (minutos)                     |
| `distance_km`    | `DECIMAL(8,2)`                |                                      | Distancia desde última lectura (km)           |
| `geofence_id`     | `BIGINT`                      |                                      | Geofence en el que se encuentra                |
| `geofence_event`  | `VARCHAR(30)`                 |                                      | Evento: enter, exit, dwell, speeding           |
| `event_type`      | `VARCHAR(50)`                 |                                      | Tipo de evento: location, alarm, checkpoint    |
| `event_data`      | `JSONB`                       | `DEFAULT '{}'`                       | Datos adicionales del evento                  |
| `raw_data`        | `JSONB`                       | `DEFAULT '{}'`                       | Datos crudos del dispositivo GPS              |
| `processing_status` | `VARCHAR(20)`                | `DEFAULT 'processed'`                | Estado de procesamiento: raw, processed, analyzed |
| `created_at`      | `TIMESTAMPTZ`                 | `NOT NULL DEFAULT NOW()`             | Timestamp de creación                          |

**Constraints de Validación:**
```sql
ALTER TABLE gps_locations ADD CONSTRAINT chk_gps_locations_latitude
  CHECK (latitude BETWEEN -90 AND 90);
ALTER TABLE gps_locations ADD CONSTRAINT chk_gps_locations_longitude
  CHECK (longitude BETWEEN -180 AND 180);
ALTER TABLE gps_locations ADD CONSTRAINT chk_gps_locations_heading
  CHECK (heading_deg IS NULL OR (heading_deg >= 0 AND heading_deg <= 360));
ALTER TABLE gps_locations ADD CONSTRAINT chk_gps_locations_speed_positive
  CHECK (speed_kmh IS NULL OR speed_kmh >= 0);
ALTER TABLE gps_locations ADD CONSTRAINT chk_gps_locations_fuel_level
  CHECK (fuel_level_pct IS NULL OR (fuel_level_pct >= 0 AND fuel_level_pct <= 100));
```

**Índices:**
```sql
CREATE INDEX idx_gps_vehicle_recorded ON gps_locations(vehicle_id, recorded_at DESC);
CREATE INDEX idx_gps_trip ON gps_locations(trip_id) WHERE trip_id IS NOT NULL;
CREATE INDEX idx_gps_driver ON gps_locations(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_gps_vehicle_time_range ON gps_locations(vehicle_id, recorded_at) 
  WHERE recorded_at > NOW() - INTERVAL '24 hours';
CREATE INDEX idx_gps_geofence ON gps_locations(geofence_id) WHERE geofence_id IS NOT NULL;
CREATE INDEX idx_gps_event_type ON gps_locations(event_type) WHERE event_type IS NOT NULL;
CREATE INDEX idx_gps_speeding ON gps_locations(speed_kmh, speed_limit_kmh) 
  WHERE speed_kmh > speed_limit_kmh AND speed_limit_kmh > 0;
-- Partitioning por fecha para optimizar queries históricos
CREATE INDEX idx_gps_recorded_at_partition ON gps_locations(recorded_at) 
  PARTITION BY RANGE (recorded_at);
```

---

## 4. Índices Adicionales y Estrategias de Optimización

### 4.1 Índice Compuesto para Dashboard Principal

```sql
-- Índice para consultas de dashboard de operaciones
CREATE INDEX idx_trips_dashboard ON trips(company_id, status, scheduled_start) 
  WHERE status IN ('scheduled', 'in_progress');
```

### 4.2 Índice para Reporte de Eficiencia de Combustible

```sql
-- Índice para cálculo de consumo promedio por vehículo
CREATE INDEX idx_vehicles_fuel_efficiency ON vehicles(company_id, vehicle_type, fuel_efficiency_l_100km) 
  WHERE is_active = TRUE;
```

### 4.3 Partial Index para Alertas de Mantenimiento

```sql
-- Index para vehículos que requieren servicio próximo
CREATE INDEX idx_vehicles_maintenance_due ON vehicles(current_km, next_service_km) 
  WHERE is_active = TRUE AND next_service_km IS NOT NULL 
  AND next_service_km <= current_km + 500;
```

---

## 5. Tablas Auxiliares Pendientes de Documentar

Las siguientes tablas están identificadas en el diseño pero la documentación detallada será presentada en documentos separados siguiendo el mismo patrón de profundidad establecido en esta sección:

- `branches` — Sucursales y dependencias de empresa
- `orders` — Órdenes de servicio de clientes
- `customers` — Perfil de clientes empresariales e individuales
- `invoices` — Documentos fiscales generados
- `maintenance_records` — Historial de mantenimiento de vehículos
- `fuel_cards` — Gestión de tarjetas de combustible
- `geofences` — Definición de zonas geoespaciales
- `audit_logs` — Log de auditoría para compliance

---

## 6. Notas de Implementación

### 6.1 Row Level Security (RLS)

Para environments multi-tenant, se recomienda implementar RLS policies que filtren automáticamente los registros por `company_id`:

```sql
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY vehicles_company_policy ON vehicles
  FOR ALL
  USING (company_id = current_setting('app.current_company_id')::BIGINT);
```

### 6.2 Particionamiento de GPS Locations

Dada la alta volumetría de datos GPS, se recomienda fortemente el particionamiento por rango de fechas:

```sql
CREATE TABLE gps_locations_2026_06 PARTITION OF gps_locations
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
```

### 6.3 JSONB Indexing para Metadata

Para consultas sobre campos de metadata flexible:

```sql
CREATE INDEX idx_vehicles_metadata_brand ON vehicles 
  USING GIN ((metadata -> 'brand'));
```

---

*Documento generado como parte del modelo de datos Spottruck v1.0*
*Última actualización: 2026-06-03*