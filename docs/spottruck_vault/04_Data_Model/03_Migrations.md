---
title: "03 — Migraciones de Base de Datos"
category: "Database"
project: "Spottruck"
version: "1.0.0"
date: "2026-06-03"
status: "approved"
author: "Spottruck Dev Team"
tags: [database, migrations, sql, postgresql, schema, spottruck, infrastructure]
created: 2026-06-03
last_modified: 2026-06-03
---

# 03 — Migraciones de Base de Datos

**Versión API:** v1  
**Última actualización:** 2026-06-03

---

## 1. Overview y Filosofía

Este documento define la estrategia de versionamiento y ejecución de migraciones de base de datos para el proyecto Spottruck. Las migraciones son scripts SQL incrementales que permiten evolucionar el esquema de la base de datos de manera controlada, reproducible y reversible. Cada migración sigue una convención de nomenclatura secuencial que garantiza un orden execution deterministic incluso en entornos distribuidos con múltiples instancias de aplicación.

La filosofía central de nuestras migraciones es que son **idempotentes por diseño**. Cada script puede ejecutarse múltiples veces sin producir efectos colaterales no deseados. Esto se logra mediante el uso de `CREATE TABLE IF NOT EXISTS`, `DROP TABLE IF EXISTS`, y verificaciones de existencia antes de modificar objetos del esquema. Además, cada migración contempla un bloque `UP` para aplicar cambios y un bloque `DOWN` para revertirlos, permitiendo rollbacks seguros durante desarrollo y pruebas.

El sistema de migraciones está diseñado para operar en tres contextos diferentes: desarrollo local donde cada desarrollador mantiene su propia instancia de PostgreSQL, entornos de staging y producción donde las migraciones se ejecutan como parte de pipelines de CI/CD, y entornos de recuperación ante desastres donde la capacidad de reconstruir el esquema desde cero es crítica.

---

## 2. Convenciones de Nomenclatura

Todas las migraciones siguen el patrón `V###__descripcion.sql` donde el prefijo `V` indica version, `###` es un número secuencial de tres dígitos con llenado de ceros, y `descripcion` es una descripción breve del propósito de la migración en snake_case. El número secuencial es asignado monotónicamente, lo que significa que nunca se reutiliza ni se salta un número, incluso si una migración fue revertida o resulta obsoleta.

Ejemplos válidos de nombres de migración: `V001__create_users_table.sql`, `V042__add_drivers_license_expiry_index.sql`, `V099__create_audit_log_trigger.sql`. Los números de versión se gapiran intencionalmente en bloques de 10 o 100 para permitir插入 futuras migraciones entre versiones existentes sin renombrar archivos, lo cual sería problemático en repositorios con historial compartido.

El bloque `UP` contiene todas las sentencias SQL necesarias para aplicar la migración. El bloque `DOWN` contiene las sentencias inversas que revierten los cambios realizados por el `UP`. Ambas bloques son obligatorios; no se permite crear una migración sin su correspondiente rollback. La única excepción son las migraciones denominadas "destroy" que se usan exclusivamente para entornos de testing donde la base de datos se reconstruye frecuentemente.

---

## 3. Estructura de una Migración

Cada archivo de migración está estructurado en tres secciones separadas por comentarios SQL estándares. La primera sección es el bloque `UP`, delimitado por `-- UP` al inicio y `-- DOWN` al final. La segunda sección es el bloque `DOWN`, delimitado por `-- DOWN` al inicio y una línea en blanco al final. La tercera sección es opcional y contiene notas de debugging o referencias a tickets de implementación.

```sql
-- V001__create_users_table.sql
-- Descripción: Crea la tabla principal de usuarios con autenticación MFA
-- Autor: Spottruck Dev Team
-- Fecha: 2026-06-03
-- Ticket: SPOT-1234

-- UP
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'driver',
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_secret VARCHAR(32),
    profile_picture_url TEXT,
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'es',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email) WHERE is_active = true;
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_role ON users(role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_policy ON users FOR SELECT USING (true);
CREATE POLICY users_update_policy ON users FOR UPDATE USING (auth.uid() = id OR role = 'admin');

COMMENT ON TABLE users IS 'Tabla principal de usuarios del sistema Spottruck';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt con costo 12';
COMMENT ON COLUMN users.mfa_secret IS 'Secreto encriptado para autenticación TOTP';

-- DOWN
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_select_policy ON users;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_company_id;
DROP INDEX IF EXISTS idx_users_email;
DROP TABLE IF EXISTS users;
```

---

## 4. Migraciones del Esquema Base

### V001 — Tabla de Companies (Empresas)

La migración inicial crea la tabla de empresas, que es la estructura organizacional fundamental en Spottruck. Cada empresa puede ser un embarcador (shipper), un transportista (carrier), o ambos simultáneamente. Esta tabla no tiene dependencias de otras tablas, lo que la convierte en el punto de partida natural para cualquier inicialización del esquema.

```sql
-- V001__create_companies_table.sql
-- Descripción: Crea la tabla de empresas y tipos de negocio
-- Autor: Spottruck Dev Team
-- Fecha: 2026-06-03

-- UP
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(300) NOT NULL,
    rfc VARCHAR(14),
    tax_id VARCHAR(50),
    business_type VARCHAR(50) NOT NULL CHECK (business_type IN ('transport', 'logistics', 'shipper', 'broker')),
    phone VARCHAR(20),
    email VARCHAR(254) NOT NULL,
    website_url TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    description TEXT,
    fleet_size INTEGER,
    years_in_business INTEGER,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    verification_documents TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_business_type ON companies(business_type);
CREATE INDEX idx_companies_is_active ON companies(is_active) WHERE is_active = true;
CREATE INDEX idx_companies_name ON companies(name) WHERE is_active = true;

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY companies_select_policy ON companies FOR SELECT USING (
    is_active = true OR auth.role() = 'admin'
);
CREATE POLICY companies_insert_policy ON companies FOR INSERT WITH CHECK (auth.role() = 'admin');
CREATE POLICY companies_update_policy ON companies FOR UPDATE USING (auth.role() = 'admin');

COMMENT ON TABLE companies IS 'Empresas registradas en la plataforma Spottruck';
COMMENT ON COLUMN companies.rfc IS 'Registro Federal de Contribuyentes mexicano';
COMMENT ON COLUMN companies.business_type IS 'Tipo de operación: transportista, logística, embarcador, o corredor';
```

### V002 — Tabla de Users (Usuarios)

La tabla de usuarios es central para la autenticación y autorización en Spottruck. Cada usuario pertenece a una empresa y tiene un rol que determina sus permisos dentro de la plataforma. Los roles disponibles son admin (administrador global), company_owner (dueño de empresa), driver (conductor), y shipper (embarcador). La tabla implementa soporte para autenticación multifactor mediante TOTP.

```sql
-- V002__create_users_table.sql
-- Descripción: Crea la tabla de usuarios con soporte MFA
-- Autor: Spottruck Dev Team
-- Fecha: 2026-06-03
-- Dependencias: V001 (companies)

-- UP
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'driver' CHECK (role IN ('admin', 'company_owner', 'driver', 'shipper')),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_secret VARCHAR(32),
    profile_picture_url TEXT,
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'es',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    CONSTRAINT users_email_length CHECK (char_length(email) >= 5 AND char_length(email) <= 254)
);

CREATE UNIQUE INDEX idx_users_email_lower ON users(LOWER(email));
CREATE INDEX idx_users_company_id ON users(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active) WHERE is_active = true;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_policy ON users FOR SELECT USING (
    is_active = true OR auth.role() = 'admin'
);
CREATE POLICY users_update_policy ON users FOR UPDATE USING (
    auth.uid() = id OR auth.role() = 'admin' OR 
    (auth.uid() IN (SELECT id FROM users WHERE company_id = users.company_id AND role = 'company_owner'))
);

COMMENT ON TABLE users IS 'Usuarios autenticados en Spottruck';
COMMENT ON COLUMN users.mfa_secret IS 'Secreto TOTP encriptado con AES-256-GCM';
```

### V003 — Tabla de Drivers (Conductores)

La tabla de conductores extiende la información básica de usuarios con datos específicos del perfil de conducción. Un conductor debe estar asociado a un usuario existente y a una empresa de transporte. Esta tabla contiene información sobre licencias, disponibilidad, ubicación GPS actual, estadísticas de desempeño y contacto de emergencia.

```sql
-- V003__create_drivers_table.sql
-- Descripción: Crea la tabla de conductores con datos de licencias y ubicación
-- Autor: Spottruck Dev Team
-- Fecha: 2026-06-03
-- Dependencias: V001 (companies), V002 (users)

-- UP
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    license_number VARCHAR(50) NOT NULL,
    license_type VARCHAR(10) NOT NULL CHECK (license_type IN ('A', 'B', 'C', 'D', 'E')),
    license_expiry DATE NOT NULL,
    license_document_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    current_location GEOGRAPHY(POINT, 4326),
    current_location_updated_at TIMESTAMPTZ,
    current_vehicle_id UUID,
    total_trips_completed INTEGER NOT NULL DEFAULT 0,
    total_distance_km NUMERIC(10, 2) NOT NULL DEFAULT 0,
    rating DECIMAL(3, 2),
    rating_count INTEGER NOT NULL DEFAULT 0,
    on_vacation BOOLEAN NOT NULL DEFAULT false,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT drivers_license_unique UNIQUE (company_id, license_number)
);

CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_company_id ON drivers(company_id);
CREATE INDEX idx_drivers_is_available ON drivers(is_available) WHERE is_available = true AND on_vacation = false;
CREATE INDEX idx_drivers_location ON drivers USING GIST(current_location);
CREATE INDEX idx_drivers_license_expiry ON drivers(license_expiry);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY drivers_select_policy ON drivers FOR SELECT USING (
    auth.role() IN ('admin', 'company_owner') OR
    auth.uid() = user_id OR
    (auth.uid() IN (SELECT id FROM users WHERE company_id = drivers.company_id))
);
CREATE POLICY drivers_update_policy ON drivers FOR UPDATE USING (
    auth.uid() = user_id OR
    auth.role() IN ('admin', 'company_owner')
);

COMMENT ON TABLE drivers IS 'Perfil de conductores incluyendo licencias y disponibilidad';
COMMENT ON COLUMN drivers.current_location IS 'Coordenadas GPS en formato PostGIS Geography';
```

### V004 — Tabla de Vehicles (Vehículos)

La tabla de vehículos almacena información sobre la flota de chaque empresa de transporte. Cada vehículo tiene características físicas como tipo, capacidad de carga, dimensiones de la caja, y especificaciones del motor. Los vehículos pueden ser propios de la empresa o subcontratados, y tienen un estado operativo que determina si pueden ser asignados a nuevos viajes.

```sql
-- V004__create_vehicles_table.sql
-- Descripción: Crea la tabla de vehículos de la flota
-- Autor: Spottruck Dev Team
-- Fecha: 2026-06-03
-- Dependencias: V001 (companies)

-- UP
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    plate_number VARCHAR(20) NOT NULL,
    vin VARCHAR(17),
    vehicle_type VARCHAR(30) NOT NULL CHECK (vehicle_type IN ('sedan', 'suv', 'van', 'truck_3_4t', 'truck_5t', 'truck_10t', 'semi_trailer', 'trailer', 'flatbed', 'tanker', 'refrigerated')),
    brand VARCHAR(50),
    model VARCHAR(50),
    year INTEGER,
    capacity_weight_kg NUMERIC(8, 2),
    capacity_volume_m3 NUMERIC(8, 2),
    box_length_m NUMERIC(6, 2),
    box_width_m NUMERIC(6, 2),
    box_height_m NUMERIC(6, 2),
    fuel_type VARCHAR(20) CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid', 'natural_gas')),
    current_mileage_km INTEGER,
    is_owned BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    insurance_policy_number VARCHAR(50),
    insurance_expiry DATE,
    maintenance_status VARCHAR(30) DEFAULT 'current',
    last_maintenance_at TIMESTAMPTZ,
    next_maintenance_km INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT vehicles_plate_unique UNIQUE (company_id, plate_number)
);

CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_is_active ON vehicles(is_active) WHERE is_active = true;
CREATE INDEX idx_vehicles_maintenance ON vehicles(next_maintenance_km) WHERE is_active = true;

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY vehicles_select_policy ON vehicles FOR SELECT USING (
    auth.role() IN ('admin', 'company_owner') OR
    auth.uid() IN (SELECT id FROM users WHERE company_id = vehicles.company_id)
);
CREATE POLICY vehicles_update_policy ON vehicles FOR UPDATE USING (
    auth.role() IN ('admin', 'company_owner')
);

COMMENT ON TABLE vehicles IS 'Vehículos de la flota de transporte';
```

### V005 — Tabla de Trips (Viajes)

La tabla de viajes es el núcleo operational de Spottruck. Cada viaje representa una operación de transporte de carga desde un punto de origen hasta un destino, ejecutado por un conductor con un vehículo específico. Los viajes tienen un ciclo de vida completo que va desde la creación (pending), asignación (assigned), ejecución (in_transit), llegada (arrived), entrega (delivered), hasta completitud (completed) o cancelación (cancelled).

```sql
-- V005__create_trips_table.sql
-- Descripción: Crea la tabla de viajes de transporte
-- Autor: Spottruck Dev Team
-- Fecha: 2026-06-03
-- Dependencias: V001 (companies), V002 (users), V003 (drivers), V004 (vehicles)

-- UP
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_number VARCHAR(20) NOT NULL UNIQUE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    auction_id UUID,
    cargo_type VARCHAR(50) NOT NULL CHECK (cargo_type IN ('general', 'fragile', 'perishable', 'hazardous', 'live_stock', 'oversized', 'refrigerated')),
    cargo_description TEXT,
    cargo_weight_kg NUMERIC(10, 2),
    cargo_volume_m3 NUMERIC(10, 2),
    cargo_units INTEGER,
    is_hazardous BOOLEAN NOT NULL DEFAULT false,
    requires_temperature_control BOOLEAN NOT NULL DEFAULT false,
    temperature_min_celsius DECIMAL(5, 2),
    temperature_max_celsius DECIMAL(5, 2),
    pickup_address_line TEXT NOT NULL,
    pickup_city VARCHAR(100) NOT NULL,
    pickup_state VARCHAR(50) NOT NULL,
    pickup_postal_code VARCHAR(10),
    pickup_country VARCHAR(3) NOT NULL DEFAULT 'MX',
    pickup_coordinates GEOGRAPHY(POINT, 4326),
    pickup_scheduled_at TIMESTAMPTZ,
    pickup_actual_at TIMESTAMPTZ,
    delivery_address_line TEXT NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    delivery_state VARCHAR(50) NOT NULL,
    delivery_postal_code VARCHAR(10),
    delivery_country VARCHAR(3) NOT NULL DEFAULT 'MX',
    delivery_coordinates GEOGRAPHY(POINT, 4326),
    delivery_scheduled_at TIMESTAMPTZ,
    delivery_actual_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_transit', 'arrived', 'delivered', 'completed', 'cancelled')),
    distance_km NUMERIC(10, 2),
    distance_remaining_km NUMERIC(10, 2),
    current_location GEOGRAPHY(POINT, 4326),
    current_location_updated_at TIMESTAMPTZ,
    price NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'MXN',
    proof_of_delivery_url TEXT,
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_by UUID,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT trips_price_positive CHECK (price > 0),
    CONSTRAINT trips_weight_positive CHECK (cargo_weight_kg IS NULL OR cargo_weight_kg > 0),
    CONSTRAINT trips_status_transition CHECK (
        (status = 'pending') OR
        (status = 'assigned' AND driver_id IS NOT NULL AND vehicle_id IS NOT NULL) OR
        (status = 'in_transit' AND driver_id IS NOT NULL) OR
        (status = 'arrived') OR
        (status = 'delivered') OR
        (status = 'completed') OR
        (status = 'cancelled')
    )
);

CREATE INDEX idx_trips_company_id ON trips(company_id);
CREATE INDEX idx_trips_driver_id ON trips(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_trips_vehicle_id ON trips(vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_pickup_scheduled ON trips(pickup_scheduled_at) WHERE pickup_scheduled_at IS NOT NULL;
CREATE INDEX idx_trips_delivery_scheduled ON trips(delivery_scheduled_at) WHERE delivery_scheduled_at IS NOT NULL;
CREATE INDEX idx_trips_pickup_location ON trips USING GIST(pickup_coordinates) WHERE pickup_coordinates IS NOT NULL;
CREATE INDEX idx_trips_delivery_location ON trips USING GIST(delivery_coordinates) WHERE delivery_coordinates IS NOT NULL;
CREATE INDEX idx_trips_current_location ON trips USING GIST(current_location) WHERE current_location IS NOT NULL;
CREATE INDEX idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX idx_trips_auction_id ON trips(auction_id) WHERE auction_id IS NOT NULL;

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY trips_select_policy ON trips FOR SELECT USING (
    auth.role() = 'admin' OR
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid()) OR
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
);
CREATE POLICY trips_insert_policy ON trips FOR INSERT WITH CHECK (
    auth.role() = 'admin' OR
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);
CREATE POLICY trips_update_policy ON trips FOR UPDATE USING (
    auth.role() = 'admin' OR
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

COMMENT ON TABLE trips IS 'Viajes de transporte de carga';
COMMENT ON COLUMN trips.trip_number IS 'Número legible: TRP-YYYY-NNNNN';
COMMENT ON COLUMN trips.current_location IS 'Ubicación GPS actualizada del vehículo en tránsito';
```

---

## 5. Migraciones de Índices y Optimización

### V006 — Índices para Búsquedas de Viajes

Esta migración añade índices compuestos específicamente diseñados para los patrones de consulta más frecuentes en la UI de búsqueda de viajes. Los índices cubridores incluyen columnas frecuentemente solicitadas para evitar accesos a la tabla principal.

```sql
-- V006__add_trips_search_indexes.sql
-- Descripción: Añade índices para búsquedas frecuentes de viajes
-- Autor: Spottruck Dev Team
-- Fecha: 2026-06-03
-- Dependencias: V005 (trips)

-- UP
CREATE INDEX idx_trips_search_company_status 
    ON trips(company_id, status, created_at DESC) 
    WHERE status IN ('pending', 'assigned', 'in_transit');

CREATE INDEX idx_trips_search_driver_available 
    ON trips(driver_id, status) 
    WHERE driver_id IS NOT NULL AND status NOT IN ('completed', 'cancelled');

CREATE INDEX idx_trips_search_pickup_window 
    ON trips(pickup_city, pickup_scheduled_at) 
    WHERE pickup_scheduled_at IS NOT NULL AND status = 'pending';

CREATE INDEX idx_trips_search_route 
    ON trips(pickup_state, delivery_state, status) 
    WHERE status IN ('pending', 'assigned');

CREATE INDEX idx_trips_search_price 
    ON trips(price, currency) 
    WHERE status = 'pending';

COMMENT ON INDEX idx_trips_search_company_status IS 'Búsqueda de viajes por empresa con estado activo';
COMMENT ON INDEX idx_trips_search_pickup_window IS 'Búsqueda de viajes pendientes por ciudad y ventana de recogida';
```

### V007 — Índices para Localización de Conductores

Esta migración implementa índices espaciales para soportar la funcionalidad de búsqueda de conductores cercanos basada en ubicación geográfica. Utiliza PostGIS para operaciones de proximidad eficientes.

```sql
-- V007__add_drivers_location_indexes.sql
-- Descripción: Índices geoespaciales para localización de conductores
-- Autor: Spottruck Dev Team
-- Fecha: 2026-06-03
-- Dependencias: V003 (drivers)

-- UP
CREATE INDEX idx_drivers_available_location 
    ON drivers USING GIST(current_location) 
    WHERE is_available = true AND on_vacation = false AND current_location IS NOT NULL;

CREATE INDEX idx_drivers_company_available 
    ON drivers(company_id, is_available) 
    WHERE is_available = true;

CREATE INDEX idx_drivers_license_expiry_warning 
    ON drivers(license_expiry) 
    WHERE license_expiry <= NOW() + INTERVAL '90 days';

CREATE INDEX idx_drivers_rating 
    ON drivers(rating DESC, rating_count DESC) 
    WHERE rating IS NOT NULL AND rating_count >= 5;

CREATE INDEX idx_drivers_location_updated 
    ON drivers(current_location_updated_at DESC) 
    WHERE current_location IS NOT NULL;

COMMENT ON INDEX idx_drivers_available_location IS 'Búsqueda de conductores disponibles por ubicación';
COMMENT ON INDEX idx_drivers_license_expiry_warning IS 'Conductores con licencia por vencer en 90 días';
```

---

## 6. Sistema de Ejecución de Migraciones

El ejecutor de migraciones está implementado como un script Node.js que utiliza la biblioteca node-pg-migrate para manejar la ejecución secuencial de scripts SQL. El script se ejecuta automáticamente antes de iniciar el servidor de aplicaciones en cualquier entorno, garantizando que el esquema de base de datos esté siempre actualizado con la versión del código.

El proceso de ejecución sigue estos pasos: primero, el script conecta a la base de datos y crea una tabla de control llamada `migrations` si no existe. Esta tabla almacena el historial de migraciones ejecutadas con su marca de tiempo y hash del archivo. Segundo, lee todos los archivos del directorio de migraciones ordenados por nombre. Tercero, compara la lista de archivos con los registros en la tabla de control. Cuarto, ejecuta únicamente las migraciones pendientes en orden secuencial. Quinto, registra cada migración exitosamente en la tabla de control. Finalmente, si ocurre algún error, la transacción completa es revertida y el proceso de inicio falla con un mensaje claro indicando cuál migración falló.

La estrategia de rollback permite revertir migraciones individuales hasta un punto específico usando el comando `npm run migrate:down [count]`. Esto es útil durante desarrollo cuando una migración introduce cambios que necesitan adjustment. En producción, sin embargo, las migraciones nunca se revierten manualmente; en su lugar, se crea una nueva migración correctiva.

---

## 7. Mejores Prácticas y Restricciones

Cada migración debe ser atómica, lo que significa que todos los cambios dentro de una misma migración se ejecutan dentro de una transacción. Si cualquier sentencia falla, todas las anteriores se revierten. Esto elimina el estado inconsistente donde algunos cambios de una migración fueron aplicados y otros no.

Los índices nunca se eliminan en migraciones hacia abajo, solo se crean. Esto evita problemas donde una migración reversible hacia abajo eliminaría un índice que otra migración más reciente necesita. En su lugar, los índices obsoletos se marcan para eliminación en una migración futura separada.

Los datos nunca se modifican en migraciones de esquema. Las migraciones son exclusivamente para cambios de estructura. Las actualizaciones de datos se manejan mediante scripts de seeds o procesos de migración de datos separados que se ejecutan explícitamente con documentación detallada.

Las columnas nunca se renombran directamente; en su lugar, se añade una nueva columna, se migran los datos en segundo plano mediante un proceso separado, y luego se elimina la columna antigua. Esto permite recoverabilidad y reduce el riesgo de pérdida de datos durante procesos de rename.

Cualquier migratory que afecte tablas con más de un millón de registros debe incluir pausas controladas o batching para evitar bloqueos extensos que afectarían la operación normal del sistema. Estas consideraciones se documentan en comentarios dentro de la migración misma.

---

## 8. Verificación y Testing

Cada migración debe ser probada en tres entornos antes de alcanzar producción. El primer entorno es desarrollo local, donde cada desarrollador ejecuta la migración contra su propia base de datos limpia. El segundo entorno es CI/CD, donde las migraciones se ejecutan contra una instancia efímera de PostgreSQL que se crea y destruye con cada pipeline. El tercer entorno es staging, donde las migraciones se ejecutan contra una copia de producción anonimizada para validar comportamiento real.

Los tests de migración verifican cinco aspectos: que el bloque UP se ejecuta sin errores, que el bloque DOWN revierte completamente los cambios, que la migración es idempotente (ejecutar dos veces el bloque UP produce el mismo resultado que ejecutarlo una vez), que las restricciones de clave foránea se mantienen correctamente, y que los índices resultantes son utilizables por el optimizador de consultas.

La cobertura de tests se mide con la herramienta pgTap para PostgreSQL, que permite escribir assertions sobre el estado del esquema después de cada migración. Los resultados de estos tests son obligatorios para aprobar cualquier fusión de código que incluya nuevas migraciones.

---

## 9. Historial de Versiones

| Versión | Fecha | Descripción | Autor |
|---------|------|-------------|-------|
| V001 | 2026-06-03 | Creación inicial de tabla companies | Spottruck Dev Team |
| V002 | 2026-06-03 | Creación de tabla users con soporte MFA | Spottruck Dev Team |
| V003 | 2026-06-03 | Creación de tabla drivers con ubicación GPS | Spottruck Dev Team |
| V004 | 2026-06-03 | Creación de tabla vehicles | Spottruck Dev Team |
| V005 | 2026-06-03 | Creación de tabla trips | Spottruck Dev Team |
| V006 | 2026-06-03 | Índices para búsqueda de viajes | Spottruck Dev Team |
| V007 | 2026-06-03 | Índices geoespaciales para conductores | Spottruck Dev Team |

---

*Este documento forma parte del proyecto Spottruck y está sujeto a las mismas políticas de versionamiento y revisión de código.*