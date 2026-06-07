---
title: "04 — Estrategia de Índices"
category: "Database"
project: "Spottruck"
version: "1.0.0"
date: "2026-06-03"
status: "approved"
author: "Spottruck Dev Team"
tags: [database, indexes, postgresql, performance, query-optimization, covering-indexes, partial-indexes, spottruck]
created: 2026-06-03
last_modified: 2026-06-03
---

# 04 — Estrategia de Índices

**Versión API:** v1  
**Última actualización:** 2026-06-03

---

## 1. Overview y Principios Fundamentales

La estrategia de índices de Spottruck está diseñada para optimizar el rendimiento de las consultas más frecuentes y críticas del sistema, manteniendo al mismo tiempo un equilibrio entre la velocidad de lectura y el overhead de escritura. PostgreSQL, como motor de base de datos seleccionado, ofrece un repertoire rico de tipos de índices que vamos a utilizar estratégicamente: índices B-tree para comparaciones equality y range, índices GIN para full-text search y JSON containment, índices GiST para datos geoespaciales y full-text search ranking, y índices Hash para comparaciones de igualdad exactas en columnas sin ordering requirement.

El principio fundamental que guía nuestra estrategia es que cada índice debe tener un propósito específico y medible. No creamos índices "por si acaso" o anticipando necesidades hipotéticas. Cada índiceadded debe resolver un problema de rendimiento identificado en queries reales, ya sea mediante análisis de logs de queries lentas, explain plans que revelan sequential scans problemáticos, o métricas de uso que muestran patrones de acceso específicos.

La segunda guía fundamental es que los índices tienen un costo. Cada índice afecta el rendimiento de las operaciones INSERT, UPDATE y DELETE porque el motor debe mantener actualizado cada estructura de índice además de los datos de la tabla. En tablas con alta frecuencia de escritura, demasiados índices pueden degradar significativamente el throughput. Por eso, cada índice incluye una evaluación de la relación consulta-escritura: un índice que acelera consultas frecuentes pero ralentiza escrituras ocasionales es acceptable; uno que acelera una consulta usada una vez al día pero ralentiza mil escrituras por minuto es inaceptable.

---

## 2. Análisis de Patrones de Consulta

### 2.1 Queries de Búsqueda de Viajes

El patrón de consulta más frecuente en Spottruck es la búsqueda de viajes disponibles dentro de ciertos criterios. Esta query típicamente filtra por estado del viaje, rango de fecha de recogida, ubicación de origen y destino, tipo de carga, y rango de precio. La consulta más común se parece a esta:

```sql
SELECT t.*, c.name as company_name 
FROM trips t
JOIN companies c ON t.company_id = c.id
WHERE t.status = 'pending'
  AND t.pickup_scheduled_at BETWEEN '2026-06-10' AND '2026-06-12'
  AND t.pickup_city = 'Monterrey'
  AND t.cargo_type IN ('general', 'refrigerated')
  AND t.price BETWEEN 2000 AND 5000
ORDER BY t.created_at DESC
LIMIT 20;
```

Esta query filtra por cinco columnas diferentes y ordena por created_at. Sin un índice compuesto apropiado, PostgreSQL tendría que escanear secuencialmente todos los registros de la tabla trips, aplicando cada filtro y finalmente ordenando los resultados. En una tabla con millones de registros, esto es prohibitivo.

La estrategia de indexación para este patrón comienza con un índice compuesto en las columnas de filtrado más selectivas. La selectividad mide qué porcentaje de filas pasan el filtro; un filtro con alta selectividad (pocos registros coinciden) beneficia enormemente de un índice. En este caso, status = 'pending' típicamente selecciona menos del 5% de los viajes totales, lo que lo convierte en un buen candidato para ser la primera columna del índice.

El orden de columnas en un índice compuesto es crítico. PostgreSQL puede usar el índice para filtrar por las primeras N columnas en order, pero no puede aprovechar las columnas posteriores si las anteriores no están en el filtro. Por eso, el índice más efectivo para nuestra query principal es:

```sql
CREATE INDEX idx_trips_pending_pickup_city ON trips(status, pickup_city, pickup_scheduled_at) 
WHERE status = 'pending';
```

Este es un índice partial, lo que significa que solo indexa las filas donde status = 'pending'. Esto tiene dos beneficios: el tamaño del índice es significativamente menor que uno que indexara todas las filas, y las búsquedas en el índice solo necesitan considerar las filas pendientes, ignorando completamente los viajes completados o cancelados que nunca serán buscados en este contexto.

### 2.2 Queries de Localización de Conductores

El segundo patrón más frecuente es la búsqueda de conductores disponibles cerca de una ubicación específica. Esta funcionalidad powering la asignación automática de conductores a viajes. La query usa PostGIS para encontrar conductores dentro de un radio específico:

```sql
SELECT d.*, u.first_name, u.last_name, 
       ST_Distance(d.current_location, ST_MakePoint(-100.2865, 25.6520)::geography) as distance_km
FROM drivers d
JOIN users u ON d.user_id = u.id
WHERE d.is_available = true 
  AND d.on_vacation = false
  AND d.current_location IS NOT NULL
  AND ST_DWithin(d.current_location, ST_MakePoint(-100.2865, 25.6520)::geography, 50000)
ORDER BY distance_km
LIMIT 10;
```

Esta query busca conductores dentro de 50 kilómetros de una ubicación. ST_DWithin con un geography type permite usar el índice espacial GIST para filtrar eficientemente solo los registros dentro del bounding box circular, evitando calcular la distancia exacta para cada conductor en la base de datos.

El índice requerido es:

```sql
CREATE INDEX idx_drivers_available_location 
ON drivers USING GIST(current_location) 
WHERE is_available = true AND on_vacation = false AND current_location IS NOT NULL;
```

Este índice parcial geoespacial indexa solo los conductores disponibles que tienen una ubicación actual registrada. Los conductores inactivos, en vacaciones, o sin GPS reportado no aparecen en el índice, reduciendo su tamaño y mejorando la performance de las búsquedas.

### 2.3 Queries de Historial y Reporting

Los queries de reporting típicamente agregan datos sobre períodos de tiempo extendidos. Por ejemplo, un dashboard de rendimiento de empresa necesita calcular métricas de viajes completados durante los últimos 90 días:

```sql
SELECT DATE_trunc('day', t.completed_at) as day,
       COUNT(*) as total_trips,
       SUM(t.price) as total_revenue,
       AVG(t.distance_km) as avg_distance
FROM trips t
WHERE t.status = 'completed'
  AND t.completed_at >= NOW() - INTERVAL '90 days'
  AND t.company_id = $1
GROUP BY DATE_trunc('day', t.completed_at)
ORDER BY day DESC;
```

Para esta query, el índice más efectivo es:

```sql
CREATE INDEX idx_trips_company_completed ON trips(company_id, completed_at DESC) 
WHERE status = 'completed';
```

Este índice permite filtrar directamente por company_id y status completado, y ofrece los datos ordenados por completed_at DESC, lo que significa que la operación GROUP BY puede procesarse en stream sin necesidad de un sort adicional.

---

## 3. Índices Cubridores (Covering Indexes)

Un índice cubridor es aquel que incluye todas las columnas necesarias para resolver una query sin necesidad de acceder a la tabla principal. Esto elimina el operation conocido como "heap fetch" o "index-only scan fallback", donde PostgreSQL usa el índice para filtrar pero luego debe leer la tabla para obtener columnas adicionales.

Los índices cubridores son particularmente valiosos para queries de alta frecuencia que devuelven conjuntos pequeños de resultados. En el contexto de Spottruck, muchos endpoints de API devuelven detalles de viajes donde las columnas frecuentemente seleccionadas son un subconjunto fijo del esquema.

Consideremos esta query que powering el endpoint de detalle de viaje:

```sql
SELECT id, trip_number, company_id, driver_id, vehicle_id, 
       cargo_type, cargo_weight_kg, price, currency,
       pickup_city, delivery_city, status,
       pickup_scheduled_at, delivery_scheduled_at,
       current_location
FROM trips
WHERE id = $1;
```

Sin un índice cubridor, PostgreSQL haría un index scan en idx_trips_pkey para encontrar la fila, luego un heap fetch para obtener todas las columnas nombradas en el SELECT. Si la tabla tiene muchas columnas que no se usan en esta query, el heap fetch es innecesariamente costoso.

El índice cubridor apropiado es:

```sql
CREATE INDEX idx_trips_covering_detail ON trips(id) 
INCLUDE (trip_number, company_id, driver_id, vehicle_id, 
         cargo_type, cargo_weight_kg, price, currency,
         pickup_city, delivery_city, status,
         pickup_scheduled_at, delivery_scheduled_at);
```

La cláusula INCLUDE añade columnas no-key al índice leaf pages pero no las usa para filtrado. El resultado es que PostgreSQL puede resolver la query enteramente desde el índice sin tocar la tabla principal, reduciendo dramáticamente los logical reads y el tiempo de ejecución.

PostgreSQL 11 introdujo la syntaxINCLUDE para índices B-tree, permitiendo crear índices cubridores de manera limpia y declarativa. Anteriormente, lograr el mismo efecto requería trucos como añadir columnas dummy al final de la clave de indexación, lo que era frágil y confuso.

---

## 4. Índices Parciales

Los índices parciales indexan solo un subconjunto de las filas de una tabla, definido por una condición WHERE. Esta característica es una de las más subutilizadas en PostgreSQL, a pesar de que ofrece beneficios enormes en escenarios específicos donde la condición de filtrado es frecuentemente aplicada y selectiva.

El beneficio primario de los índices parciales es el tamaño reducido. Indexar solo el 5% de los registros de una tabla significa un índice 20 veces más pequeño, lo que mejora dramáticamente la velocidad de búsqueda porque el índice cabe en memoria más fácilmente y requiere menos operaciones de lectura de disco.

El segundo beneficio es la eliminación de maintenance overhead para las filas no indexadas. Las operaciones INSERT en filas que no califican para el índice parcial no necesitan actualizar ese índice, reduciendo el trabajo de escritura. Esto es especialmente valioso para tablas con datos que envejecen: los registros históricos rara vez se buscan y pueden excluirse del índice.

### 4.1 Índices Parciales para Estados Activos

En Spottruck, la mayoría de las consultas operativas filtran por status activo. Los viajes pendientes, asignados, y en tránsito son los únicos que aparecen en las interfaces de asignación y seguimiento. Los viajes completados, cancelados, o históricos raramente se buscan en los contextos de operación temps réel.

```sql
CREATE INDEX idx_trips_active ON trips(status, created_at DESC) 
WHERE status IN ('pending', 'assigned', 'in_transit');
```

Este índice sirve las queries que buscan viajes por estado sin filtro adicional. La restricción a estados activos significa que el índice nunca contendrá filas que no son útiles para las operaciones core del sistema.

### 4.2 Índices Parciales para Excepciones

Otro uso poderoso de índices parciales es indexar solo las excepciones o casos problemáticos. Por ejemplo, queremo identificar rápidamente conductores con licencias por vencer:

```sql
CREATE INDEX idx_drivers_license_expiring ON drivers(license_expiry) 
WHERE license_expiry <= NOW() + INTERVAL '90 days';
```

Indexar solo los conductores con licencia por vencer en 90 días es mucho más eficiente que indexar todos los conductores y filtrar en la query. La mayoría de los conductores tienen licencias válidas por años; solo unos pocos necesitan atención. Este índice tiene pocos registros, es extremadamente rápido de escanear, y se actualiza solo cuando la condición cambia.

### 4.3 Índices Parciales para Datos Faltantes

Los índices parciales también pueden usarse para optimizar queries que buscan específicamente filas con valores faltantes (NULL) o valores específicos. Por ejemplo, encontrar viajes que todavía no tienen conductor asignado:

```sql
CREATE INDEX idx_trips_unassigned ON trips(company_id, created_at DESC) 
WHERE driver_id IS NULL AND status = 'pending';
```

Este índice identifica eficientemente viajes pendientes sin asignar. Las filas que ya tienen conductor no se indexan, lo que tiene sentido porque esas filas nunca serán objetivo de queries de asignación.

---

## 5. Índices Compuestos y Orden de Columnas

La decisión de qué columnas incluir en un índice compuesto y en qué orden depende del análisis de los patrones de query específicos de cada contexto. La regla fundamental es que PostgreSQL puede usar un índice compuesto para filtrar por cualquier prefijo contiguo de las columnas, pero no puede saltarse columnas intermedias.

Si tenemos un índice en (A, B, C):
- Puede filtrar por A
- Puede filtrar por A y B
- Puede filtrar por A, B y C
- NO puede filtrar solo por B
- NO puede filtrar solo por C
- NO puede filtrar por B y C

Por eso, las columnas más selectivas y frecuentemente usadas en filtros equality deben ir primero. Las columnas con range conditions (BETWEEN, >, <) o que se usan para sorting deben ir al final porque no pueden ser usadas para filtrado si aparecen después de una columna de rango.

En la práctica, esto significa que para una query como:

```sql
SELECT * FROM trips 
WHERE company_id = $1 
  AND status = 'pending' 
  AND pickup_scheduled_at > $2 
ORDER BY created_at DESC;
```

El índice compuesto óptimo es:

```sql
CREATE INDEX idx_trips_company_status_scheduled ON trips(company_id, status, pickup_scheduled_at, created_at DESC);
```

company_id y status son equality conditions y van primero para máxima selectividad. pickup_scheduled_at es una range condition y va después. created_at es para ordering y va al final. Este índice puede satisfacer completamente la query sin acceder a la tabla principal.

---

## 6. Índices para Datos Geoespaciales

PostgreSQL con PostGIS permite indexing geoespacial mediante índices GiST (Generalized Search Tree). Estos índices son esenciales para cualquier aplicación que manipule coordenadas de ubicación, incluyendo Spottruck donde la localización de conductores y la búsqueda de rutas son funcionalidades core.

### 6.1 Índices de Proximidad

El índice más común para datos geoespaciales es el que permite consultas de proximidad:

```sql
CREATE INDEX idx_trips_pickup_location ON trips USING GIST(pickup_coordinates);
CREATE INDEX idx_trips_delivery_location ON trips USING GIST(delivery_coordinates);
CREATE INDEX idx_drivers_current_location ON drivers USING GIST(current_location);
```

Estos índices permiten queries como encontrar todos los viajes con punto de recogida dentro de cierta área:

```sql
SELECT * FROM trips 
WHERE ST_Within(pickup_coordinates, ST_MakeEnvelope(-101.0, 24.5, -99.5, 26.5, 4326));
```

El índice GiST divide el espacio en bounding boxes jerárquicos, permitiendo eliminar rápidamente regiones que no intersectan con el área de búsqueda. Sin el índice, PostgreSQL tendría que calcular la relación ST_Within para cada fila de la tabla.

### 6.2 Índices para Distancias

Para queries de distancia que encuentran todos los puntos dentro de un radio de un origen:

```sql
SELECT d.*, ST_Distance(d.current_location, ST_MakePoint(-100.2865, 25.6520)::geography) as distance
FROM drivers d
WHERE ST_DWithin(d.current_location, ST_MakePoint(-100.2865, 25.6520)::geography, 30000)
ORDER BY distance;
```

El índice GiST se combina con la función ST_DWithin para usar el índice para filtrado primario. La condición ST_DWithin con geography usa el índice para encontrar todos los puntos dentro del bounding box circular aproximado, y luego recalcula la distancia exacta solo para los candidatos cercanos.

---

## 7. Índices para Full-Text Search

Aunque Spottruck no implementa búsqueda full-text como funcionalidad primaria, ciertos campos como descripciones de carga se benefician de indexación textual cuando los usuarios filtran por palabras clave.

PostgreSQL ofrece dosapproaches para full-text search: el operador ILIKE nativo y la infraestructura tsvector/gin. Para queries simples de substring, un índice B-tree con opclass varchar_pattern_ops permite búsquedas prefijo:

```sql
CREATE INDEX idx_trips_cargo_description ON trips(cargo_description varchar_pattern_ops);
```

Para búsquedas más sofisticadas con ranking de relevancia, usamos índices GIN sobre columnas tsvector:

```sql
ALTER TABLE trips ADD COLUMN search_vector tsvector;
CREATE INDEX idx_trips_search_gin ON trips USING GIN(search_vector);

UPDATE trips SET search_vector = to_tsvector('spanish', cargo_description || ' ' || COALESCE(notes, ''));

CREATE TRIGGER trips_search_update BEFORE INSERT OR UPDATE ON trips
FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger(search_vector, 'spanish', cargo_description, notes);
```

El trigger asegura que el tsvector se actualice automáticamente cuando las columnas relevantes cambian, manteniendo el índice actualizado sin código adicional.

---

## 8. Índices para JSON y Datos Semi-Estructurados

Aunque Spottruck usa PostgreSQL con columnas typed, ciertos metadatos se almacenan como JSONB para flexibilidad. Los índices GIN en columnas JSONB permiten consultas eficientes de containment y path:

```sql
CREATE INDEX idx_trips_metadata ON trips USING GIN(metadata jsonb_path_ops);
```

Este índice soporta queries como:

```sql
SELECT * FROM trips WHERE metadata @> '{"specialHandling": "temperature_sensitive"}';
```

El operador @> pregunta si el JSONB de la fila contiene el fragmento especificado. El índice GIN con jsonb_path_ops optimiza este tipo de containment check, permitiendo búsquedas eficientes en columnas JSON sin necesidad de extraer y indexar cada campo individualmente.

---

## 9. Maintenance y Monitoring

Los índices no creados y olvidados son tan dañinos como los índices útiles son beneficiosos. PostgreSQL proporciona herramientas para identificar índices no utilizados o多余的.

La vista pg_stat_user_indexes contiene estadísticas de uso para cada índice definido por el usuario. Indexes con idx_scan = 0 durante períodos extendidos son candidatos para eliminación. Sin embargo, la eliminación debe hacerse con cuidado: un índice puede no haber sido usado recientemente pero ser crítico para una query estacional o no frequente pero business-critical.

```sql
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch, pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;
```

Esta query muestra todos los índices con sus conteos de escaneo y tamaños, ordenados por los menos usados primero. Los índices con cero scans durante semanas y con tamaños significativos deben evaluarse para posible eliminación.

La tabla pg_index contiene información sobre cada índice, incluyendo si está marcado como validity y si tiene columnas de inclusión. Combinada con pg_stat_user_indexes, podemos construir un reporte comprehensivo del estado de salud de los índices.

---

## 10. Matriz deÍndices por Entidad

| Entidad | Nombre delÍndice | Columnas | Tipo | Propósito |
|---------|------------------|----------|------|-----------|
| users | idx_users_email_lower | email (lower) | B-tree | Login y búsqueda por email |
| users | idx_users_company_role | company_id, role | B-tree | Búsqueda por empresa y rol |
| drivers | idx_drivers_available_location | current_location | GiST (partial) | Búsqueda de conductores cercanos |
| drivers | idx_drivers_company_available | company_id, is_available | B-tree (partial) | Lista de conductores por empresa |
| drivers | idx_drivers_license_expiry | license_expiry | B-tree (partial) | Alertas de vencimiento |
| vehicles | idx_vehicles_company_active | company_id, is_active | B-tree (partial) | Flota activa por empresa |
| trips | idx_trips_status_pending | status, created_at | B-tree (partial) | Viajes pendientes recientes |
| trips | idx_trips_covering_detail | id | B-tree (INCLUDE) | Detalle sin heap fetch |
| trips | idx_trips_pickup_location | pickup_coordinates | GiST | Búsqueda por zona de origen |
| trips | idx_trips_driver_active | driver_id, status | B-tree (partial) | Viajes por conductor activo |
| trips | idx_trips_search_composite | status, pickup_city, price | B-tree (partial) | Búsqueda avanzada |
| companies | idx_companies_business_active | business_type, is_active | B-tree | Filtrado por tipo de negocio |

---

## 11. Guidelines para Nuevos Índices

Antes de crear un nuevo índice, las siguientes preguntas deben responderse affirmativamente:

1. **¿Existe una query específica que conocemos y medimos?** No creamos índices para queries hipotéticas. La query debe existir en código production o haber sido identificada como bottleneck en profiling.

2. **¿El explain plan muestra sequential scan problemático?** La justificación más sólida para un índice es un explain plan donde PostgreSQL elige sequential scan sobre una tabla grande cuando un índice está disponible.

3. **¿Cuántas veces por día se ejecuta esta query?** Los índices son más valiosos para queries frecuentes. Una query que se ejecuta una vez al mes no justifica el overhead de escritura.

4. **¿Cuál es la selectividad del filtro?** Un índice en una columna donde el 80% de las filas califican es inútil; PostgreSQL preferirá el sequential scan. Idealmente, el filtro debe seleccionar menos del 5% de las filas.

5. **¿Cuál es el ratio de escritura de la tabla?** Una tabla con 10,000 writes por segundo puede no soportar muchos índices adicionales sin degradación measurable.

6. **¿Hay espacio en disco para el índice?** Los índices consumen espacio proporcional al tamaño de la tabla indexada. En tablas grandes, los índices pueden ser significativamente mayores que los datos.

7. **¿Se puede modificar la query para usar un índice existente?** A veces, reescribir una query para usar un índice ya existente es más efectivo que crear uno nuevo.

---

## 12. Future Optimizations

La estrategia de índices evolucionará con el crecimiento del sistema. Monitorización continua de pg_stat_user_indexes y análisis quarterly de los queries más lentos identificarán nuevas oportunidades de optimización. conforme la	base de datos crece hacia cientos de millones de registros, consideraremos particionamiento de tablas grandes con índices locales por partición.

La transición a PostgreSQL 16 o superior habilitará el uso de索引 de orden inverso y nuevas features comoParallel Heap Scans, que pueden cambiar las reglas de indexación para ciertas workloads. Mantendremos este documento actualizado con cada cambio significativo en la estrategia.

---

*Este documento forma parte del proyecto Spottruck y está sujeto a las mismas políticas de versionamiento y revisión de código.*