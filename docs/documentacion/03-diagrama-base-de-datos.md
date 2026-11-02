# Diagrama de Base de Datos (Exportable y Visual) — Spottruck

Este documento contiene el modelo completo de la base de datos PostgreSQL de **Spottruck** en múltiples formatos estándar para visualizarlo gráficamente en herramientas interactivas como **dbdiagram.io**, **DBeaver**, **VS Code**, **PlantUML** y **Browser HTML**.

---

## 🌐 Opción 1: Visualizador HTML Interactivo (Abrir en Navegador)

Para ver el diagrama de forma **gráfica e interactiva** (con zoom, arrastre y alta resolución) directamente en tu navegador sin instalar nada:

👉 Abre el archivo **[`visualizador_bd.html`](visualizador_bd.html)** directamente en Google Chrome, Firefox o Edge.

---

## 🎨 Opción 2: Formato DBML (para dbdiagram.io)

Copia todo el siguiente bloque de código DBML y pégalo en **[dbdiagram.io](https://dbdiagram.io)** para obtener un diagrama interactivo profesional exportable a PNG/PDF:

```dbml
// ============================================
// ENUMS
// ============================================

Enum UserRole {
  COMPANY
  DRIVER
  ADMIN
}

Enum CargoType {
  BULK
  PALLETS
  GENERAL
  REFRIGERATED
}

Enum TripStatus {
  DRAFT
  OPEN
  AUCTION
  ASSIGNED
  IN_PROGRESS
  DELIVERED
  SETTLED
  CANCELLED
}

Enum AuctionType {
  OPEN
  DUTCH
  SEALED
}

Enum AuctionStatus {
  PENDING
  OPEN
  CLOSED
  SETTLED
  CANCELLED
}

Enum PaymentStatus {
  PENDING
  HELD
  RELEASED
  REFUNDED
  DISPUTED
}

Enum TruckType {
  JAULA
  SEMI
  TOLVA
  BATEA
  FURGON
  REFRIGERADO
  PLAYO
  OTRO
}

Enum BidStatus {
  PENDING
  ACCEPTED
  REJECTED
  WITHDRAWN
}

Enum DocumentsStatus {
  NONE
  PENDING
  APPROVED
  REJECTED
}

// ============================================
// TABLES
// ============================================

Table users {
  id varchar [pk, default: `uuid()`]
  email varchar [not null, unique]
  password_hash varchar [not null]
  role UserRole [not null, default: 'COMPANY']
  company_name varchar
  company_cuit varchar
  phone varchar
  driver_license varchar
  vehicle_plate varchar
  vehicle_type varchar
  vehicle_capacity_kg float
  preferred_zone varchar
  email_verified boolean [not null, default: false]
  email_verify_token varchar [unique]
  password_reset_token varchar [unique]
  password_reset_expires timestamp
  documents_status DocumentsStatus [not null, default: 'NONE']
  driver_license_url varchar
  address varchar
  website varchar
  sector varchar
  rating_avg float [not null, default: 0]
  rating_count int [not null, default: 0]
  trips_completed int [not null, default: 0]
  trust_score float [not null, default: 0.5]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null]
}

Table trucks {
  id varchar [pk, default: `uuid()`]
  owner_id varchar [not null, ref: > users.id]
  plate varchar [not null, unique]
  type TruckType [not null]
  capacity_kg float [not null]
  preferred_cargo CargoType
  senasa_number varchar
  insurance json
  documents_url text[]
  active boolean [not null, default: true]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null]
}

Table trips {
  id varchar [pk, default: `uuid()`]
  user_id varchar [not null, ref: > users.id]
  origin_address varchar [not null]
  origin_lat float [not null]
  origin_lng float [not null]
  origin_province varchar
  origin_city varchar
  dest_address varchar [not null]
  dest_lat float [not null]
  dest_lng float [not null]
  dest_province varchar
  dest_city varchar
  distance_km float
  duration_min int
  cargo_type CargoType [not null]
  cargo_desc varchar
  weight_kg float
  volume_desc varchar
  scheduled_date timestamp [not null]
  end_date timestamp
  base_price decimal(12,2) [not null]
  status TripStatus [not null, default: 'DRAFT']
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null]
}

Table auctions {
  id varchar [pk, default: `uuid()`]
  trip_id varchar [not null, unique, ref: - trips.id]
  type AuctionType [not null, default: 'OPEN']
  start_time timestamp [not null]
  end_time timestamp [not null]
  status AuctionStatus [not null, default: 'PENDING']
  current_price decimal(12,2) [not null]
  reserve_price decimal(12,2)
  extension_count int [not null, default: 0]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null]
}

Table bids {
  id varchar [pk, default: `uuid()`]
  auction_id varchar [not null, ref: > auctions.id]
  user_id varchar [not null, ref: > users.id]
  amount decimal(12,2) [not null]
  note text
  status BidStatus [not null, default: 'PENDING']
  truck_id varchar [ref: > trucks.id]
  created_at timestamp [not null, default: `now()`]
}

Table payments {
  id varchar [pk, default: `uuid()`]
  trip_id varchar [not null, ref: > trips.id]
  user_id varchar [not null, ref: > users.id]
  amount decimal(12,2) [not null]
  platform_fee decimal(12,2) [not null]
  net_amount decimal(12,2) [not null]
  status PaymentStatus [not null, default: 'PENDING']
  mercadopago_id varchar
  mercadopago_status varchar
  payment_url varchar
  hold_expires_at timestamp
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null]
}

Table ratings {
  id varchar [pk, default: `uuid()`]
  trip_id varchar [not null, ref: > trips.id]
  from_user_id varchar [not null, ref: > users.id]
  to_user_id varchar [not null, ref: > users.id]
  score float [not null]
  punctuality float
  communication float
  cargo_condition float
  comment text
  created_at timestamp [not null, default: `now()`]
}

Table tracking_logs {
  id varchar [pk, default: `uuid()`]
  trip_id varchar [not null, ref: > trips.id]
  lat float [not null]
  lng float [not null]
  speed float
  heading float
  recorded_at timestamp [not null, default: `now()`]
}

Table notifications {
  id varchar [pk, default: `uuid()`]
  user_id varchar [not null, ref: > users.id]
  type varchar [not null]
  title varchar [not null]
  body text
  payload json
  read_at timestamp
  created_at timestamp [not null, default: `now()`]
}
```

---

## 📊 Opción 3: Diagrama Mermaid (Formatos Markdown / VS Code)

```mermaid
erDiagram
    users ||--o{ trips : "publica"
    users ||--o{ bids : "realiza oferta"
    users ||--o{ trucks : "es dueño de"
    users ||--o{ ratings_given : "emite"
    users ||--o{ ratings_received : "recibe"
    users ||--o{ payments : "paga"
    users ||--o{ notifications : "recibe"

    trips ||--o| auctions : "posee (1:1)"
    trips ||--o{ payments : "genera"
    trips ||--o{ ratings : "recibe"
    trips ||--o{ tracking_logs : "registra GPS"

    auctions ||--o{ bids : "contiene"
    trucks ||--o{ bids : "asignado a"

    users {
        string id PK
        string email UK
        string password_hash
        UserRole role
        string company_name
        string company_cuit
        string phone
        string driver_license
        DocumentsStatus documents_status
        float rating_avg
        float trust_score
    }

    trucks {
        string id PK
        string owner_id FK
        string plate UK
        TruckType type
        float capacity_kg
        boolean active
    }

    trips {
        string id PK
        string user_id FK
        string origin_address
        string dest_address
        float distance_km
        CargoType cargo_type
        float weight_kg
        datetime scheduled_date
        decimal base_price
        TripStatus status
    }

    auctions {
        string id PK
        string trip_id FK_UK
        AuctionType type
        datetime start_time
        datetime end_time
        AuctionStatus status
        decimal current_price
    }

    bids {
        string id PK
        string auction_id FK
        string user_id FK
        string truck_id FK
        decimal amount
        BidStatus status
    }

    payments {
        string id PK
        string trip_id FK
        string user_id FK
        decimal amount
        decimal platform_fee
        decimal net_amount
        PaymentStatus status
    }

    ratings {
        string id PK
        string trip_id FK
        string from_user_id FK
        string to_user_id FK
        float score
        string comment
    }

    tracking_logs {
        string id PK
        string trip_id FK
        float lat
        float lng
        float speed
        datetime recorded_at
    }

    notifications {
        string id PK
        string user_id FK
        string type
        string title
        datetime created_at
    }
```
