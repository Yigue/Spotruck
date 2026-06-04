# Spottruck — Guía de Usuario

## Roles

### 🏢 Empresa (COMPANY)
Publica viajes y selecciona transportistas.

### 🚛 Transportista (DRIVER)
Ve viajes disponibles, puja en subastas.

---

## Flujo completo

### 1. Registro

Accedé a `/register` y creá tu cuenta:

- **Empresa:** ingresá nombre, email, contraseña, rol "Empresa"
- **Transportista:** además de los datos básicos, completá datos del vehículo (patente, tipo, capacidad)

### 2. Publicar un viaje (Empresa)

1. Andá a **"Nuevo Viaje"**
2. Completá:
   - Origen y destino (dirección o click en el mapa)
   - Tipo de carga (granel, pallets, general, refrigerada)
   - Peso estimado
   - Fecha de retiro
   - Precio base de referencia
3. Guardá como **borrador** o publicá directamente

### 3. Subasta automática

Al publicar, el sistema crea automáticamente una auction abierta:

- Aparece en la lista de viajes disponibles para transportistas
- El precio inicial es el precio base
- Transportistas van puando para abajo (subasta inversa)

### 4. Pujar (Transportista)

1. Andá a **"Ver Subastas"**
2. Elegí un viaje que te interese
3. Poné tu precio — tiene que ser **menor** al precio actual
4. El sistema muestra si tu oferta es competitiva

**Anti-sniping:** si pujás en los últimos 5 minutos, la auction se extiende 5 minutos más (máx 3 extensiones).

### 5. Seleccionar ganador (Empresa)

1. Andá a **"Mis Viajes"**
2. Entrá al viaje en auction
3. Ve las ofertas y sus calificaciones
4. Elegí un transportista → el viaje pasa a "En Curso"

### 6. Seguimiento en tiempo real

- El transportista actualiza su ubicación desde la app
- La empresa ve el camión moviéndose en el mapa
- Si el transportista deja de reportar, el sistema alerta

### 7. Finalizar y calificar

Al llegar a destino:
- El pago se libera automáticamente
- Empresa y transportista se califican mutuamente (puntualidad, comunicación, estado de la carga)

---

## Estados de un viaje

```
BORRADOR → ABIERTO → EN_SUBASTA → EN_CURSO → COMPLETADO
                ↓                              ↓
            CANCELADO                     CANCELADO
```

| Estado | Descripción |
|--------|-------------|
| `DRAFT` | Borrador, no visible para transportistas |
| `OPEN` | Publicado, esperando auction |
| `AUCTION` | Auction activa, pujas abiertas |
| `IN_PROGRESS` | Viaje en curso con transportista asignado |
| `COMPLETED` | Viaje finalizado |
| `CANCELLED` | Cancelado por alguna parte |

---

## Pantallas principales

### Para Empresas

- **Dashboard:** resumen de viajes, gastos, transportistas mejores calificado
- **Mis Viajes:** lista de todos tus viajes con estado
- **Nuevo Viaje:** formulario de creación
- **Detalle de Viaje:** ofertas, tracking, chat con transportista
- **Calificaciones:** reseñas recibidas

### Para Transportistas

- **Ver Subastas:** viajes disponibles para pujar
- **Mis Viajes:** viajes adjudicados
- **Tracking:** actualizar ubicación GPS
- **Calificaciones:** reseñas recibidas
- **Mi Perfil:** datos del vehículo, estadísticas
