---
title: REST Endpoints Summary
date: 2026-06-02
author: Jarvis
status: draft
tags: [api, rest, spottruck, summary]
---

# Spottruck — REST Endpoints Summary

## Index of All Endpoints

### Authentication (7 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register/company | Registro empresa |
| POST | /api/v1/auth/register/driver | Registro transportista |
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/refresh | Refresh token |
| POST | /api/v1/auth/logout | Logout |
| POST | /api/v1/auth/forgot-password | Olvidé contraseña |
| POST | /api/v1/auth/reset-password | Reset password |

### Users - Companies (3 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/companies/me | Perfil empresa |
| PATCH | /api/v1/companies/me | Editar perfil |
| POST | /api/v1/companies/me/photo | Subir foto |

### Users - Drivers (5 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/drivers/me | Perfil transportista |
| PATCH | /api/v1/drivers/me | Editar perfil |
| GET | /api/v1/drivers/:id | Ver perfil público |
| POST | /api/v1/drivers/me/documents | Subir documentos |
| PATCH | /api/v1/drivers/me/vehicle | Editar vehículo |

### Trips (9 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/trips | Crear viaje (borrador) |
| GET | /api/v1/trips | Listar mis viajes |
| GET | /api/v1/trips/available | Viajes disponibles |
| GET | /api/v1/trips/:id | Detalle de viaje |
| PATCH | /api/v1/trips/:id | Editar viaje |
| POST | /api/v1/trips/:id/publish | Publicar viaje |
| POST | /api/v1/trips/:id/cancel | Cancelar viaje |
| POST | /api/v1/trips/:id/documents | Adjuntar documentos |
| POST | /api/v1/trips/:id/depart | Iniciar viaje |

### Bids/Auctions (4 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/trips/:tripId/bids | Realizar oferta |
| GET | /api/v1/trips/:tripId/bids | Ver ofertas |
| POST | /api/v1/trips/:tripId/bids/:bidId/accept | Aceptar oferta |
| GET | /api/v1/drivers/me/bids | Mis ofertas |

### Trip Execution (6 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/drivers/me/assigned-trips | Viajes asignados |
| POST | /api/v1/trips/:id/location | Actualizar ubicación |
| POST | /api/v1/trips/:id/arrive | Marcar llegada |
| POST | /api/v1/trips/:id/deliver | Confirmar entrega |
| POST | /api/v1/trips/:id/cancel-by-driver | Cancelar (driver) |
| POST | /api/v1/trips/:id/cancel-by-company | Cancelar (empresa) |

### Ratings (3 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/trips/:tripId/rating/driver | Calificar driver |
| POST | /api/v1/trips/:tripId/rating/company | Calificar empresa |
| GET | /api/v1/users/me/ratings | Mi historial |

### Payments (2 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/users/me/transactions | Transacciones |
| GET | /api/v1/transactions/:id | Detalle transacción |

### Messages (2 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/trips/:tripId/messages | Enviar mensaje |
| GET | /api/v1/trips/:tripId/messages | Ver mensajes |

### Notifications (3 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/notifications | Ver notificaciones |
| PATCH | /api/v1/notifications/:id/read | Marcar leída |
| PATCH | /api/v1/notifications/read-all | Marcar todas leídas |

### Dashboards (2 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/companies/me/dashboard | Dashboard empresa |
| GET | /api/v1/drivers/me/dashboard | Dashboard transportista |

### Admin (7 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/admin/users | Listar usuarios |
| PATCH | /api/v1/admin/users/:id/status | Cambiar status |
| GET | /api/v1/admin/drivers/pending-documents | Pendientes docs |
| POST | /api/v1/admin/drivers/:id/verify | Verificar driver |
| GET | /api/v1/admin/config | Ver config |
| PATCH | /api/v1/admin/config | Editar config |
| GET | /api/v1/admin/dashboard | Dashboard admin |
| GET | /api/v1/admin/audit-log | Audit log |

**TOTAL: 53+ endpoints**

For detailed request/response schemas, see `02_REST_Endpoints.md`.