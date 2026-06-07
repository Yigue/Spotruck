---
title: "03 - Especificaciones de Modelos de Datos"
description: "Esquemas JSON y ejemplos para todos los modelos de datos del sistema de gestión empresarial"
version: "1.0"
date: "2026-06-04"
type: "documentation"
module: "Data Models"
---

# 03 - Especificaciones de Modelos de Datos

## Introducción

Este documento establece las especificaciones técnicas de todos los modelos de datos que conforman el sistema de gestión empresarial. Cada modelo incluye su esquema JSON formal, descripción detallada de cada campo, tipos de datos aceptados, restricciones de formato y ejemplos prácticos de instancia. Los esquemas están diseñados siguiendo las mejores prácticas de documentación de APIs REST y son directamente aplicables a la implementación del sistema.

Los modelos presentados aquí han sido derivados del documento de requisitos funcionales y representan la estructura completa de datos necesaria para soportar las cincuenta y seis funcionalidades especificadas. Cada esquema incluye propiedades de control como timestamps de creación y modificación, indicadores de estado, y metadatos de auditoría que garantizan la trazabilidad completa de la información.

---

## 1. Modelo de Usuario

El modelo de usuario representa a cada individuo que interactúa con el sistema. Este modelo es fundamental para la seguridad y personalización de la experiencia de cada actor dentro de la plataforma.

### 1.1 Esquema JSON del Modelo Usuario

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Usuario",
  "description": "Esquema para el modelo de usuario del sistema de gestión empresarial",
  "type": "object",
  "required": [
    "id_usuario",
    "nombre_usuario",
    "contrasena_hash",
    "correo_electronico",
    "nombres_completos",
    "id_rol",
    "fecha_creacion",
    "estado"
  ],
  "properties": {
    "id_usuario": {
      "type": "integer",
      "description": "Identificador único autogenerado para cada usuario",
      "minimum": 1,
      "maximum": 999999999
    },
    "nombre_usuario": {
      "type": "string",
      "description": "Nombre único de inicio de sesión en el sistema",
      "minLength": 3,
      "maxLength": 50,
      "pattern": "^[a-zA-Z0-9_]+$",
      "examples": ["jmartinez", "mgarcia_2024", "admin_sistema"]
    },
    "contrasena_hash": {
      "type": "string",
      "description": "Contraseña almacenada utilizando algoritmo bcrypt con costo 12",
      "minLength": 60,
      "maxLength": 60,
      "examples": ["$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S5J1cUGbH8/1Yi"]
    },
    "correo_electronico": {
      "type": "string",
      "description": "Dirección de correo electrónico válida y única en el sistema",
      "format": "email",
      "maxLength": 255,
      "examples": ["juan.martinez@empresa.com", "maria.garcia@companía.mx"]
    },
    "nombres_completos": {
      "type": "string",
      "description": "Nombre y apellido del usuario tal como aparecerá en documentos",
      "minLength": 2,
      "maxLength": 200,
      "examples": ["Juan Sebastián Martínez López", "María Fernanda García Rodríguez"]
    },
    "id_rol": {
      "type": "integer",
      "description": "Referencia al rol principal asignado al usuario",
      "minimum": 1
    },
    "roles_adicionales": {
      "type": "array",
      "description": "Lista de identificadores de roles secundarios del usuario",
      "items": {
        "type": "integer",
        "minimum": 1
      },
      "default": []
    },
    "telefono_principal": {
      "type": "string",
      "description": "Número de teléfono principal de contacto",
      "pattern": "^\\+?[0-9]{8,15}$",
      "examples": ["+525512345678", "5551234567"]
    },
    "telefono_secundario": {
      "type": "string",
      "description": "Número de teléfono alternativo de contacto",
      "pattern": "^\\+?[0-9]{8,15}$",
      "nullable": true
    },
    "departamento": {
      "type": "string",
      "description": "Departamento o área organizacional a la que pertenece el usuario",
      "maxLength": 100,
      "examples": ["Ventas", "Recursos Humanos", "Operaciones", "Finanzas"]
    },
    "cargo": {
      "type": "string",
      "description": "Puesto o cargo específico del usuario dentro de la empresa",
      "maxLength": 100,
      "examples": ["Ejecutivo de Ventas", "Gerente de Proyecto", "Analista Financiero"]
    },
    "fecha_creacion": {
      "type": "string",
      "description": "Fecha y hora de registro inicial del usuario en el sistema",
      "format": "date-time",
      "examples": ["2026-01-15T08:30:00Z"]
    },
    "fecha_ultimo_acceso": {
      "type": "string",
      "description": "Fecha y hora del último inicio de sesión exitoso",
      "format": "date-time",
      "nullable": true,
      "examples": ["2026-06-04T14:22:35Z"]
    },
    "fecha_modificacion": {
      "type": "string",
      "description": "Fecha y hora de la última modificación de los datos del usuario",
      "format": "date-time",
      "examples": ["2026-05-20T10:15:00Z"]
    },
    "estado": {
      "type": "string",
      "description": "Estado actual de la cuenta del usuario",
      "enum": ["activo", "inactivo", "bloqueado", "pendiente_verificacion"],
      "default": "activo"
    },
    "motivo_bloqueo": {
      "type": "string",
      "description": "Razón por la cual la cuenta fue bloqueada si aplica",
      "nullable": true,
      "maxLength": 500
    },
    "intentos_fallidos": {
      "type": "integer",
      "description": "Cantidad de intentos de autenticación fallidos consecutivos",
      "minimum": 0,
      "maximum": 10,
      "default": 0
    },
    "requiere_cambio_contrasena": {
      "type": "boolean",
      "description": "Indica si el usuario debe cambiar su contraseña en el próximo inicio de sesión",
      "default": false
    },
    "token_recuperacion": {
      "type": "string",
      "description": "Token temporal para recuperación de contraseña",
      "nullable": true,
      "maxLength": 100
    },
    "token_recuperacion_expiracion": {
      "type": "string",
      "description": "Fecha y hora de expiración del token de recuperación",
      "format": "date-time",
      "nullable": true
    },
    "preferencias": {
      "type": "object",
      "description": "Objeto con preferencias personalizables del usuario",
      "properties": {
        "idioma": {
          "type": "string",
          "default": "es",
          "enum": ["es", "en"]
        },
        "zona_horaria": {
          "type": "string",
          "default": "America/Mexico_City"
        },
        "formato_fecha": {
          "type": "string",
          "default": "DD/MM/YYYY"
        },
        "tema_visual": {
          "type": "string",
          "default": "claro",
          "enum": ["claro", "oscuro", "auto"]
        }
      },
      "default": {}
    }
  }
}
```

### 1.2 Ejemplo de Instancia del Modelo Usuario

```json
{
  "id_usuario": 1001,
  "nombre_usuario": "jmartinez",
  "contrasena_hash": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
  "correo_electronico": "juan.martinez@spottruck.com",
  "nombres_completos": "Juan Sebastián Martínez López",
  "id_rol": 2,
  "roles_adicionales": [4],
  "telefono_principal": "+525512345678",
  "telefono_secundario": "+525598765432",
  "departamento": "Ventas",
  "cargo": "Ejecutivo de Cuentas Senior",
  "fecha_creacion": "2024-03-15T08:30:00Z",
  "fecha_ultimo_acceso": "2026-06-04T09:15:22Z",
  "fecha_modificacion": "2026-05-28T16:45:00Z",
  "estado": "activo",
  "motivo_bloqueo": null,
  "intentos_fallidos": 0,
  "requiere_cambio_contrasena": false,
  "token_recuperacion": null,
  "token_recuperacion_expiracion": null,
  "preferencias": {
    "idioma": "es",
    "zona_horaria": "America/Mexico_City",
    "formato_fecha": "DD/MM/YYYY",
    "tema_visual": "oscuro"
  }
}
```

---

## 2. Modelo de Rol

El modelo de rol implementa el sistema de control de acceso basado en roles necesario para la seguridad del sistema. Cada rol define un conjunto de permisos específicos sobre las funcionalidades disponibles.

### 2.1 Esquema JSON del Modelo Rol

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Rol",
  "description": "Esquema para el modelo de rol del sistema RBAC",
  "type": "object",
  "required": [
    "id_rol",
    "nombre_rol",
    "descripcion",
    "nivel_jerarquico",
    "fecha_creacion",
    "estado"
  ],
  "properties": {
    "id_rol": {
      "type": "integer",
      "description": "Identificador único del rol en el sistema",
      "minimum": 1
    },
    "nombre_rol": {
      "type": "string",
      "description": "Nombre descriptivo del rol",
      "minLength": 2,
      "maxLength": 50,
      "examples": ["Administrador", "Supervisor", "Operador", "Consultor"]
    },
    "codigo_rol": {
      "type": "string",
      "description": "Código interno único para referencia rápida del rol",
      "pattern": "^[A-Z_]{3,10}$",
      "examples": ["ADMIN", "SUPV", "OPER", "CONS"]
    },
    "descripcion": {
      "type": "string",
      "description": "Descripción detallada del propósito y responsabilidades del rol",
      "maxLength": 500
    },
    "nivel_jerarquico": {
      "type": "integer",
      "description": "Nivel de prioridad en la jerarquía organizacional",
      "minimum": 1,
      "maximum": 100,
      "examples": [1, 2, 3, 4]
    },
    "permisos": {
      "type": "object",
      "description": "Mapa de módulos con sus permisos otorgados",
      "properties": {
        "usuarios": {
          "type": "object",
          "properties": {
            "crear": { "type": "boolean", "default": false },
            "leer": { "type": "boolean", "default": false },
            "actualizar": { "type": "boolean", "default": false },
            "eliminar": { "type": "boolean", "default": false },
            "ejecutar": { "type": "boolean", "default": false }
          }
        },
        "productos": {
          "type": "object",
          "properties": {
            "crear": { "type": "boolean", "default": false },
            "leer": { "type": "boolean", "default": false },
            "actualizar": { "type": "boolean", "default": false },
            "eliminar": { "type": "boolean", "default": false },
            "ejecutar": { "type": "boolean", "default": false }
          }
        },
        "inventario": {
          "type": "object",
          "properties": {
            "crear": { "type": "boolean", "default": false },
            "leer": { "type": "boolean", "default": false },
            "actualizar": { "type": "boolean", "default": false },
            "eliminar": { "type": "boolean", "default": false },
            "ejecutar": { "type": "boolean", "default": false }
          }
        },
        "ordenes_compra": {
          "type": "object",
          "properties": {
            "crear": { "type": "boolean", "default": false },
            "leer": { "type": "boolean", "default": false },
            "actualizar": { "type": "boolean", "default": false },
            "eliminar": { "type": "boolean", "default": false },
            "ejecutar": { "type": "boolean", "default": false }
          }
        },
        "ordenes_venta": {
          "type": "object",
          "properties": {
            "crear": { "type": "boolean", "default": false },
            "leer": { "type": "boolean", "default": false },
            "actualizar": { "type": "boolean", "default": false },
            "eliminar": { "type": "boolean", "default": false },
            "ejecutar": { "type": "boolean", "default": false }
          }
        },
        "facturas": {
          "type": "object",
          "properties": {
            "crear": { "type": "boolean", "default": false },
            "leer": { "type": "boolean", "default": false },
            "actualizar": { "type": "boolean", "default": false },
            "eliminar": { "type": "boolean", "default": false },
            "ejecutar": { "type": "boolean", "default": false }
          }
        },
        "reportes": {
          "type": "object",
          "properties": {
            "crear": { "type": "boolean", "default": false },
            "leer": { "type": "boolean", "default": false },
            "actualizar": { "type": "boolean", "default": false },
            "eliminar": { "type": "boolean", "default": false },
            "ejecutar": { "type": "boolean", "default": false }
          }
        },
        "configuracion": {
          "type": "object",
          "properties": {
            "crear": { "type": "boolean", "default": false },
            "leer": { "type": "boolean", "default": false },
            "actualizar": { "type": "boolean", "default": false },
            "eliminar": { "type": "boolean", "default": false },
            "ejecutar": { "type": "boolean", "default": false }
          }
        }
      },
      "default": {}
    },
    "fecha_creacion": {
      "type": "string",
      "description": "Fecha y hora de creación del rol",
      "format": "date-time"
    },
    "fecha_modificacion": {
      "type": "string",
      "description": "Fecha y hora de última modificación",
      "format": "date-time"
    },
    "estado": {
      "type": "string",
      "description": "Estado del rol en el sistema",
      "enum": ["activo", "inactivo"],
      "default": "activo"
    },
    "es_personalizado": {
      "type": "boolean",
      "description": "Indica si el rol fue creado por un administrador en lugar de ser predefinido",
      "default": false
    },
    "rol_padre": {
      "type": "integer",
      "description": "Identificador del rol padre del cual hereda permisos",
      "nullable": true,
      "minimum": 1
    }
  }
}
```

### 2.2 Ejemplo de Instancia del Modelo Rol

```json
{
  "id_rol": 2,
  "nombre_rol": "Supervisor",
  "codigo_rol": "SUPV",
  "descripcion": "Rol con permisos de supervisión de equipo y aprobación de operaciones dentro de umbrales establecidos",
  "nivel_jerarquico": 2,
  "permisos": {
    "usuarios": {
      "crear": false,
      "leer": true,
      "actualizar": true,
      "eliminar": false,
      "ejecutar": false
    },
    "productos": {
      "crear": true,
      "leer": true,
      "actualizar": true,
      "eliminar": false,
      "ejecutar": true
    },
    "inventario": {
      "crear": true,
      "leer": true,
      "actualizar": true,
      "eliminar": false,
      "ejecutar": true
    },
    "ordenes_compra": {
      "crear": true,
      "leer": true,
      "actualizar": true,
      "eliminar": false,
      "ejecutar": true
    },
    "ordenes_venta": {
      "crear": true,
      "leer": true,
      "actualizar": true,
      "eliminar": false,
      "ejecutar": true
    },
    "facturas": {
      "crear": true,
      "leer": true,
      "actualizar": false,
      "eliminar": false,
      "ejecutar": true
    },
    "reportes": {
      "crear": true,
      "leer": true,
      "actualizar": true,
      "eliminar": false,
      "ejecutar": true
    },
    "configuracion": {
      "crear": false,
      "leer": true,
      "actualizar": false,
      "eliminar": false,
      "ejecutar": false
    }
  },
  "fecha_creacion": "2024-01-01T00:00:00Z",
  "fecha_modificacion": "2026-02-15T11:30:00Z",
  "estado": "activo",
  "es_personalizado": false,
  "rol_padre": 1
}
```

---

## 3. Modelo de Entidad Comercial

El modelo de entidad comercial representa organizaciones externas que interactúan con la empresa, ya sea como clientes, proveedores o ambas cosas simultáneamente.

### 3.1 Esquema JSON del Modelo Entidad Comercial

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "EntidadComercial",
  "description": "Esquema para clientes, proveedores o ambas entidades",
  "type": "object",
  "required": [
    "id_entidad",
    "razon_social",
    "numero_identificacion_fiscal",
    "fecha_creacion",
    "estado_relacion"
  ],
  "properties": {
    "id_entidad": {
      "type": "integer",
      "description": "Identificador único de la entidad comercial",
      "minimum": 1
    },
    "razon_social": {
      "type": "string",
      "description": "Razón social oficial registrada legalmente",
      "minLength": 2,
      "maxLength": 300,
      "examples": ["Comercializadora ABC S.A. de C.V.", "Distribuidora XYZ S.L."]
    },
    "nombre_comercial": {
      "type": "string",
      "description": "Nombre comercial utilizado en operaciones día a día",
      "maxLength": 200,
      "examples": ["ABC Supplies", "Distribuidora El Noreste"]
    },
    "numero_identificacion_fiscal": {
      "type": "string",
      "description": "Número de identificación tributaria oficial",
      "pattern": "^[A-Z0-9]{5,20}$",
      "examples": ["ABC-123456789", "XAXX010101000", "12-34567890"]
    },
    "direccion_fiscal": {
      "type": "object",
      "description": "Dirección fiscal completa para documentos legales",
      "required": ["calle", "ciudad", "estado", "codigo_postal", "pais"],
      "properties": {
        "calle": {
          "type": "string",
          "maxLength": 200,
          "examples": ["Av. Insurgentes Sur 1234"]
        },
        "numero_exterior": {
          "type": "string",
          "maxLength": 20,
          "examples": ["100", "100-A"]
        },
        "numero_interior": {
          "type": "string",
          "maxLength": 20,
          "nullable": true,
          "examples": ["5B"]
        },
        "colonia": {
          "type": "string",
          "maxLength": 100,
          "examples": ["Col. Del Valle"]
        },
        "ciudad": {
          "type": "string",
          "maxLength": 100,
          "examples": ["Ciudad de México"]
        },
        "estado": {
          "type": "string",
          "maxLength": 100,
          "examples": ["CDMX"]
        },
        "codigo_postal": {
          "type": "string",
          "pattern": "^[0-9]{5}(-[0-9]{4})?$",
          "examples": ["03100", "03100-0001"]
        },
        "pais": {
          "type": "string",
          "maxLength": 100,
          "default": "México"
        }
      }
    },
    "telefono_principal": {
      "type": "string",
      "description": "Teléfono principal de contacto",
      "pattern": "^\\+?[0-9]{8,15}$",
      "examples": ["+525555123456"]
    },
    "telefono_secundario": {
      "type": "string",
      "description": "Teléfono secundario de contacto",
      "pattern": "^\\+?[0-9]{8,15}$",
      "nullable": true
    },
    "correo_electronico": {
      "type": "string",
      "description": "Correo electrónico principal de contacto",
      "format": "email",
      "maxLength": 255
    },
    "pagina_web": {
      "type": "string",
      "description": "Sitio web oficial de la entidad",
      "format": "uri",
      "maxLength": 255,
      "nullable": true,
      "examples": ["https://www.comercializadoraabc.com"]
    },
    "clasificacion_industria": {
      "type": "string",
      "description": "Sector o industria a la que pertenece",
      "enum": [
        "manufactura",
        "comercio_mayorista",
        "comercio_minorista",
        "servicios_profesionales",
        "construccion",
        "tecnologia",
        "alimentaria",
        "farmaceutica",
        "automotriz",
        "textil",
        "otro"
      ],
      "examples": ["comercio_mayorista", "manufactura"]
    },
    "tamano_empresa": {
      "type": "string",
      "description": "Clasificación por tamaño según empleados e ingresos",
      "enum": ["micro", "pequena", "mediana", "grande"],
      "examples": ["mediana"]
    },
    "tipo_entidad": {
      "type": "string",
      "description": "Clasificación de la relación comercial",
      "enum": ["cliente", "proveedor", "cliente_proveedor"],
      "default": "cliente"
    },
    "estado_relacion": {
      "type": "string",
      "description": "Estado actual de la relación comercial",
      "enum": ["activa", "inactiva", "en_probacion", "bloqueada"],
      "default": "activa"
    },
    "contacto_principal": {
      "type": "object",
      "description": "Información del contacto principal en la entidad",
      "properties": {
        "nombre": {
          "type": "string",
          "maxLength": 200
        },
        "cargo": {
          "type": "string",
          "maxLength": 100
        },
        "telefono": {
          "type": "string",
          "pattern": "^\\+?[0-9]{8,15}$"
        },
        "correo": {
          "type": "string",
          "format": "email",
          "maxLength": 255
        }
      }
    },
    "limite_credito": {
      "type": "number",
      "description": "Límite de crédito asignado en moneda base",
      "minimum": 0,
      "multipleOf": 0.01,
      "default": 0
    },
    "credito_disponible": {
      "type": "number",
      "description": "Monto de crédito disponible actualmente",
      "minimum": 0,
      "multipleOf": 0.01,
      "default": 0
    },
    "condiciones_pago": {
      "type": "object",
      "description": "Términos de pago acordados con la entidad",
      "properties": {
        "dias_credito": {
          "type": "integer",
          "minimum": 0,
          "maximum": 365,
          "default": 30
        },
        "descuento_puntual": {
          "type": "number",
          "description": "Porcentaje de descuento por pronto pago",
          "minimum": 0,
          "maximum": 100,
          "default": 0
        },
        "dias_descuento": {
          "type": "integer",
          "minimum": 0,
          "default": 0
        },
        "metodos_pago_aceptados": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["transferencia", "cheque", "tarjeta_credito", "tarjeta_debito", "efectivo", "nota_credito"]
          }
        }
      }
    },
    "fecha_creacion": {
      "type": "string",
      "format": "date-time"
    },
    "fecha_modificacion": {
      "type": "string",
      "format": "date-time"
    },
    "fecha_ultima_operacion": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "notas": {
      "type": "string",
      "description": "Notas internas sobre la entidad",
      "maxLength": 1000,
      "nullable": true
    }
  }
}
```

### 3.2 Ejemplo de Instancia del Modelo Entidad Comercial

```json
{
  "id_entidad": 5001,
  "razon_social": "Transportes y Logística del Norte S.A. de C.V.",
  "nombre_comercial": "Translog Norte",
  "numero_identificacion_fiscal": "TLN-850214J5U",
  "direccion_fiscal": {
    "calle": "Boulevard Industrial",
    "numero_exterior": "2850",
    "numero_interior": "Bodega 12",
    "colonia": "Parque Industrial Monterrey",
    "ciudad": "Monterrey",
    "estado": "Nuevo León",
    "codigo_postal": "66600",
    "pais": "México"
  },
  "telefono_principal": "+528118880000",
  "telefono_secundario": "+528118880001",
  "correo_electronico": "compras@translognorte.com.mx",
  "pagina_web": "https://www.translognorte.com.mx",
  "clasificacion_industria": "logistica",
  "tamano_empresa": "mediana",
  "tipo_entidad": "cliente_proveedor",
  "estado_relacion": "activa",
  "contacto_principal": {
    "nombre": "Carlos Hernández Vázquez",
    "cargo": "Director de Compras",
    "telefono": "+528118880050",
    "correo": "carlos.hernandez@translognorte.com.mx"
  },
  "limite_credito": 500000.00,
  "credito_disponible": 325000.00,
  "condiciones_pago": {
    "dias_credito": 45,
    "descuento_puntual": 2,
    "dias_descuento": 10,
    "metodos_pago_aceptados": ["transferencia", "cheque"]
  },
  "fecha_creacion": "2024-06-15T10:00:00Z",
  "fecha_modificacion": "2026-05-20T14:30:00Z",
  "fecha_ultima_operacion": "2026-06-02T16:45:00Z",
  "notas": "Cliente preferente desde 2024. Transporte de carga pesada especializado."
}
```

---

## 4. Modelo de Producto

El modelo de producto gestiona el catálogo de artículos y servicios comercializados por la empresa, incluyendo toda la información necesaria para ventas, compras e inventario.

### 4.1 Esquema JSON del Modelo Producto

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Producto",
  "description": "Esquema para productos y servicios del catálogo",
  "type": "object",
  "required": [
    "id_producto",
    "codigo_interno",
    "nombre",
    "id_categoria",
    "unidad_medida",
    "precio_unitario",
    "id_proveedor_predeterminado",
    "fecha_creacion",
    "estado"
  ],
  "properties": {
    "id_producto": {
      "type": "integer",
      "description": "Identificador único autogenerado del producto",
      "minimum": 1
    },
    "codigo_interno": {
      "type": "string",
      "description": "Código interno de referencia utilizado en el sistema",
      "pattern": "^[A-Z0-9-]{3,30}$",
      "examples": ["PROD-001", "SERV-002", "ACC-001"]
    },
    "codigo_sku": {
      "type": "string",
      "description": "Código SKU para control de inventario",
      "pattern": "^[A-Z0-9-]{5,50}$",
      "examples": ["LLANTA-2055516-PIRELLI"]
    },
    "codigo_barras": {
      "type": "string",
      "description": "Código de barras estándar (EAN, UPC, etc.)",
      "pattern": "^[0-9]{8,14}$",
      "nullable": true,
      "examples": ["7501234567890"]
    },
    "nombre": {
      "type": "string",
      "description": "Nombre descriptivo del producto o servicio",
      "minLength": 2,
      "maxLength": 300,
      "examples": ["Llanta 205/55 R16 Pirelli P4", "Servicio de Instalación"]
    },
    "descripcion": {
      "type": "string",
      "description": "Descripción detallada del producto",
      "maxLength": 2000,
      "nullable": true
    },
    "id_categoria": {
      "type": "integer",
      "description": "Identificador de la categoría principal del producto",
      "minimum": 1
    },
    "categorias_secundarias": {
      "type": "array",
      "description": "Lista de identificadores de categorías adicionales",
      "items": {
        "type": "integer",
        "minimum": 1
      },
      "default": []
    },
    "tipo_producto": {
      "type": "string",
      "description": "Clasificación del tipo de producto",
      "enum": ["producto", "servicio", "paquete", "combo"],
      "default": "producto"
    },
    "unidad_medida": {
      "type": "string",
      "description": "Unidad de medida para transacciones",
      "enum": ["pieza", "kg", "gramo", "litro", "ml", "metro", "cm", "caja", "paquete", "rollo", "hora", "servicio"],
      "default": "pieza"
    },
    "presentacion": {
      "type": "string",
      "description": "Presentación o formato de venta",
      "maxLength": 100,
      "examples": ["1 pieza", "Caja con 12 unidades", "Kilogramo"]
    },
    "peso": {
      "type": "number",
      "description": "Peso en kilogramos",
      "minimum": 0,
      "multipleOf": 0.001,
      "nullable": true
    },
    "dimensiones": {
      "type": "object",
      "description": "Dimensiones del producto en centímetros",
      "properties": {
        "largo": { "type": "number", "minimum": 0, "multipleOf": 0.1 },
        "ancho": { "type": "number", "minimum": 0, "multipleOf": 0.1 },
        "alto": { "type": "number", "minimum": 0, "multipleOf": 0.1 }
      },
      "nullable": true
    },
    "precio_unitario": {
      "type": "number",
      "description": "Precio de venta unitario en moneda base",
      "minimum": 0,
      "multipleOf": 0.01
    },
    "precio_unitario_usd": {
      "type": "number",
      "description": "Precio de venta unitario en dólares",
      "minimum": 0,
      "multipleOf": 0.01,
      "nullable": true
    },
    "costo_promedio": {
      "type": "number",
      "description": "Costo promedio ponderado de adquisición",
      "minimum": 0,
      "multipleOf": 0.01,
      "nullable": true
    },
    "id_proveedor_predeterminado": {
      "type": "integer",
      "description": "Proveedor principal para este producto",
      "minimum": 1,
      "nullable": true
    },
    "stock_minimo": {
      "type": "number",
      "description": "Umbral mínimo de inventario para alertas",
      "minimum": 0,
      "default": 0
    },
    "stock_maximo": {
      "type": "number",
      "description": "Stock máximo deseable para control",
      "minimum": 0,
      "nullable": true
    },
    "stock_actual": {
      "type": "number",
      "description": "Cantidad actual en inventario",
      "minimum": 0,
      "default": 0
    },
    "stock_reservado": {
      "type": "number",
      "description": "Cantidad reservada para órdenes pendientes",
      "minimum": 0,
      "default": 0
    },
    "stock_disponible": {
      "type": "number",
      "description": "Cantidad disponible para nuevas órdenes (calculado)",
      "minimum": 0
    },
    "variantes": {
      "type": "array",
      "description": "Lista de variantes del producto (tallas, colores, etc.)",
      "items": {
        "type": "object",
        "properties": {
          "atributo": {
            "type": "string",
            "examples": ["talla", "color", "presentacion"]
          },
          "valor": {
            "type": "string",
            "examples": ["CH", "ROJO", "500ml"]
          },
          "codigo_variante": {
            "type": "string"
          },
          "precio_adicional": {
            "type": "number",
            "default": 0
          }
        }
      },
      "default": []
    },
    "imagenes": {
      "type": "array",
      "description": "URLs de imágenes del producto",
      "items": {
        "type": "string",
        "format": "uri"
      },
      "default": []
    },
    "estado": {
      "type": "string",
      "description": "Estado del producto en el catálogo",
      "enum": ["activo", "inactivo", "descontinuado"],
      "default": "activo"
    },
    "permitir_venta_sin_stock": {
      "type": "boolean",
      "description": "Permite registrar ventas aunque no haya stock disponible",
      "default": false
    },
    "permitir_backorder": {
      "type": "boolean",
      "description": "Permite aceptar órdenes aunque el producto esté agotado",
      "default": false
    },
    "tiempo_entrega_estimado": {
      "type": "integer",
      "description": "Días hábiles estimados de entrega",
      "minimum": 0,
      "nullable": true
    },
    "fecha_creacion": {
      "type": "string",
      "format": "date-time"
    },
    "fecha_modificacion": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

### 4.2 Ejemplo de Instancia del Modelo Producto

```json
{
  "id_producto": 7501,
  "codigo_interno": "LLANTA-001",
  "codigo_sku": "LLANTA-2055516-PIRELLI-P4",
  "codigo_barras": "8011007123456",
  "nombre": "Llanta 205/55 R16 Pirelli P4 Four Seasons",
  "descripcion": "Llanta omnicanal para todo el año, ideal para sedan y hatchback. Ofrece excelente rendimiento en mojado y bajo nivel de ruido.",
  "id_categoria": 15,
  "categorias_secundarias": [42, 43],
  "tipo_producto": "producto",
  "unidad_medida": "pieza",
  "presentacion": "1 pieza",
  "peso": 8.5,
  "dimensiones": {
    "largo": 65.0,
    "ancho": 20.5,
    "alto": 65.0
  },
  "precio_unitario": 2850.00,
  "precio_unitario_usd": 142.50,
  "costo_promedio": 1950.00,
  "id_proveedor_predeterminado": 5002,
  "stock_minimo": 10,
  "stock_maximo": 100,
  "stock_actual": 45,
  "stock_reservado": 8,
  "stock_disponible": 37,
  "variantes": [
    {
      "atributo": "indice_carga",
      "valor": "91",
      "codigo_variante": "LLANTA-001-91",
      "precio_adicional": 0
    },
    {
      "atributo": "indice_velocidad",
      "valor": "V",
      "codigo_variante": "LLANTA-001-V",
      "precio_adicional": 150
    }
  ],
  "imagenes": [
    "https://cdn.spottruck.com/productos/llanta-2055516-1.jpg",
    "https://cdn.spottruck.com/productos/llanta-2055516-2.jpg"
  ],
  "estado": "activo",
  "permitir_venta_sin_stock": false,
  "permitir_backorder": true,
  "tiempo_entrega_estimado": 3,
  "fecha_creacion": "2024-08-01T09:00:00Z",
  "fecha_modificacion": "2026-05-15T11:20:00Z"
}
```

---

## 5. Modelo de Orden de Venta

El modelo de orden de venta representa el ciclo completo de comercialización hacia clientes, desde la cotización inicial hasta la facturación y entrega final.

### 5.1 Esquema JSON del Modelo Orden de Venta

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "OrdenVenta",
  "description": "Esquema para órdenes de venta y cotizaciones",
  "type": "object",
  "required": [
    "id_orden_venta",
    "numero_orden",
    "id_cliente",
    "id_usuario_vendedor",
    "fecha_creacion",
    "estado"
  ],
  "properties": {
    "id_orden_venta": {
      "type": "integer",
      "description": "Identificador único de la orden de venta",
      "minimum": 1
    },
    "numero_orden": {
      "type": "string",
      "description": "Número secuencial visible para el cliente",
      "pattern": "^[A-Z]{2,5}-[0-9]{6,10}$",
      "examples": ["OV-100001", "COT-200050"]
    },
    "tipo_documento": {
      "type": "string",
      "description": "Tipo de documento comercial",
      "enum": ["cotizacion", "pedido", "orden_venta"],
      "default": "orden_venta"
    },
    "id_cotizacion_origen": {
      "type": "integer",
      "description": "Referencia a cotización si fue convertida",
      "nullable": true,
      "minimum": 1
    },
    "id_cliente": {
      "type": "integer",
      "description": "Identificador del cliente",
      "minimum": 1
    },
    "id_direccion_entrega": {
      "type": "integer",
      "description": "Dirección de entrega de la mercancía",
      "nullable": true,
      "minimum": 1
    },
    "id_usuario_vendedor": {
      "type": "integer",
      "description": "Vendedor responsable de la orden",
      "minimum": 1
    },
    "id_moneda": {
      "type": "string",
      "description": "Código de moneda ISO 4217",
      "pattern": "^[A-Z]{3}$",
      "default": "MXN",
      "examples": ["MXN", "USD", "EUR"]
    },
    "tipo_cambio": {
      "type": "number",
      "description": "Tipo de cambio utilizado si es diferente a la moneda base",
      "minimum": 0,
      "multipleOf": 0.0001,
      "nullable": true
    },
    "lineas": {
      "type": "array",
      "description": "Detalle de productos o servicios vendidos",
      "items": {
        "type": "object",
        "required": ["id_producto", "cantidad", "precio_unitario"],
        "properties": {
          "id_linea": {
            "type": "integer",
            "description": "Número secuencial de línea"
          },
          "id_producto": {
            "type": "integer",
            "minimum": 1
          },
          "codigo_producto": {
            "type": "string"
          },
          "nombre_producto": {
            "type": "string"
          },
          "descripcion": {
            "type": "string",
            "nullable": true
          },
          "cantidad": {
            "type": "number",
            "minimum": 0.0001
          },
          "unidad_medida": {
            "type": "string"
          },
          "precio_unitario": {
            "type": "number",
            "minimum": 0
          },
          "descuento_porcentaje": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "default": 0
          },
          "descuento_monto": {
            "type": "number",
            "minimum": 0,
            "default": 0
          },
          "subtotal": {
            "type": "number",
            "minimum": 0
          },
          "impuestos": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id_impuesto": { "type": "integer" },
                "nombre": { "type": "string" },
                "tasa": { "type": "number" },
                "monto": { "type": "number" }
              }
            }
          },
          "total_linea": {
            "type": "number",
            "minimum": 0
          }
        }
      },
      "minItems": 1
    },
    "subtotal": {
      "type": "number",
      "description": "Subtotal antes de impuestos",
      "minimum": 0,
      "multipleOf": 0.01
    },
    "descuento_global_porcentaje": {
      "type": "number",
      "description": "Descuento general aplicado sobre el subtotal",
      "minimum": 0,
      "maximum": 100,
      "default": 0
    },
    "descuento_global_monto": {
      "type": "number",
      "description": "Monto del descuento global",
      "minimum": 0,
      "default": 0
    },
    "impuestos": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id_impuesto": { "type": "integer" },
          "nombre": { "type": "string" },
          "tasa": { "type": "number" },
          "base": { "type": "number" },
          "monto": { "type": "number" }
        }
      }
    },
    "total_impuestos": {
      "type": "number",
      "minimum": 0,
      "multipleOf": 0.01
    },
    "total": {
      "type": "number",
      "description": "Total final de la orden",
      "minimum": 0,
      "multipleOf": 0.01
    },
    "forma_pago": {
      "type": "string",
      "description": "Forma de pago acordada con el cliente",
      "enum": ["contado", "credito", "parcial"],
      "default": "credito"
    },
    "dias_pago": {
      "type": "integer",
      "description": "Días de crédito otorgados",
      "minimum": 0,
      "default": 30
    },
    "fecha_entrega_pactada": {
      "type": "string",
      "description": "Fecha de entrega acordada con el cliente",
      "format": "date",
      "nullable": true
    },
    "estado": {
      "type": "string",
      "description": "Estado actual del documento",
      "enum": [
        "borrador",
        "enviada",
        "consultada",
        "aceptada",
        "rechazada",
        "confirmada",
        "en_proceso",
        "embarcada",
        "entregada",
        "cancelada",
        "facturada"
      ],
      "default": "borrador"
    },
    "notas": {
      "type": "string",
      "description": "Notas u observaciones de la orden",
      "maxLength": 1000,
      "nullable": true
    },
    "terminos_condiciones": {
      "type": "string",
      "description": "Términos y condiciones aplicables",
      "maxLength": 2000,
      "nullable": true
    },
    "fecha_validez": {
      "type": "string",
      "description": "Fecha de validez de la cotización",
      "format": "date",
      "nullable": true
    },
    "fecha_confirmacion": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "fecha_creacion": {
      "type": "string",
      "format": "date-time"
    },
    "fecha_modificacion": {
      "type": "string",
      "format": "date-time"
    },
    "id_almacen": {
      "type": "integer",
      "description": "Almacén desde donde se despachará la orden",
      "nullable": true,
      "minimum": 1
    }
  }
}
```

### 5.2 Ejemplo de Instancia del Modelo Orden de Venta

```json
{
  "id_orden_venta": 8001,
  "numero_orden": "OV-100001",
  "tipo_documento": "orden_venta",
  "id_cotizacion_origen": 7500,
  "id_cliente": 5001,
  "id_direccion_entrega": 5020,
  "id_usuario_vendedor": 1001,
  "id_moneda": "MXN",
  "tipo_cambio": null,
  "lineas": [
    {
      "id_linea": 1,
      "id_producto": 7501,
      "codigo_producto": "LLANTA-001",
      "nombre_producto": "Llanta 205/55 R16 Pirelli P4 Four Seasons",
      "descripcion": "Llanta omnicanal para todo el año",
      "cantidad": 4,
      "unidad_medida": "pieza",
      "precio_unitario": 2850.00,
      "descuento_porcentaje": 5,
      "descuento_monto": 570.00,
      "subtotal": 10830.00,
      "impuestos": [
        {
          "id_impuesto": 1,
          "nombre": "IVA 16%",
          "tasa": 16,
          "monto": 1732.80
        }
      ],
      "total_linea": 12562.80
    },
    {
      "id_linea": 2,
      "id_producto": 7502,
      "codigo_producto": "VALVULA-001",
      "nombre_producto": "Válvula de seguridad para llanta",
      "descripcion": null,
      "cantidad": 4,
      "unidad_medida": "pieza",
      "precio_unitario": 85.00,
      "descuento_porcentaje": 0,
      "descuento_monto": 0,
      "subtotal": 340.00,
      "impuestos": [
        {
          "id_impuesto": 1,
          "nombre": "IVA 16%",
          "tasa": 16,
          "monto": 54.40
        }
      ],
      "total_linea": 394.40
    }
  ],
  "subtotal": 11170.00,
  "descuento_global_porcentaje": 0,
  "descuento_global_monto": 0,
  "impuestos": [
    {
      "id_impuesto": 1,
      "nombre": "IVA 16%",
      "tasa": 16,
      "base": 11170.00,
      "monto": 1787.20
    }
  ],
  "total_impuestos": 1787.20,
  "total": 12957.20,
  "forma_pago": "credito",
  "dias_pago": 45,
  "fecha_entrega_pactada": "2026-06-12",
  "estado": "confirmada",
  "notas": "Entrega en horario de oficina. Contactar con Carlos Hernández 24 horas antes.",
  "terminos_condiciones": "La mercancía viaja por cuenta y riesgo del comprador. No se aceptan devoluciones de productos instalados.",
  "fecha_validez": null,
  "fecha_confirmacion": "2026-06-03T10:30:00Z",
  "fecha_creacion": "2026-06-01T14:20:00Z",
  "fecha_modificacion": "2026-06-03T10:30:00Z",
  "id_almacen": 1
}
```

---

## 6. Modelo de Factura

El modelo de factura representa los documentos fiscales electrónicos generados en cumplimiento con las normativas tributarias vigentes.

### 6.1 Esquema JSON del Modelo Factura

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Factura",
  "description": "Esquema para facturas electrónicas CFDI",
  "type": "object",
  "required": [
    "id_factura",
    "numero_factura",
    "serie",
    "folio",
    "id_cliente",
    "fecha_emision",
    "total",
    "estado"
  ],
  "properties": {
    "id_factura": {
      "type": "integer",
      "description": "Identificador único interno de la factura",
      "minimum": 1
    },
    "numero_factura": {
      "type": "string",
      "description": "Número completo de facturación",
      "examples": ["A-2026-0001250"]
    },
    "serie": {
      "type": "string",
      "description": "Serie de facturación configurada",
      "pattern": "^[A-Z0-9]{1,10}$",
      "examples": ["A", "FAC-A"]
    },
    "folio": {
      "type": "integer",
      "description": "Folio secuencial dentro de la serie",
      "minimum": 1
    },
    "id_orden_venta": {
      "type": "integer",
      "description": "Orden de venta asociada",
      "nullable": true,
      "minimum": 1
    },
    "id_cliente": {
      "type": "integer",
      "description": "Identificador del cliente receptor",
      "minimum": 1
    },
    "datos_fiscales_cliente": {
      "type": "object",
      "description": "Datos fiscales del cliente al momento de la emisión",
      "properties": {
        "razon_social": { "type": "string" },
        "rfc": { "type": "string" },
        "direccion_fiscal": { "type": "object" },
        "uso_cfdi": { "type": "string" }
      }
    },
    "id_moneda": {
      "type": "string",
      "pattern": "^[A-Z]{3}$",
      "default": "MXN"
    },
    "tipo_cambio": {
      "type": "number",
      "minimum": 0,
      "multipleOf": 0.0001,
      "nullable": true
    },
    "informacion_timbrado": {
      "type": "object",
      "description": "Datos del timbre fiscal digital",
      "properties": {
        "uuid": {
          "type": "string",
          "description": "Folio fiscal único UUID",
          "pattern": "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
        },
        "fecha_timbrado": {
          "type": "string",
          "format": "date-time"
        },
        "numero_certificado_sat": {
          "type": "string"
        },
        "numero_certificado_emisor": {
          "type": "string"
        },
        "sello_digital_cfd": {
          "type": "string"
        },
        "sello_sat": {
          "type": "string"
        },
        "cadena_original": {
          "type": "string"
        },
        "url_qr": {
          "type": "string",
          "format": "uri"
        }
      }
    },
    "lineas": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id_linea": { "type": "integer" },
          "id_producto": { "type": "integer" },
          "codigo": { "type": "string" },
          "descripcion": { "type": "string" },
          "cantidad": { "type": "number" },
          "unidad_medida": { "type": "string" },
          "valor_unitario": { "type": "number" },
          "importe": { "type": "number" },
          "descuento": { "type": "number" },
          "objeto_impuesto": { "type": "string" },
          "impuestos": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "tipo": { "type": "string", "enum": ["traslado", "retencion"] },
                "impuesto": { "type": "string" },
                "tasa": { "type": "number" },
                "base": { "type": "number" },
                "monto": { "type": "number" }
              }
            }
          }
        }
      }
    },
    "subtotal": {
      "type": "number",
      "minimum": 0
    },
    "descuento": {
      "type": "number",
      "default": 0
    },
    "impuestos_trasladados": {
      "type": "number"
    },
    "impuestos_retenidos": {
      "type": "number",
      "default": 0
    },
    "total": {
      "type": "number",
      "minimum": 0
    },
    "forma_pago": {
      "type": "string",
      "description": "Código de forma de pago SAT",
      "examples": ["01", "02", "03", "04", "99"]
    },
    "metodo_pago": {
      "type": "string",
      "description": "Código del método de pago",
      "enum": ["PUE", "PPD"],
      "examples": ["PUE"]
    },
    "uso_cfdi": {
      "type": "string",
      "description": "Código de uso CFDI del receptor",
      "examples": ["G01", "G02", "G03", "P01"]
    },
    "regimen_fiscal": {
      "type": "string",
      "description": "Régimen fiscal del emisor"
    },
    "fecha_emision": {
      "type": "string",
      "format": "date-time"
    },
    "fecha_cancelacion": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "estado": {
      "type": "string",
      "enum": ["borrador", "timbrada", "cancelada", "sustituida"],
      "default": "borrador"
    },
    "estado_pago": {
      "type": "string",
      "enum": ["pendiente", "parcial", "pagada", "vencida"],
      "default": "pendiente"
    },
    "total_pagado": {
      "type": "number",
      "minimum": 0,
      "default": 0
    }
  }
}
```

### 6.2 Ejemplo de Instancia del Modelo Factura

```json
{
  "id_factura": 9001,
  "numero_factura": "A-2026-0001250",
  "serie": "A",
  "folio": 1250,
  "id_orden_venta": 8001,
  "id_cliente": 5001,
  "datos_fiscales_cliente": {
    "razon_social": "Transportes y Logística del Norte S.A. de C.V.",
    "rfc": "TLN850214J5U",
    "direccion_fiscal": {
      "calle": "Boulevard Industrial 2850",
      "colonia": "Parque Industrial Monterrey",
      "ciudad": "Monterrey",
      "estado": "Nuevo León",
      "codigo_postal": "66600",
      "pais": "México"
    },
    "uso_cfdi": "G01"
  },
  "id_moneda": "MXN",
  "tipo_cambio": null,
  "informacion_timbrado": {
    "uuid": "1A2B3C4D-5E6F-7890-ABCD-EF1234567890",
    "fecha_timbrado": "2026-06-04T09:45:00Z",
    "numero_certificado_sat": "2000102280032000001",
    "numero_certificado_emisor": "3000102280032000001",
    "sello_digital_cfd": "K8sH2xL...truncado...9F1mP",
    "sello_sat": "R7yT3nW...truncado...4E8kQ",
    "cadena_original": "||1.1|1A2B3C4D-5E6F-7890-ABCD-EF1234567890|2026-06-04T09:45:00|...||",
    "url_qr": "https://verificacfdi.facturaelectronica.sat.gob.mx/..."
  },
  "lineas": [
    {
      "id_linea": 1,
      "id_producto": 7501,
      "codigo": "LLANTA-001",
      "descripcion": "Llanta 205/55 R16 Pirelli P4 Four Seasons",
      "cantidad": 4,
      "unidad_medida": "H87",
      "valor_unitario": 2456.896551,
      "importe": 9827.586206,
      "descuento": 570.00,
      "objeto_impuesto": "02",
      "impuestos": [
        {
          "tipo": "traslado",
          "impuesto": "002",
          "tasa": 0.16,
          "base": 9257.586206,
          "monto": 1481.213793
        }
      ]
    },
    {
      "id_linea": 2,
      "id_producto": 7502,
      "codigo": "VALVULA-001",
      "descripcion": "Válvula de seguridad para llanta",
      "cantidad": 4,
      "unidad_medida": "H87",
      "valor_unitario": 73.275862,
      "importe": 293.103448,
      "descuento": 0,
      "objeto_impuesto": "02",
      "impuestos": [
        {
          "tipo": "traslado",
          "impuesto": "002",
          "tasa": 0.16,
          "base": 293.103448,
          "monto": 46.896552
        }
      ]
    }
  ],
  "subtotal": 10120.689654,
  "descuento": 570.00,
  "impuestos_trasladados": 1528.11,
  "impuestos_retenidos": 0,
  "total": 11178.80,
  "forma_pago": "03",
  "metodo_pago": "PPD",
  "uso_cfdi": "G01",
  "regimen_fiscal": "601",
  "fecha_emision": "2026-06-04T09:45:00Z",
  "fecha_cancelacion": null,
  "estado": "timbrada",
  "estado_pago": "pendiente",
  "total_pagado": 0
}
```

---

## Notas Finales de Implementación

Los esquemas JSON presentados en este documento constituyen la base formal para la implementación de la capa de datos del sistema de gestión empresarial. Cada esquema ha sido diseñado considerando los siguientes principios fundamentales que deben respetarse durante la fase de desarrollo.

En primer lugar, la integridad referencial entre modelos debe garantizarse mediante constraints de base de datos y validaciones a nivel de aplicación. Las relaciones entre entidades como usuarios y roles, productos y categorías, u órdenes y facturas deben mantenerse consistentes en todo momento mediante mecanismos transaccionales apropiados.

En segundo lugar, el versionado de esquemas debe considerarse desde el inicio del proyecto. Conforme el sistema evolucione y nuevos requisitos surjan, los esquemas podrán requerir modificaciones que deben gestionarse cuidadosamente para evitar romper la compatibilidad con clientes existentes de la API.

En tercer lugar, todas las fechas y horas deben manejarse en formato ISO 8601 con zona horaria UTC como estándar interno, convirtiendo a la zona local del usuario solo en la capa de presentación. Esto garantiza consistencia en operaciones distribuidas y facilita el debugging de problemas跨 zonas horarias.

Finalmente, los campos marked como requeridos en cada esquema representan el mínimo indispensable para que una instancia del modelo sea válida. En la práctica, la aplicación podrá requerir campos adicionales dependiendo del contexto específico de cada operación, pero estos se gestionarán mediante validación complementaria a nivel de servicio.
