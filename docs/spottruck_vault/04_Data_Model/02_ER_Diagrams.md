---
title: "02 - Diagramas de Entidad-Relación"
description: "Diagramas ER completos en formato ASCII para el proyecto Spottruck, mostrando todas las entidades, relaciones, claves primarias (PK), claves foráneas (FK) y cardinalidades."
created: 2026-06-03
tags:
  - spottruck
  - postgresql
  - database
  - er-diagram
  - ascii
  - data-model
area: Proyectos
project: Spottruck
module: "04_Data_Model"
---

# Spottruck — Diagramas de Entidad-Relación (ER)

## 1. Introducción y Propósito

Este documento presenta los **diagramas de Entidad-Relación (ER)** del sistema Spottruck en formato ASCII, diseñados para comunicar visualmente la estructura de la base de datos PostgreSQL. Los diagramas ER son fundamentales para el diseño de bases de datos porque permiten visualizar cómo las diferentes entidades del dominio se relacionan entre sí, facilitando la comprensión del modelo de datos por parte de desarrolladores, arquitectos, y stakeholders técnicos.

El formato ASCII fue elegido por su portabilidad y capacidad de ser versionado en sistemas de control de fuente como Git, donde las imágenes binarias no son prácticas. Además, el formato ASCII permite incluir los diagramas directamente en documentación Markdown sin necesidad de herramientas especializadas de visualización.

La notación utilizada sigue el estándar **Crow's Foot (UML-like)** adaptada para ASCII, donde las relaciones se muestran con líneas que terminan en símbolos que indican la cardinalidad: `||` para "exactamente uno", `}{` para "uno a muchos", y `<>` para "cero o uno".

---

## 2. Diagrama Principal del Sistema — Vista Global

El siguiente diagrama muestra la estructura completa del sistema Spottruck con todas las entidades principales y sus relaciones. Este es el diagrama de más alto nivel que sirve como mapa del modelo de datos completo.

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                        SPOTTRUCK - MODELO DE DATOS - VISTA GLOBAL               ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐              ║
║    │   USERS     │         │  COMPANIES  │         │  DRIVERS    │              ║
║    ├─────────────┤         ├─────────────┤         ├─────────────┤              ║
║    │ PK id       │         │ PK id       │         │ PK id       │              ║
║    │    email    │         │    name     │         │    emp_no   │              ║
║    │    password │         │ PK tax_id   │         │ FK user_id  │              ║
║    │    full_name│         │    address  │         │ FK company  │              ║
║    │    phone    │         │    phone    │         │    license  │              ║
║    │    role     │         │    country  │         │    status   │              ║
║    │    is_active│         │    is_active│         │    rating   │              ║
║    └──────┬──────┘         └──────┬──────┘         └──────┬──────┘              ║
║           │                      │                       │                      ║
║           │ 1                    │ 1                     │ 1                    ║
║           │                      │                       │                      ║
║           │    ┌─────────────────┴─────────────────────┤                    ║
║           │    │                                       │                      ║
║           │    ▼                                       ▼                      ║
║    ┌──────┴─────────────┐              ┌─────────────┴─────────┐                ║
║    │     VEHICLES       │              │       TRIPS          │                ║
║    ├────────────────────┤              ├──────────────────────┤                ║
║    │ PK id              │              │ PK id                │                ║
║    │    vin (UQ)        │              │ FK company_id        │                ║
║    │    license_plate   │         1    │ FK vehicle_id        │                ║
║    │    make            │◄─────────────│ FK driver_id         │                ║
║    │    model           │              │ FK co_driver_id      │                ║
║    │    year            │              │ FK order_id          │                ║
║    │    status          │              │    trip_number (UQ) │                ║
║    │ FK company_id      │              │    trip_type         │                ║
║    │ FK branch_id       │              │    status            │                ║
║    │ FK assigned_driver │              │    origin_address    │                ║
║    │    load_capacity   │              │    dest_address      │                ║
║    │    fuel_type       │              │    scheduled_start  │                ║
║    └────────────────────┘              │    scheduled_end    │                ║
║           │                             │    actual_start     │                ║
║           │ 1                          │    actual_end       │                ║
║           │                            │    cargo_weight      │                ║
║           ▼                            │    fuel_consumed     │                ║
║    ┌──────────────┐                    │    total_cost        │                ║
║    │ GPS_LOCATIONS│                    └──────────┬───────────┘                ║
║    ├──────────────┤                             │ 1                            ║
║    │ PK id        │                             │                              ║
║    │ FK vehicle_id│         ┌───────────────────┼───────────────────┐          ║
║    │ FK trip_id   │         │ 1                 │ 1                 │          ║
║    │ FK driver_id │         ▼                 │                   ▼          ║
║    │    latitude  │    ┌───────────┐    ┌──────┴──────┐    ┌──────────────┐   ║
║    │    longitude │    │  OFFERS   │    │   PAYMENTS  │    │   RATINGS    │   ║
║    │    speed_kmh │    ├───────────┤    ├─────────────┤    ├──────────────┤   ║
║    │    recorded_at│   │ PK id     │    │ PK id       │    │ PK id        │   ║
║    │    heading   │    │ FK trip_id│    │ FK trip_id  │    │ FK trip_id   │   ║
║    └──────────────┘    │ FK company│    │ FK company  │    │ FK from_user │   ║
║                        │    price  │    │    amount   │    │ FK to_user   │   ║
║                        │    status │    │    status   │    │ FK to_driver │   ║
║                        │    valid  │    │    method   │    │    score     │   ║
║                        │    until  │    │    gateway  │    │    comment   │   ║
║                        └──────┬────┘    └─────────────┘    └──────────────┘   ║
║                               │ 1                                            ║
║                               ▼                                              ║
║                        ┌───────────────┐                                    ║
║                        │   AUCTIONS    │                                    ║
║                        ├───────────────┤                                    ║
║                        │ PK id         │                                    ║
║                        │ FK trip_id    │                                    ║
║                        │ FK company    │                                    ║
║                        │    auction_no │                                    ║
║                        │    start_time │                                    ║
║                        │    end_time   │                                    ║
║                        │    status     │                                    ║
║                        │    reserve    │                                    ║
║                        │    current_bid│                                    ║
║                        │    winner_id  │                                    ║
║                        └───────────────┘                                    ║
║                               │                                              ║
║                               │ 1                                            ║
║                               ▼                                              ║
║                        ┌───────────────┐                                    ║
║                        │ BIDS (inner)  │                                    ║
║                        ├───────────────┤                                    ║
║                        │ PK id         │                                    ║
║                        │ FK auction_id │                                    ║
║                        │ FK company_id │                                    ║
║                        │    amount     │                                    ║
║                        │    created_at │                                    ║
║                        │    status     │                                    ║
║                        └───────────────┘                                    ║
║                                                                                  ║
║    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐              ║
║    │NOTIFICATIONS│         │  ORDERS     │         │  CUSTOMERS  │              ║
║    ├─────────────┤         ├─────────────┤         ├─────────────┤              ║
║    │ PK id       │         │ PK id       │         │ PK id       │              ║
║    │ FK user_id  │         │ FK company  │         │ FK company  │              ║
║    │ FK company  │         │ FK customer │         │    name     │              ║
║    │ FK driver   │         │ FK order_no │         │    email    │              ║
║    │ FK trip_id  │         │    status   │         │    phone    │              ║
║    │    type     │         │    priority │         │    type     │              ║
║    │    channel  │         │    pickup   │         │    credit   │              ║
║    │    status   │         │    delivery │         │    balance  │              ║
║    │    title    │         │    cargo    │         │    rating   │              ║
║    │    body     │         │    amount   │         └──────┬──────┘              ║
║    └─────────────┘         │    currency │               │                     ║
║                           └─────────────┘               │                     ║
║                                                          │                     ║
║                           ┌──────────────────────────────┘                     ║
║                           │                                                      ║
║                           ▼                                                      ║
║                    ┌─────────────┐                                               ║
║                    │  BRANCHES   │                                               ║
║                    ├─────────────┤                                               ║
║                    │ PK id       │                                               ║
║                    │ FK company  │                                               ║
║                    │    name     │                                               ║
║                    │    code     │                                               ║
║                    │    address  │                                               ║
║                    │    city     │                                               ║
║                    │    capacity │                                               ║
║                    └─────────────┘                                               ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

### 2.1 Convenciones de Notación Utilizadas

El diagrama anterior emplea las siguientes convenciones de notación para comunicar la estructura y relaciones de manera efectiva:

| Símbolo | Significado | Descripción |
|---------|-------------|-------------|
| `PK` | Primary Key | Clave primaria, identificador único de la entidad |
| `FK` | Foreign Key | Clave foránea que referencia a otra tabla |
| `(UQ)` | Unique | Constraint de unicidad, valor no puede repetirse |
| `*` | NOT NULL | Columna obligatoria, no acepta valores nulos |
| `┌─┐` | Entidad | Caja que representa una tabla/entidad |
| `├─┤` | Separador | Línea horizontal que separa nombre de columnas |
| `│` | Connector | Línea vertical que conecta componentes |
| `◆` | Attribute | Atributo de la entidad |
| `───►` | Relación | Flecha que indica dirección de la relación |
| `}{` | Crow's foot | Símbolo de "muchos" en relaciones |
| `───` | Línea | Conexión sin terminación especial indica "uno" |

---

## 3. Diagrama Detallado por Módulo

Para facilitar la comprensión de cada área funcional del sistema, los siguientes diagramas muestran cada módulo con mayor detalle y todas sus columnas.

### 3.1 Módulo de Usuarios y Autenticación

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                        MÓDULO: USUARIOS Y AUTENTICACIÓN                       ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║    ┌──────────────────────────────────────────────────────────────────────┐  ║
║    │                              USERS                                     │  ║
║    ├──────────────────────────────────────────────────────────────────────┤  ║
║    │ PK  id                        BIGSERIAL                               │  ║
║    │ FK  company_id                BIGINT        NOT NULL                 │  ║
║    │     email                     VARCHAR(255)  NOT NULL UNIQUE          │  ║
║    │     password_hash             VARCHAR(255)  NOT NULL                 │  ║
║    │     full_name                 VARCHAR(255)  NOT NULL                 │  ║
║    │     phone                     VARCHAR(30)                             │  ║
║    │     role                      user_role       NOT NULL DEFAULT 'customer'  ║
║    │     avatar_url                VARCHAR(500)                            │  ║
║    │     language                  VARCHAR(10)   DEFAULT 'es'             │  ║
║    │     timezone                  VARCHAR(50)   DEFAULT 'America/Mexico_City'║
║    │     last_login_at             TIMESTAMPTZ                             │  ║
║    │     failed_login_attempts     SMALLINT      DEFAULT 0                │  ║
║    │     locked_until              TIMESTAMPTZ                             │  ║
║    │     password_changed_at       TIMESTAMPTZ  DEFAULT NOW()             │  ║
║    │     requires_password_change  BOOLEAN       DEFAULT FALSE            │  ║
║    │     is_email_verified         BOOLEAN       DEFAULT FALSE            │  ║
║    │     email_verification_token  VARCHAR(100)                            │  ║
║    │     two_factor_enabled        BOOLEAN       DEFAULT FALSE            │  ║
║    │     two_factor_secret         VARCHAR(255)                            │  ║
║    │     is_active                 BOOLEAN       NOT NULL DEFAULT TRUE   │  ║
║    │     deactivated_at            TIMESTAMPTZ                             │  ║
║    │     deactivation_reason       VARCHAR(255)                            │  ║
║    │     metadata                  JSONB         DEFAULT '{}'             │  ║
║    │     created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()    │  ║
║    │     updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()    │  ║
║    └──────────────────────────────────────────────────────────────────────┘  ║
║                                        │                                      ║
║                                        │ 1                                    ║
║                                        │                                      ║
║                                        ▼                                      ║
║    ┌──────────────────────────────────────────────────────────────────────┐  ║
║    │                             COMPANIES                                │  ║
║    ├──────────────────────────────────────────────────────────────────────┤  ║
║    │ PK  id                        BIGSERIAL                               │  ║
║    │     name                      VARCHAR(255)  NOT NULL                 │  ║
║    │     slug                      VARCHAR(100)  UNIQUE NOT NULL          │  ║
║    │ PK  tax_id                   VARCHAR(50)   UNIQUE NOT NULL         │  ║
║    │     registration_number       VARCHAR(50)                             │  ║
║    │     legal_representative       VARCHAR(255)                            │  ║
║    │     address                   TEXT                                     │  ║
║    │     city                      VARCHAR(100)                             │  ║
║    │     state                     VARCHAR(100)                             │  ║
║    │     postal_code               VARCHAR(20)                              │  ║
║    │     country                   VARCHAR(100)  NOT NULL DEFAULT 'México'║
║    │     phone                     VARCHAR(30)                              │  ║
║    │     email                     VARCHAR(255)                             │  ║
║    │     website                   VARCHAR(255)                             │  ║
║    │     logo_url                  VARCHAR(500)                             │  ║
║    │     currency                  CHAR(3)       NOT NULL DEFAULT 'MXN'   │  ║
║    │     timezone                  VARCHAR(50)  NOT NULL DEFAULT 'America/Mexico_City'║
║    │     fiscal_year_start_month   SMALLINT      DEFAULT 1               │  ║
║    │     tax_regime                VARCHAR(50)                             │  ║
║    │     iva_rate                  DECIMAL(4,3)  DEFAULT 0.160           │  ║
║    │     default_payment_terms     VARCHAR(50)  DEFAULT 'net_30'         │  ║
║    │     max_fleet_size            INTEGER                                │  ║
║    │     fleet_count                INTEGER      DEFAULT 0                │  ║
║    │     metadata                   JSONB         DEFAULT '{}'            │  ║
║    │     is_active                 BOOLEAN       NOT NULL DEFAULT TRUE   │  ║
║    │     activated_at              TIMESTAMPTZ                             │  ║
║    │     deactivated_at            TIMESTAMPTZ                             │  ║
║    │     created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()   │  ║
║    │     updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()   │  ║
║    └──────────────────────────────────────────────────────────────────────┘  ║
║                                                                                ║
║    RELACIONES:                                                                  ║
║    ───────────                                                                  ║
║    USERS.company_id  ──────►  COMPANIES.id  (muchos a uno)                      ║
║    Cada USUARIO pertenece a UNA empresa (company_id)                              ║
║    Una empresa puede tener MUCHOS usuarios                                       ║
║                                                                                ║
║    COMPANIES.tax_id  ────►  UNIQUE CONSTRAINT  (identificación fiscal única)   ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

### 3.2 Módulo de Conductores

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                           MÓDULO: CONDUCTORES                                  ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║    ┌──────────────────────────────────────────────────────────────────────┐  ║
║    │                              DRIVERS                                  │  ║
║    ├──────────────────────────────────────────────────────────────────────┤  ║
║    │ PK  id                        BIGSERIAL                               │  ║
║    │ FK  user_id                   BIGINT        UNIQUE                   │  ║
║    │ FK  company_id                BIGINT        NOT NULL                 │  ║
║    │     employee_number            VARCHAR(50)   UNIQUE NOT NULL         │  ║
║    │     first_name                 VARCHAR(100)  NOT NULL                │  ║
║    │     middle_name                VARCHAR(100)                            │  ║
║    │     last_name                  VARCHAR(100)  NOT NULL                │  ║
║    │     second_last_name           VARCHAR(100)                            │  ║
║    │     date_of_birth              DATE                                    │  ║
║    │     gender                     VARCHAR(20)                             │  ║
║    │     curp                       VARCHAR(18)                             │  ║
║    │     rfc                        VARCHAR(13)                             │  ║
║    │     license_number             VARCHAR(50)   NOT NULL                │  ║
║    │     license_class              VARCHAR(10)   NOT NULL                │  ║
║    │     license_expiry             DATE           NOT NULL               │  ║
║    │     license_state              VARCHAR(100)                            │  ║
║    │     license_document_url       VARCHAR(500)                            │  ║
║    │     hire_date                  DATE           NOT NULL               │  ║
║    │     termination_date           DATE                                    │  ║
║    │     department                 VARCHAR(100)                            │  ║
║    │     position                   VARCHAR(100)                            │  ║
║    │     status                     VARCHAR(30)   NOT NULL DEFAULT 'active' ║
║    │     employment_type            VARCHAR(30)   DEFAULT 'full_time'      │  ║
║    │     emergency_contact_name     VARCHAR(255)                            │  ║
║    │     emergency_contact_phone    VARCHAR(30)                             │  ║
║    │     emergency_contact_relation VARCHAR(50)                             │  ║
║    │     blood_type                 VARCHAR(5)                              │  ║
║    │     allergies                  TEXT                                     │  ║
║    │     medical_conditions          TEXT                                    │  ║
║    │     medical_card_expiry        DATE                                    │  ║
║    │     photo_url                  VARCHAR(500)                            │  ║
║    │     address                    TEXT                                     │  ║
║    │     city                       VARCHAR(100)                             │  ║
║    │     state                      VARCHAR(100)                             │  ║
║    │     postal_code                VARCHAR(20)                              │  ║
║    │     base_branch_id             BIGINT         (FK a branches)           │  ║
║    │     shift_preference           VARCHAR(20)                             │  ║
║    │     home_terminal              VARCHAR(255)                            │  ║
║    │     salary                     DECIMAL(10,2)                            │  ║
║    │     hourly_rate                 DECIMAL(8,2)                            │  ║
║    │     rating                     DECIMAL(3,2)  DEFAULT 5.00             │  ║
║    │     total_trips                INTEGER       DEFAULT 0                │  ║
║    │     total_distance_km          DECIMAL(12,2) DEFAULT 0                │  ║
║    │     total_accidents             INTEGER       DEFAULT 0                │  ║
║    │     safety_violations           INTEGER       DEFAULT 0                │  ║
║    │     last_medical_exam          DATE                                    │  ║
║    │     next_medical_exam          DATE                                    │  ║
║    │     training_completed         BOOLEAN       DEFAULT FALSE            │  ║
║    │     training_expiry            DATE                                    │  ║
║    │     metadata                   JSONB         DEFAULT '{}'            │  ║
║    │     is_active                  BOOLEAN       NOT NULL DEFAULT TRUE   │  ║
║    │     created_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW()   │  ║
║    │     updated_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW()   │  ║
║    └──────────────────────────────────────────────────────────────────────┘  ║
║                                                                                ║
║    RELACIONES:                                                                  ║
║    ───────────                                                                  ║
║    DRIVERS.user_id    ────►  USERS.id         (uno a uno, opcional)            ║
║    DRIVERS.company_id ────►  COMPANIES.id     (muchos a uno)                  ║
║    DRIVERS.base_branch_id ──► BRANCHES.id     (muchos a uno, opcional)        ║
║                                                                                ║
║    RESTRICCIONES DE VALIDACIÓN:                                                ║
║    ──────────────────────────────                                              ║
║    • license_class IN ('A', 'B', 'C', 'D', 'E')                                ║
║    • rating BETWEEN 1.00 AND 5.00                                              ║
║    • license_expiry > CURRENT_DATE (conductor activo)                          ║
║    • hire_date <= CURRENT_DATE                                                 ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

### 3.3 Módulo de Vehículos y GPS

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                        MÓDULO: VEHÍCULOS Y GPS                                 ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║    ┌──────────────────────────────────────────────────────────────────────┐  ║
║    │                             VEHICLES                                  │  ║
║    ├──────────────────────────────────────────────────────────────────────┤  ║
║    │ PK  id                        BIGSERIAL                               │  ║
║    │ FK  company_id                BIGINT        NOT NULL                 │  ║
║    │ FK  branch_id                 BIGINT        (FK a branches)          │  ║
║    │ PK  vin                       VARCHAR(17)   UNIQUE NOT NULL         │  ║
║    │     license_plate             VARCHAR(20)   NOT NULL               │  ║
║    │     vehicle_type              vehicle_type  NOT NULL               │  ║
║    │     make                      VARCHAR(100)  NOT NULL                │  ║
║    │     model                     VARCHAR(100)  NOT NULL                │  ║
║    │     year                      SMALLINT      NOT NULL                │  ║
║    │     model_year                SMALLINT                                │  ║
║    │     color                     VARCHAR(50)                             │  ║
║    │     body_style                VARCHAR(50)                             │  ║
║    │     fuel_type                 VARCHAR(30)   NOT NULL DEFAULT 'diesel'║
║    │     transmission              VARCHAR(30)   NOT NULL DEFAULT 'manual'║
║    │     drive_configuration       VARCHAR(20)   DEFAULT '6x4'            │  ║
║    │     axles                     SMALLINT      NOT NULL DEFAULT 2      │  ║
║    │     wheelbase_cm              INTEGER                                │  ║
║    │     length_cm                 INTEGER                                │  ║
║    │     width_cm                  INTEGER                                │  ║
║    │     height_cm                 INTEGER                                │  ║
║    │     gross_weight_kg           DECIMAL(10,2)                          │  ║
║    │     curb_weight_kg            DECIMAL(10,2)                          │  ║
║    │     load_capacity_kg          DECIMAL(10,2)                          │  ║
║    │     volume_capacity_m3        DECIMAL(10,2)                          │  ║
║    │     tire_count                SMALLINT      NOT NULL DEFAULT 10    │  ║
║    │     tire_size                 VARCHAR(20)                             │  ║
║    │     tire_pressure_psi         DECIMAL(5,2)                           │  ║
║    │     fuel_capacity_l            DECIMAL(6,2)                          │  ║
║    │     fuel_efficiency_l_100km   DECIMAL(6,2)                           │  ║
║    │     status                    vehicle_status NOT NULL DEFAULT 'available'  ║
║    │     previous_status           vehicle_status                          │  ║
║    │     status_changed_at         TIMESTAMPTZ                              │  ║
║    │     status_reason             VARCHAR(255)                            │  ║
║    │     acquisition_date          DATE                                    │  ║
║    │     acquisition_cost          DECIMAL(12,2)                           │  ║
║    │     depreciation_method       VARCHAR(30)                             │  ║
║    │     useful_life_years          SMALLINT                                │  ║
║    │     salvage_value             DECIMAL(12,2)                            │  ║
║    │     current_km                BIGINT        DEFAULT 0                │  ║
║    │     last_service_km           BIGINT        DEFAULT 0                │  ║
║    │     next_service_km           BIGINT                                  │  ║
║    │     last_service_date         DATE                                    │  ║
║    │     next_service_date         DATE                                    │  ║
║    │     average_fuel_consumption  DECIMAL(6,2)                            │  ║
║    │     insurance_policy          VARCHAR(100)                            │  ║
║    │     insurance_provider        VARCHAR(100)                            │  ║
║    │     insurance_expiry          DATE                                    │  ║
║    │     insurance_document_url    VARCHAR(500)                            │  ║
║    │     annual_inspection_expiry  DATE                                    │  ║
║    │     emissions_cert_expiry     DATE                                    │  ║
║    │     license_plate_expiry      DATE                                    │  ║
║    │     image_url                 VARCHAR(500)                            │  ║
║    │     images                    JSONB         DEFAULT '[]'             │  ║
║    │     documents                 JSONB         DEFAULT '[]'             │  ║
║    │     metadata                  JSONB         DEFAULT '{}'             │  ║
║    │     is_active                 BOOLEAN       NOT NULL DEFAULT TRUE   │  ║
║    │     created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()   │  ║
║    │     updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()   │  ║
║    └──────────────────────────────────────────────────────────────────────┘  ║
║                                        │                                       ║
║                                        │ 1                                     ║
║                                        │                                       ║
║                                        ▼                                       ║
║    ┌──────────────────────────────────────────────────────────────────────┐  ║
║    │                          GPS_LOCATIONS                               │  ║
║    ├──────────────────────────────────────────────────────────────────────┤  ║
║    │ PK  id                        BIGSERIAL                               │  ║
║    │ FK  vehicle_id                BIGINT        NOT NULL                 │  ║
║    │ FK  trip_id                   BIGINT        (FK a trips, opcional)   │  ║
║    │ FK  driver_id                 BIGINT        (FK a drivers, opcional) │  ║
║    │     device_id                 VARCHAR(100)                            │  ║
║    │     provider                  VARCHAR(50)                             │  ║
║    │     recorded_at               TIMESTAMPTZ   NOT NULL                  │  ║
║    │     latitude                  DECIMAL(10,8) NOT NULL                │  ║
║    │     longitude                 DECIMAL(11,8) NOT NULL                │  ║
║    │     altitude_m                DECIMAL(8,2)                            │  ║
║    │     accuracy_m                DECIMAL(6,2)                            │  ║
║    │     speed_kmh                 DECIMAL(6,2)                            │  ║
║    │     heading_deg               DECIMAL(5,2)                            │  ║
║    │     speed_limit_kmh           INTEGER                                  │  ║
║    │     satellites                SMALLINT                                │  ║
║    │     hdop                      DECIMAL(4,2)                             │  ║
║    │     vdop                      DECIMAL(4,2)                             │  ║
║    │     battery_level             DECIMAL(4,1)                             │  ║
║    │     signal_strength           SMALLINT                                │  ║
║    │     fuel_level_pct            DECIMAL(5,2)                             │  ║
║    │     engine_rpm                INTEGER                                  │  ║
║    │     engine_temp_c             DECIMAL(5,2)                            │  ║
║    │     odometer_km               BIGINT                                   │  ║
║    │     engine_hours              DECIMAL(8,2)                            │  ║
║    │     idle_time_min             INTEGER                                  │  ║
║    │     moving_time_min           INTEGER                                  │  ║
║    │     stop_time_min             INTEGER                                  │  ║
║    │     distance_km               DECIMAL(8,2)                             │  ║
║    │     geofence_id               BIGINT                                   │  ║
║    │     geofence_event            VARCHAR(30)                              │  ║
║    │     event_type                VARCHAR(50)                              │  ║
║    │     event_data                JSONB         DEFAULT '{}'              │  ║
║    │     raw_data                  JSONB         DEFAULT '{}'              │  ║
║    │     processing_status         VARCHAR(20)  DEFAULT 'processed'       │  ║
║    │     created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()   │  ║
║    └──────────────────────────────────────────────────────────────────────┘  ║
║                                                                                ║
║    RELACIONES:                                                                  ║
║    ───────────                                                                  ║
║    VEHICLES.company_id ────► COMPANIES.id    (muchos a uno)                     ║
║    VEHICLES.branch_id  ────► BRANCHES.id     (muchos a uno, opcional)          ║
║    GPS_LOCATIONS.vehicle_id ──► VEHICLES.id  (muchos a uno)                    ║
║    GPS_LOCATIONS.trip_id  ────► TRIPS.id     (muchos a uno, opcional)          ║
║    GPS_LOCATIONS.driver_id ───► DRIVERS.id   (muchos a uno, opcional)          ║
║                                                                                ║
║    RESTRICCIONES DE VALIDACIÓN:                                                ║
║    ──────────────────────────────                                              ║
║    • LENGTH(vin) = 17                                                          ║
║    • vin FORMAT: '^[A-HJ-NPR-Z0-9]{17}$'                                      ║
║    • year BETWEEN 1980 AND CURRENT_YEAR + 1                                     ║
║    • latitude BETWEEN -90 AND 90                                               ║
║    • longitude BETWEEN -180 AND 180                                            ║
║    • heading_deg BETWEEN 0 AND 360                                              ║
║    • speed_kmh >= 0                                                            ║
║    • fuel_level_pct BETWEEN 0 AND 100                                           ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

### 3.4 Módulo de Viajes, Órdenes y Servicios

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                     MÓDULO: VIAJES, ÓRDENES Y SERVICIOS                        ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║    ┌──────────────────────────────────────────────────────────────────────┐  ║
║    │                               TRIPS                                   │  ║
║    ├──────────────────────────────────────────────────────────────────────┤  ║
║    │ PK  id                        BIGSERIAL                               │  ║
║    │ FK  company_id                BIGINT        NOT NULL                 │  ║
║    │ FK  vehicle_id                BIGINT        NOT NULL                 │  ║
║    │ FK  driver_id                  BIGINT        NOT NULL                 │  ║
║    │ FK  co_driver_id              BIGINT        (FK a drivers, opcional)│  ║
║    │ FK  order_id                   BIGINT        (FK a orders)           │  ║
║    │ PK  trip_number               VARCHAR(50)   UNIQUE NOT NULL         │  ║
║    │     trip_type                  VARCHAR(30)   NOT NULL DEFAULT 'delivery'║
║    │     status                     VARCHAR(30)   NOT NULL DEFAULT 'scheduled'║
║    │     priority                   order_priority DEFAULT 'normal'        ║
║    │     origin_branch_id           BIGINT        (FK a branches)          │  ║
║    │     destination_branch_id      BIGINT        (FK a branches)          │  ║
║    │     origin_address             TEXT          NOT NULL                │  ║
║    │     origin_city                VARCHAR(100)  NOT NULL                 │  ║
║    │     origin_state               VARCHAR(100)                            │  ║
║    │     origin_country             VARCHAR(100)  NOT NULL                 │  ║
║    │     origin_postal_code         VARCHAR(20)                             │  ║
║    │     origin_lat                 DECIMAL(10,8)                           │  ║
║    │     origin_lng                 DECIMAL(11,8)                           │  ║
║    │     destination_address        TEXT          NOT NULL                │  ║
║    │     destination_city           VARCHAR(100)  NOT NULL                │  ║
║    │     destination_state          VARCHAR(100)                            │  ║
║    │     destination_country        VARCHAR(100)  NOT NULL                │  ║
║    │     destination_postal_code    VARCHAR(20)                             │  ║
║    │     dest_lat                   DECIMAL(10,8)                           │  ║
║    │     dest_lng                   DECIMAL(11,8)                           │  ║
║    │     waypoints                  JSONB         DEFAULT '[]'             │  ║
║    │     scheduled_start            TIMESTAMPTZ   NOT NULL                │  ║
║    │     scheduled_end              TIMESTAMPTZ   NOT NULL                │  ║
║    │     actual_start               TIMESTAMPTZ                             │  ║
║    │     actual_end                 TIMESTAMPTZ                             │  ║
║    │     start_odometer_km          BIGINT                                   │  ║
║    │     end_odometer_km            BIGINT                                   │  ║
║    │     planned_distance_km        DECIMAL(10,2)                            │  ║
║    │     actual_distance_km         DECIMAL(10,2)                            │  ║
║    │     planned_duration_min       INTEGER                                  │  ║
║    │     actual_duration_min       INTEGER                                  │  ║
║    │     cargo_description          TEXT                                     │  ║
║    │     cargo_type                 VARCHAR(100)                             │  ║
║    │     cargo_weight_kg            DECIMAL(10,2)                            │  ║
║    │     cargo_volume_m3            DECIMAL(10,2)                            │  ║
║    │     cargo_unit_count           INTEGER                                  │  ║
║    │     refrigeration_required     BOOLEAN       DEFAULT FALSE              ║
║    │     min_temperature_c          DECIMAL(5,2)                             │  ║
║    │     max_temperature_c          DECIMAL(5,2)                             │  ║
║    │     hazardous_cargo            BOOLEAN       DEFAULT FALSE             ║
║    │     hazardous_class            VARCHAR(20)                              │  ║
║    │     fuel_consumed_l            DECIMAL(8,2)                             │  ║
║    │     fuel_cost                  DECIMAL(10,2)                            │  ║
║    │     average_speed_kmh          DECIMAL(5,2)                             │  ║
║    │     max_speed_kmh              DECIMAL(5,2)                             │  ║
║    │     start_fuel_level           DECIMAL(5,2)                             │  ║
║    │     end_fuel_level             DECIMAL(5,2)                             │  ║
║    │     fuel_added_l               DECIMAL(8,2)                             │  ║
║    │     tolls_cost                 DECIMAL(10,2)  DEFAULT 0                 ║
║    │     parking_cost               DECIMAL(10,2)  DEFAULT 0                 ║
║    │     other_costs                DECIMAL(10,2)  DEFAULT 0                 ║
║    │     total_trip_cost            DECIMAL(12,2)                            │  ║
║    │     invoiced_amount            DECIMAL(12,2)                            │  ║
║    │     profit_margin              DECIMAL(10,2)                            │  ║
║    │     driver_payment_amount      DECIMAL(10,2)                            │  ║
║    │     notes                      TEXT                                     │  ║
║    │     customer_notes             TEXT                                     │  ║
║    │     internal_comments          TEXT                                     │  ║
║    │     rating                     DECIMAL(3,2)                              │  ║
║    │     customer_feedback          TEXT                                     │  ║
║    │     driver_rating              DECIMAL(3,2)                             │  ║
║    │     on_time_performance        BOOLEAN                                  │  ║
║    │     delay_minutes              INTEGER                                  │  ║
║    │     delay_reason               VARCHAR(255)                             │  ║
║    │     loading_start              TIMESTAMPTZ                              │  ║
║    │     loading_end                TIMESTAMPTZ                              │  ║
║    │     unloading_start            TIMESTAMPTZ                              │  ║
║    │     unloading_end              TIMESTAMPTZ                              │  ║
║    │     proof_of_delivery_url     VARCHAR(500)                             │  ║
║    │     signed_receiver_name       VARCHAR(255)                             │  ║
║    │     signed_at                  TIMESTAMPTZ                              │  ║
║    │     metadata                  JSONB         DEFAULT '{}'              │  ║
║    │     created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()    │  ║
║    │     updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()   │  ║
║    └──────────────────────────────────────────────────────────────────────┘  ║
║                                                                                ║
║    RELACIONES:                                                                  ║
║    ───────────                                                                  ║
║    TRIPS.company_id     ────► COMPANIES.id  (muchos a uno)                       ║
║    TRIPS.vehicle_id    ────► VEHICLES.id  (muchos a uno)                        ║
║    TRIPS.driver_id     ────► DRIVERS.id   (muchos a uno)                        ║
║    TRIPS.co_driver_id  ────► DRIVERS.id   (muchos a uno, opcional)             ║
║    TRIPS.order_id      ────► ORDERS.id    (muchos a uno, opcional)              ║
║    TRIPS.origin_branch_id ──► BRANCHES.id (muchos a uno, opcional)             ║
║    TRIPS.dest_branch_id  ──► BRANCHES.id (muchos a uno, opcional)             ║
║                                                                                ║
║    NOTA: Un viaje pertenece a una empresa, es operado por un vehículo y         ║
║          conductor específicos, y puede estar asociado a una orden de          ║
║          servicio que representa la petición del cliente.                       ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

### 3.5 Módulo de Ofertas y Subastas

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                        MÓDULO: OFERTAS Y SUBASTAS                              ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║         ┌────────────────────────────────────────────────────────────────┐     ║
║         │                            OFFERS                             │     ║
║         ├────────────────────────────────────────────────────────────────┤     ║
║         │ PK  id                        BIGSERIAL                        │     ║
║         │ FK  company_id                 BIGINT        NOT NULL          │     ║
║         │ FK  trip_id                    BIGINT        NOT NULL          │     ║
║         │ PK  offer_number               VARCHAR(50)   UNIQUE NOT NULL   │     ║
║         │     status                     offer_status NOT NULL           │     ║
║         │     price                      DECIMAL(12,2) NOT NULL          │     ║
║         │     currency                  CHAR(3)       NOT NULL DEFAULT 'MXN' ║
║         │     valid_until               TIMESTAMPTZ                         │     ║
║         │     estimated_distance_km     DECIMAL(10,2)                      │     ║
║         │     estimated_duration_hrs    DECIMAL(6,2)                        │     ║
║         │     vehicle_type_offered      VARCHAR(50)                        │     ║
║         │     vehicle_id                BIGINT        (FK a vehicles)     │     ║
║         │     driver_id                 BIGINT        (FK a drivers)      │     ║
║         │     includes_fuel              BOOLEAN       DEFAULT TRUE       │     ║
║         │     includes_tolls             BOOLEAN       DEFAULT FALSE      │     ║
║         │     includes_insurance         BOOLEAN       DEFAULT TRUE       │     ║
║         │     payment_terms             VARCHAR(50)  DEFAULT 'net_30'     │     ║
║         │     coverage_area              TEXT                                │     ║
║         │     response_time_hrs         DECIMAL(5,2)                       │     ║
║         │     service_terms              TEXT                                │     ║
║         │     notes                     TEXT                                │     ║
║         │     awards_count              INTEGER       DEFAULT 0           │     ║
║         │     cancellation_rate         DECIMAL(4,3) DEFAULT 0            │     ║
║         │     rating                    DECIMAL(3,2)  DEFAULT 5.00         │     ║
║         │     rank                      INTEGER                             │     ║
║         │     submitted_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()║
║         │     reviewed_at               TIMESTAMPTZ                         │     ║
║         │     accepted_at              TIMESTAMPTZ                         │     ║
║         │     rejected_at              TIMESTAMPTZ                         │     ║
║         │     withdrawn_at             TIMESTAMPTZ                         │     ║
║         │     metadata                 JSONB        DEFAULT '{}'          │     ║
║         │     created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW() │     ║
║         │     updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()│     ║
║         └────────────────────────────────────────────────────────────────┘     ║
║                    │                                   │                       ║
║                    │ N                                 │ 1                      ║
║                    ▼                                   ▼                       ║
║    ┌─────────────────────────────────┐    ┌───────────────────────────┐    ║
║    │           AUCTIONS              │    │           TRIPS            │    ║
║    ├─────────────────────────────────┤    ├───────────────────────────┤    ║
║    │ PK  id                           │    │ PK  id                    │    ║
║    │ FK  company_id                   │    │ FK  company_id           │    ║
║    │ FK  trip_id                      │    │ FK  vehicle_id           │    ║
║    │ PK  auction_number              │    │ FK  driver_id            │    ║
║    │     title                       │    │    trip_number           │    ║
║    │     description                 │    │    status                │    ║
║    │     status                      │    │    ... (ver diagrama TRIPS) ║
║    │     auction_type                │    └───────────────────────────┘    ║
║    │     visibility                  │                                      ║
║    │     invited_companies           │         ┌───────────────────────────┐║
║    │     start_time                  │         │         BIDS             │║
║    │     end_time                    │         ├───────────────────────────┤║
║    │     original_end_time           │         │ PK  id                   │║
║    │     extension_threshold_secs    │         │ FK  auction_id           │║
║    │     extension_count            │         │ FK  company_id           │║
║    │     max_extensions             │         │     amount              │║
║    │     min_bid                    │         │     created_at          │║
║    │     max_bid                    │         │     status              │║
║    │     reserve_price              │         └───────────────────────────┘║
║    │     current_best_bid            │                   │                  ║
║    │     bid_count                   │                   │ N                ║
║    │     unique_bidders             │                   ▼                  ║
║    │     winner_company_id           │    ┌───────────────────────────┐   ║
║    │     winning_bid_id              │    │        COMPANIES          │   ║
║    │     winning_amount             │    ├───────────────────────────┤   ║
║    │     auction_result_notes        │    │ PK  id                    │   ║
║    │     auto_assign_winner          │    │    name                  │   ║
║    │     notification_preference     │    │    tax_id                │   ║
║    │     metadata                    │    │    ... (ver diagrama)    │   ║
║    └─────────────────────────────────┘    └───────────────────────────┘   ║
║                                                                                ║
║    RELACIONES:                                                                  ║
║    ───────────                                                                  ║
║    OFFERS.company_id ─────► COMPANIES.id  (muchos a uno)                        ║
║    OFFERS.trip_id   ─────► TRIPS.id      (muchos a uno)                         ║
║    OFFERS.vehicle_id────► VEHICLES.id    (muchos a uno, opcional)               ║
║    OFFERS.driver_id ─────► DRIVERS.id    (muchos a uno, opcional)              ║
║    AUCTIONS.company_id ───► COMPANIES.id  (muchos a uno)                        ║
║    AUCTIONS.trip_id  ────► TRIPS.id      (muchos a uno, opcional)              ║
║    AUCTIONS.winner_company_id ──► COMPANIES.id (muchos a uno, opcional)        ║
║    AUCTIONS.winning_bid_id ───► BIDS.id  (muchos a uno, opcional)              ║
║    BIDS.auction_id  ─────► AUCTIONS.id   (muchos a uno)                        ║
║    BIDS.company_id  ─────► COMPANIES.id  (muchos a uno)                        ║
║                                                                                ║
║    NOTA: Las ofertas son竞争力的 - múltiples empresas pueden ofertar por       ║
║          el mismo viaje. Las subastas pueden ser públicas o privadas.          ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

### 3.6 Módulo de Pagos y Ratings

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                        MÓDULO: PAGOS Y CALIFICACIONES                          ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║    ┌──────────────────────────────────────────────────────────────────────┐  ║
║    │                             PAYMENTS                                  │  ║
║    ├──────────────────────────────────────────────────────────────────────┤  ║
║    │ PK  id                        BIGSERIAL                               │  ║
║    │ FK  company_id                BIGINT        NOT NULL                 │  ║
║    │ FK  trip_id                   BIGINT        (FK a trips)            │  ║
║    │ FK  order_id                  BIGINT        (FK a orders)            │  ║
║    │ FK  invoice_id                BIGINT        (FK a invoices)          │  ║
║    │ PK  payment_number            VARCHAR(50)   UNIQUE NOT NULL         │  ║
║    │     payment_type              VARCHAR(30)   NOT NULL                 │  ║
║    │     direction                 VARCHAR(10)   NOT NULL                 │  ║
║    │     amount                    DECIMAL(12,2) NOT NULL                │  ║
║    │     currency                  CHAR(3)       NOT NULL DEFAULT 'MXN'  │  ║
║    │     exchange_rate             DECIMAL(12,6) DEFAULT 1.000000       │  ║
║    │     amount_in_base_currency   DECIMAL(12,2)                         │  ║
║    │     status                    payment_status NOT NULL DEFAULT 'pending' ║
║    │     payment_method            VARCHAR(30)                            │  ║
║    │     payment_gateway           VARCHAR(50)                            │  ║
║    │     gateway_transaction_id    VARCHAR(255)                           │  ║
║    │     gateway_response          JSONB                                   │  ║
║    │     authorization_code        VARCHAR(100)                            │  ║
║    │     reference_number          VARCHAR(100)                            │  ║
║    │     bank_name                 VARCHAR(100)                            │  ║
║    │     bank_account_last_digits  VARCHAR(10)                             │  ║
║    │     scheduled_date           DATE                                    │  ║
║    │     processed_at              TIMESTAMPTZ                              │  ║
║    │     completed_at              TIMESTAMPTZ                              │  ║
║    │     failed_at                 TIMESTAMPTZ                              │  ║
║    │     failure_reason            VARCHAR(255)                             │  ║
║    │     retry_count               SMALLINT      DEFAULT 0                │  ║
║    │     max_retries               SMALLINT      DEFAULT 3                │  ║
║    │     next_retry_at             TIMESTAMPTZ                              │  ║
║    │     refund_id                 BIGINT        (FK a payments)           │  ║
║    │     refunded_amount          DECIMAL(12,2)                            │  ║
║    │     refund_reason             VARCHAR(255)                            │  ║
║    │     notes                     TEXT                                     │  ║
║    │     receipt_url               VARCHAR(500)                             │  ║
║    │     tax_withheld              DECIMAL(12,2) DEFAULT 0                │  ║
║    │     metadata                  JSONB         DEFAULT '{}'             │  ║
║    │     created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()   │  ║
║    │     updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()   │  ║
║    └──────────────────────────────────────────────────────────────────────┘  ║
║                                        │                                      ║
║                                        │ 1                                    ║
║                                        ▼                                      ║
║    ┌──────────────────────────────────────────────────────────────────────┐  ║
║    │                             RATINGS                                   │  ║
║    ├──────────────────────────────────────────────────────────────────────┤  ║
║    │ PK  id                        BIGSERIAL                               │  ║
║    │ FK  trip_id                   BIGINT        NOT NULL                 │  ║
║    │ FK  rating_from_user_id       BIGINT        NOT NULL                │  ║
║    │ FK  rating_from_driver_id     BIGINT        (FK a drivers)          │  ║
║    │ FK  rating_from_company_id    BIGINT        (FK a companies)        │  ║
║    │ FK  rating_to_user_id         BIGINT        (FK a users)            │  ║
║    │ FK  rating_to_driver_id       BIGINT        (FK a drivers)          │  ║
║    │ FK  rating_to_company_id      BIGINT        (FK a companies)        │  ║
║    │     rating_type               VARCHAR(30)   NOT NULL                 │  ║
║    │     overall_score              DECIMAL(3,2) NOT NULL                │  ║
║    │     punctuality_score         DECIMAL(3,2)                           │  ║
║    │     communication_score       DECIMAL(3,2)                           │  ║
║    │     condition_score           DECIMAL(3,2)                           │  ║
║    │     professionalism_score     DECIMAL(3,2)                           │  ║
║    │     value_score               DECIMAL(3,2)                           │  ║
║    │     comment                   TEXT                                    │  ║
║    │     pros                      TEXT                                    │  ║
║    │     cons                      TEXT                                    │  ║
║    │     response_comment          TEXT                                    │  ║
║    │     responded_at              TIMESTAMPTZ                              │  ║
║    │     is_public                 BOOLEAN       DEFAULT TRUE             │  ║
║    │     is_verified              BOOLEAN       DEFAULT TRUE             │  ║
║    │     helpful_count             INTEGER       DEFAULT 0                │  ║
║    │     report_count              INTEGER       DEFAULT 0                │  ║
║    │     is_hidden                 BOOLEAN       DEFAULT FALSE            │  ║
║    │     hidden_reason             VARCHAR(255)                            │  ║
║    │     metadata                  JSONB         DEFAULT '{}'             │  ║
║    │     created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()  │  ║
║    │     updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()  │  ║
║    └──────────────────────────────────────────────────────────────────────┘  ║
║                                                                                ║
║    RELACIONES:                                                                  ║
║    ───────────                                                                  ║
║    PAYMENTS.company_id ──────► COMPANIES.id  (muchos a uno)                   ║
║    PAYMENTS.trip_id  ───────► TRIPS.id      (muchos a uno, opcional)          ║
║    PAYMENTS.order_id ───────► ORDERS.id     (muchos a uno, opcional)          ║
║    PAYMENTS.invoice_id ──────► INVOICES.id  (muchos a uno, opcional)          ║
║    PAYMENTS.refund_id ───────► PAYMENTS.id   (muchos a uno, auto-referencia)  ║
║                                                                                ║
║    RATINGS.trip_id  ─────────► TRIPS.id     (muchos a uno)                    ║
║    RATINGS.rating_from_user_id ────► USERS.id    (muchos a uno)              ║
║    RATINGS.rating_to_user_id ──────► USERS.id    (muchos a uno)              ║
║    RATINGS.rating_from_driver_id ──► DRIVERS.id  (muchos a uno)              ║
║    RATINGS.rating_to_driver_id ────► DRIVERS.id  (muchos a uno)              ║
║    RATINGS.rating_from_company_id ─► COMPANIES.id (muchos a uno)             ║
║    RATINGS.rating_to_company_id ───► COMPANIES.id (muchos a uno)             ║
║                                                                                ║
║    NOTA: Las calificaciones son bidireccionales - un usuario puede            ║
║          calificar a un conductor después de un viaje, y el conductor          ║
║          puede calificar al usuario de vuelta.                                 ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

### 3.7 Módulo de Notificaciones

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                        MÓDULO: SISTEMA DE NOTIFICACIONES                       ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║    ┌──────────────────────────────────────────────────────────────────────┐  ║
║    │                          NOTIFICATIONS                               │  ║
║    ├──────────────────────────────────────────────────────────────────────┤  ║
║    │ PK  id                        BIGSERIAL                               │  ║
║    │ FK  user_id                   BIGINT        (FK a users)             │  ║
║    │ FK  company_id                BIGINT        (FK a companies)         │  ║
║    │ FK  driver_id                 BIGINT        (FK a drivers)           │  ║
║    │ FK  trip_id                   BIGINT        (FK a trips)             │  ║
║    │ FK  order_id                  BIGINT        (FK a orders)           │  ║
║    │     notification_type         VARCHAR(50)  NOT NULL                 │  ║
║    │     channel                   VARCHAR(20)  NOT NULL                 │  ║
║    │     priority                  VARCHAR(20)  DEFAULT 'normal'         │  ║
║    │     status                    notification_status NOT NULL         │  ║
║    │     title                     VARCHAR(255) NOT NULL                 │  ║
║    │     body                      TEXT         NOT NULL                 │  ║
║    │     summary                   VARCHAR(500)                          │  ║
║    │     data                      JSONB        DEFAULT '{}'             │  ║
║    │     action_url               VARCHAR(500)                           │  ║
║    │     action_label             VARCHAR(100)                           │  ║
║    │     image_url                VARCHAR(500)                           │  ║
║    │     email_to                  VARCHAR(255)                           │  ║
║    │     email_cc                  VARCHAR(255)                           │  ║
║    │     email_bcc                 VARCHAR(255)                           │  ║
║    │     email_subject             VARCHAR(255)                           │  ║
║    │     email_template_id         VARCHAR(100)                           │  ║
║    │     email_rendered_content    TEXT                                    │  ║
║    │     sms_to                    VARCHAR(30)                            │  ║
║    │     sms_provider              VARCHAR(50)                            │  ║
║    │     sms_message_id            VARCHAR(100)                           │  ║
║    │     push_device_tokens        JSONB        DEFAULT '[]'             │  ║
║    │     push_provider              VARCHAR(50)                            │  ║
║    │     push_message_id           VARCHAR(100)                           │  ║
║    │     scheduled_at              TIMESTAMPTZ                              │  ║
║    │     sent_at                   TIMESTAMPTZ                              │  ║
║    │     delivered_at              TIMESTAMPTZ                              │  ║
║    │     read_at                   TIMESTAMPTZ                              │  ║
║    │     clicked_at                TIMESTAMPTZ                              │  ║
║    │     failed_at                 TIMESTAMPTZ                              │  ║
║    │     failure_code              VARCHAR(50)                             │  ║
║    │     failure_message           VARCHAR(255)                            │  ║
║    │     retry_count               SMALLINT      DEFAULT 0                │  ║
║    │     expires_at               TIMESTAMPTZ                              │  ║
║    │     is_read                   BOOLEAN       DEFAULT FALSE          │  ║
║    │     is_archived               BOOLEAN       DEFAULT FALSE          │  ║
║    │     is_deleted                BOOLEAN       DEFAULT FALSE          │  ║
║    │     deleted_at                TIMESTAMPTZ                              │  ║
║    │     metadata                  JSONB         DEFAULT '{}'           │  ║
║    │     created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()  │  ║
║    │     updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()  │  ║
║    └──────────────────────────────────────────────────────────────────────┘  ║
║                                                                                ║
║    RELACIONES:                                                                  ║
║    ───────────                                                                  ║
║    NOTIFICATIONS.user_id   ──────► USERS.id     (muchos a uno, opcional)     ║
║    NOTIFICATIONS.company_id ─────► COMPANIES.id (muchos a uno, opcional)     ║
║    NOTIFICATIONS.driver_id ───────► DRIVERS.id   (muchos a uno, opcional)     ║
║    NOTIFICATIONS.trip_id   ───────► TRIPS.id     (muchos a uno, opcional)    ║
║    NOTIFICATIONS.order_id  ───────► ORDERS.id    (muchos a uno, opcional)    ║
║                                                                                ║
║    FLUJO DE ESTADO:                                                             ║
║    ───────────────                                                              ║
║                                                                                 ║
║         ┌─────────┐    send     ┌──────┐    deliver    ┌──────────┐   read   ┌──────┐
║    ──► │ CREATED │ ────────►  │ SENT │ ────────►    │ DELIVERED │ ─────►  │ READ │
║         └─────────┘            └──────┘              └──────────┘          └──────┘
║              │                    │                       │                    ║
║              │ fail              │ fail                  │ fail               ║
║              ▼                   ▼                       ▼                    ║
║         ┌─────────┐        ┌─────────┐             ┌──────────┐             ║
║         │ FAILED  │        │ FAILED  │             │  FAILED  │             ║
║         └─────────┘        └─────────┘             └──────────┘             ║
║                                                                                ║
║    CANALES SOPORTADOS:                                                          ║
║    ───────────────────                                                          ║
║    • in_app   → Notificación dentro de la aplicación (badge, lista)            ║
║    • email    → Correo electrónico via SMTP o API de proveedor                ║
║    • sms      → Mensaje de texto via gateway (Twilio, Nexmo)                  ║
║    • push     → Push notification via FCM/APNS                                ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

---

## 4. Mapa de Relaciones — Tabla de Cardinalidades

La siguiente tabla resume todas las relaciones entre entidades del sistema Spottruck:

| Entidad A | Relación | Entidad B | Tipo | Descripción de la Relación |
|-----------|----------|-----------|------|---------------------------|
| `USERS` | принадлежит к | `COMPANIES` | N:1 | Un usuario pertenece a una empresa |
| `COMPANIES` | имеет | `USERS` | 1:N | Una empresa tiene múltiples usuarios |
| `USERS` | ассоциирован с | `DRIVERS` | 1:1 | Un usuario puede estar asociado a un conductor |
| `DRIVERS` | принадлежит к | `COMPANIES` | N:1 | Un conductor pertenece a una empresa |
| `COMPANIES` | имеет | `DRIVERS` | 1:N | Una empresa tiene múltiples conductores |
| `DRIVERS` | привязан к | `USERS` | 1:1 | Cada conductor tiene un usuario de login |
| `COMPANIES` | имеет | `VEHICLES` | 1:N | Una empresa posee múltiples vehículos |
| `VEHICLES` | принадлежит | `COMPANIES` | N:1 | Un vehículo pertenece a una empresa |
| `VEHICLES` | присвоен | `BRANCHES` | N:1 | Un vehículo está asignado a una sucursal |
| `BRANCHES` | принадлежит | `COMPANIES` | N:1 | Una sucursal pertenece a una empresa |
| `DRIVERS` | привязан | `BRANCHES` | N:1 | Un conductor tiene una sucursal base |
| `TRIPS` | присвоен | `VEHICLES` | N:1 | Un viaje usa un vehículo específico |
| `TRIPS` | выполнен | `DRIVERS` | N:1 | Un viaje es realizado por un conductor |
| `TRIPS` | имеет | `ORDERS` | 1:1 | Un viaje puede estar asociado a una orden |
| `TRIPS` | управляется | `AUCTIONS` | 1:1 | Un viaje puede tener una subasta (opcional) |
| `OFFERS` | отвечает на | `TRIPS` | N:1 | Múltiples ofertas pueden responder a un viaje |
| `OFFERS` | подана | `COMPANIES` | N:1 | Una oferta pertenece a una empresa |
| `AUCTIONS` | имеет | `BIDS` | 1:N | Una subasta recibe múltiples ofertas |
| `BIDS` | подана | `COMPANIES` | N:1 | Una oferta pertenece a una empresa |
| `PAYMENTS` | связано с | `TRIPS` | N:1 | Un pago puede estar asociado a un viaje |
| `PAYMENTS` | связано с | `ORDERS` | N:1 | Un pago puede estar asociado a una orden |
| `PAYMENTS` | принадлежит | `COMPANIES` | N:1 | Un pago pertenece a una empresa |
| `RATINGS` | относится к | `TRIPS` | N:1 | Una calificación pertenece a un viaje |
| `RATINGS` | отправитель | `USERS` | N:1 | La calificación es enviada por un usuario |
| `RATINGS` | получатель | `DRIVERS` | N:1 | La calificación es hacia un conductor |
| `NOTIFICATIONS` | отправлено | `USERS` | N:1 | Una notificación es para un usuario |
| `NOTIFICATIONS` | связано с | `TRIPS` | N:1 | Notificación puede pertenecer a un viaje |
| `NOTIFICATIONS` | связано с | `ORDERS` | N:1 | Notificación puede pertenecer a una orden |
| `GPS_LOCATIONS` | принадлежит | `VEHICLES` | N:1 | GPS point pertenece a un vehículo |
| `GPS_LOCATIONS` | связано с | `TRIPS` | N:1 | GPS point puede estar en un viaje activo |
| `GPS_LOCATIONS` | связано с | `DRIVERS` | N:1 | GPS point puede estar asociado a un conductor |

---

## 5. Modelo de Datos Simplificado — Vista de Dependencias

Este diagrama simplificado muestra las dependencias jerárquicas entre tablas, útil para entender el modelo de multi-tenancy y cómo los datos se organizan por empresa.

```
SPOTTRUCK - JERARQUÍA DE DATOS Y DEPENDENCIAS
===============================================

EMPRESA (COMPANIES) — RAÍZ DE MULTI-TENANCY
│
├── USUARIOS (USERS)
│   └── Cada usuario pertenece a una empresa
│
├── CONDUCTORES (DRIVERS)
│   ├── Pertenecen a una empresa
│   └── Opcionalmente vinculados a usuario de autenticación
│
├── VEHÍCULOS (VEHICLES)
│   ├── Pertenecen a una empresa
│   └── Opcionalmente asignados a una sucursal
│
├── SUCURSALES (BRANCHES)
│   └── Pertenecen a una empresa
│
├── ÓRDENES (ORDERS)
│   ├── Pertenecen a una empresa
│   └── Vinculadas a un cliente
│
├── VIAJES (TRIPS)
│   ├── Pertenecen a una empresa
│   ├── Asignados a vehículo y conductor
│   └── Opcionalmente vinculados a orden
│
├── OFERTAS (OFFERS)
│   ├── Pertenecen a una empresa
│   └── Responden a un viaje
│
├── SUBASTAS (AUCTIONS)
│   ├── Pertenecen a una empresa (creador)
│   └── Pueden estar asociadas a un viaje
│
├── OFERTAS DE SUBASTA (BIDS)
│   └── Pertenecen a una empresa (oferente)
│
├── PAGOS (PAYMENTS)
│   └── Vinculados a empresa procesadora
│
├── CALIFICACIONES (RATINGS)
│   ├── Vinculadas a viaje
│   └──双向: calificaciones entre usuarios/conductores
│
└── NOTIFICACIONES (NOTIFICATIONS)
    └── Pueden estar asociadas a usuario, conductor, viaje u orden


NOTA: company_id ES EL CAMPO DE MULTI-TENANCY EN TODAS LAS TABLAS PRINCIPALES.
      ROW LEVEL SECURITY (RLS) FILTRA DATOS POR company_id AUTOMÁTICAMENTE.
```

---

## 6. Claves Primarias y Foráneas — Resumen Técnico

Este resumen muestra todas las claves primarias (PK) y foráneas (FK) del sistema para referencia rápida:

| Tabla | PK | FK References | Unique Constraints |
|-------|-----|--------------|-------------------|
| `users` | `id` | `companies(id)` | `email` |
| `companies` | `id` | — | `tax_id`, `slug` |
| `drivers` | `id` | `users(id)`, `companies(id)`, `branches(id)` | `employee_number`, `user_id` |
| `vehicles` | `id` | `companies(id)`, `branches(id)` | `vin` |
| `trips` | `id` | `companies(id)`, `vehicles(id)`, `drivers(id)`, `orders(id)`, `branches(id)x2` | `trip_number` |
| `offers` | `id` | `companies(id)`, `trips(id)`, `vehicles(id)`, `drivers(id)` | `offer_number` |
| `auctions` | `id` | `companies(id)`, `trips(id)`, `companies(winner_id)`, `bids(winning_bid_id)` | `auction_number` |
| `payments` | `id` | `companies(id)`, `trips(id)`, `orders(id)`, `invoices(id)`, `payments(refund_id)` | `payment_number` |
| `ratings` | `id` | `trips(id)`, `users(id)x2`, `drivers(id)x2`, `companies(id)x2` | — |
| `notifications` | `id` | `users(id)`, `companies(id)`, `drivers(id)`, `trips(id)`, `orders(id)` | — |
| `gps_locations` | `id` | `vehicles(id)`, `trips(id)`, `drivers(id)` | — |

---

*Este documento complementa el esquema de base de datos definido en 01_Database_Schema.md*  
*Diagramas generados para Spottruck v1.0 — Última actualización: 2026-06-03*