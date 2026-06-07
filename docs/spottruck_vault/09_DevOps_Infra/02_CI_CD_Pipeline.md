# Pipeline de CI/CD para Spottruck

## Índice

1. Introducción
2. Filosofía y Principios del Pipeline
3. Arquitectura General del Pipeline
4. Stage 1: Control de Código Fuente
5. Stage 2: Build y Compilación
6. Stage 3: Pruebas Automatizadas
7. Stage 4: Análisis de Código Estático
8. Stage 5: Construcción de Imágenes Docker
9. Stage 6: Escaneo de Seguridad
10. Stage 7: Despliegue a Staging
11. Stage 8: Pruebas de Aceptación
12. Stage 9: Despliegue a Producción
13. Estrategias de Despliegue
14. Rollback y Recuperación
15. Monitoreo Post-Despliegue
16. Configuración de GitHub Actions
17. Integración con Slack y Notificaciones
18. Métricas y Mejora Continua

## Introducción

El pipeline de Integración Continua y Despliegue Continuo (CI/CD) de Spottruck representa el núcleo operacional de la plataforma, permitiendo que el código escrito por el equipo de desarrollo fluya de manera automatizada, segura y confiable desde el control de código fuente hasta los entornos de producción. Este documento describe en profundidad la arquitectura, etapas, herramientas y mejores prácticas que conforman el sistema de CI/CD de Spottruck.

La adopción de prácticas de CI/CD ha transformado fundamentalmente la manera en que el equipo de Spottruck entrega valor a sus usuarios. Antes de la implementación de este pipeline automatizado, los despliegues eran procesos manuales propensos a errores, que requerían varias horas de trabajo y frecuentemente introducían regresiones o problemas en producción. Hoy, con el pipeline completamente operacional, cada cambio de código que pasa todas las verificaciones puede llegar a producción en cuestión de minutos, con un nivel de confianza significativamente mayor.

El pipeline de Spottruck está diseñado con varios objetivos fundamentales que guían todas las decisiones arquitectónicas y operativas. Primero, la detección temprana de problemas: al ejecutar pruebas y análisis en cada commit, los errores se identifican y corrigen antes de que puedan propagarse a entornos posteriores. Segundo, la reproducibilidad: cada despliegue produce exactamente el mismo resultado independientemente de quién o qué lo ejecuta. Tercero, la seguridad: las vulnerabilidades se detectan y corrigen antes de llegar a producción mediante análisis estáticos y dinámicos automatizados. Cuarto, la velocidad: el pipeline completo se ejecuta en menos de 15 minutos, permitiendo iteraciones rápidas sin sacrificar calidad.

## Filosofía y Principios del Pipeline

### Integración Continua

La Integración Continua (CI) es la práctica de fusionar todo el código de los desarrolladores en un repositorio compartido múltiples veces al día, ejecutando automáticamente verificaciones para detectar errores lo antes posible. En Spottruck, cada push a cualquier rama del repositorio activa el pipeline de CI, que ejecuta una serie de verificaciones que incluyen compilación del código, ejecución de pruebas unitarias, análisis de cobertura, linting y escaneo de dependencias.

El principio fundamental de CI es que el código en la rama principal debe estar siempre en un estado desplegable. Para lograr esto, el equipo sigue la práctica de hacer commit frecuentemente a ramas cortas, mantener las ramas de característica actualizadas con la rama principal mediante rebase, y nunca hacer push de código que no pase las pruebas locales. Esta disciplina permite que el pipeline de CI funcione como una red de seguridad efectiva.

### Despliegue Continuo

El Despliegue Continuo (CD) lleva el concepto más allá al automatizar el proceso de liberación de software. Cuando un cambio pasa todas las verificaciones en el pipeline de CI y CD, se despliega automáticamente al entorno de producción siguiendo una estrategia de despliegue controlada. Spottruck utiliza el enfoque de despliegue continuo con puertas de aprobación manuales para entornos de producción, mientras que los entornos de desarrollo y staging reciben despliegues completamente automáticos.

La distinción entre Despliegue Continuo y Entrega Continua es importante. La Entrega Continua automatiza todo hasta el punto de que el código está siempre listo para ser desplegado, pero requiere una aprobación manual para el paso final hacia producción. El Despliegue Continuo automatiza también ese último paso. Spottruck ha elegido un modelo híbrido: despliegues automáticos a staging y manuales a producción con una sola clic de aprobación.

## Arquitectura General del Pipeline

### Flujo Principal

El pipeline de Spottruck sigue un flujo secuencial optimizado para paralelizar tareas independientes y proporcionar retroalimentación rápida. Cuando un desarrollador hace push de código al repositorio, GitHub Actions detecta el evento e inicia el pipeline correspondiente según la rama afectada.

El flujo principal del pipeline se organiza en nueve stages distintos, cada uno con responsabilidades específicas y criterios de aprobación claros. Cada stage es independiente en el sentido de que puede volver a ejecutarse sin afectar los stages anteriores. Los artifacts generados en stages anteriores se almacenan y comparten con stages posteriores según sea necesario.

### Rama de Desarrollo (develop)

Los push a la rama develop activan un pipeline completo que incluye construcción, pruebas, análisis y despliegue automático al entorno de desarrollo. Este pipeline proporciona retroalimentación rápida sobre la viabilidad de los cambios propuestos y permite que el equipo de QA realice pruebas manuales en un entorno que refleja continuamente el estado actual del desarrollo.

### Rama de Preproducción (staging)

Los push a la rama staging o merge requests desde develop hacia staging activan un pipeline que ejecuta todas las verificaciones y despliega automáticamente a un entorno de staging que replica producción. Este entorno se utiliza para pruebas de aceptación finales antes de que los cambios sean aprobados para producción.

### Rama de Producción (main)

Los merge requests hacia la rama main requieren aprobación de al menos un miembro senior del equipo y activan un pipeline completo seguido de un despliegue manual a producción. La rama main está protegida y todas las contribuciones deben pasar por el proceso de pull request con las verificaciones requeridas aprobadas.

## Stage 1: Control de Código Fuente

### Configuración del Repositorio

El repositorio de Spottruck está alojado en GitHub y estructurado como un monorepo que contiene todos los servicios de la plataforma. La estructura del repositorio organiza el código en carpetas que corresponden a cada microservicio: /frontend, /backend, /infrastructure y /docs. Esta organización facilita el descubrimiento de código relacionado y permite que el pipeline ejecute verificaciones específicas según la ubicación del código modificado.

Los archivos de configuración del pipeline de GitHub Actions residen en .github/workflows/ y siguen la convención de nomenclatura que describe su propósito: ci.yml para el pipeline de integración continua, deploy-staging.yml para despliegues a staging, y deploy-production.yml para despliegues a producción.

### Ramas Protegidas

Las ramas main y develop están configuradas como ramas protegidas en GitHub. Las protecciones requieren que todos los pull requests pasen el pipeline de CI antes de poder ser mergeados, que al menos dos revisiones de código aprobadas existan, que los conflictos con la rama base se resuelvan mediante rebase, y que no haya commits sin firmar.

### Commits y Mensajes

El equipo sigue la convención de Conventional Commits para todos los mensajes de commit. Esta convención proporciona estructura a los mensajes y permite que herramientas automatizadas generen changelogs y determinen el tipo de cambio realizado. Los tipos válidos incluyen feat para nuevas funcionalidades, fix para correcciones de errores, docs para cambios en documentación, style para cambios de formato, refactor para refactorizaciones, test para agregar o corregir pruebas, y chore para tareas de mantenimiento.

## Stage 2: Build y Compilación

### Construcción del Backend

El stage de construcción del backend de Spottruck comienza instalando las dependencias definidas en package.json y luego ejecutando el proceso de compilación. Para el backend escrito en TypeScript, esto implica ejecutar tsc para generar el JavaScript compilado que posteriormente se ejecutará en producción.

La caché de dependencias se implementa utilizando acciones de GitHub Actions que guardan el directorio node_modules entre ejecuciones. Esta optimización reduce significativamente el tiempo del stage de construcción al evitar la descarga e instalación de paquetes que no han cambiado desde la última ejecución exitosa.

### Construcción del Frontend

El frontend de Spottruck se construye utilizando Vite como bundler. El proceso de construcción minifica el código, optimiza las imágenes, genera bundles separados para código de vendor, y crea archivos de sourcemaps para debugging. El resultado es un directorio de archivos estáticos optimizados que se servirán desde el contenedor Nginx de producción.

### Construcción de Infraestructura

El código de infraestructura escrito en Terraform se valida mediante terraform fmt para formato consistente y terraform validate para verificar la sintaxis y referencias internas. Este paso asegura que los cambios de infraestructura no introduzcan errores que podrían afectar los despliegues.

## Stage 3: Pruebas Automatizadas

### Pruebas Unitarias

Las pruebas unitarias se ejecutan utilizando Jest tanto para el backend como para el frontend. El pipeline está configurado para ejecutar las pruebas en paralelo utilizando todos los núcleos de CPU disponibles, reduciendo significativamente el tiempo de ejecución. Una cobertura de código mínima del 80% es requerida para todos los archivos modificados, aunque el equipo aspira a alcanzar cobertura superior al 90% en la mayoría de los módulos.

Las pruebas unitarias en el backend se enfocan en verificar la lógica de negocio, las transformaciones de datos, las validaciones, y el comportamiento de los servicios. Las pruebas del frontend verifican componentes de React, hooks personalizados, y la integración con el estado de la aplicación.

### Pruebas de Integración

Las pruebas de integración verifican que los diferentes componentes del sistema funcionan correctamente cuando se combinan. Para el backend, esto incluye pruebas contra una instancia de PostgreSQL en memoria que verifican los repositorios de datos, las consultas SQL personalizadas, y las transacciones. Las pruebas de integración de API utilizan Supertest para realizar solicitudes HTTP al servidor en ejecución.

### Pruebas End-to-End

Playwright es la herramienta seleccionada para pruebas end-to-end en Spottruck. Estas pruebas verifican flujos de usuario completos como el inicio de sesión, la creación de un nuevo vehículo, la asignación de conductor a ruta, y la visualización de reportes. Las pruebas E2E se ejecutan en un entorno donde todos los servicios están desplegados y la base de datos contiene datos de prueba realistas.

## Stage 4: Análisis de Código Estático

### ESLint y Prettier

El código de Spottruck se analiza estáticamente utilizando ESLint para JavaScript y TypeScript, y Prettier para formato consistente. El pipeline falla si se detectan errores de linting, aunque advertencias individuales pueden ser suprimidas con comentarios justificativos en el código. La configuración de ESLint está centralizada en un archivo compartido que se aplica uniformemente a todos los proyectos.

### SonarCloud

SonarCloud proporciona análisis estático de código más profundo, incluyendo detección de bugs, vulnerabilidades de seguridad, code smells, y duplicación de código. El pipeline está configurado con umbrales de calidad que deben cumplirse antes de que el código pueda avanzar. Los issues clasificados como blocker o critical deben ser resueltos antes de que el pipeline pueda pasar; issues de menor severidad aparecen en el dashboard pero no bloquean el progreso.

### Seguridad con Snyk

Snyk analiza las dependencias de npm para identificar vulnerabilidades conocidas. El pipeline verifica tanto el código de la aplicación como los archivos Dockerfile en busca de vulnerabilidades. Si se detecta una vulnerabilidad crítica o de alta severidad, el pipeline se detiene y notifica al equipo para su remediación inmediata.

## Stage 5: Construcción de Imágenes Docker

### BuildKit y Caché Remota

Las imágenes Docker se construyen utilizando BuildKit, la nueva generación del builder de Docker. BuildKit proporciona construcción paralela de capas, eliminación de capas intermedias no necesarias, y caché remota que permite reutilizar capas construidas previamente en ejecuciones anteriores del pipeline.

La caché remota se almacena en GitHub Container Registry (ghcr.io), permitiendo que las construcciones del pipeline se beneficien de las capas cacheadas de ejecuciones anteriores. Esto reduce drásticamente el tiempo de construcción de imágenes y el consumo de recursos.

### Etiquetas de Imágenes

Las imágenes Docker se etiquetan automáticamente según el contexto del despliegue. Las construcciones desde la rama develop reciben la etiqueta edge, las de staging reciben la etiqueta staging, y las de main reciben tanto la etiqueta latest como una etiqueta con el hash del commit. Esta estrategia de etiquetado permite rollback preciso a versiones específicas cuando sea necesario.

### Multi-Platform Builds

Para soportar múltiples arquitecturas de procesador (amd64 y arm64), las imágenes se construyen utilizando buildx con configuración multi-plataforma. Esto es especialmente importante para despliegues en infraestructura que utiliza chips ARM como los nuevos Mac con Apple Silicon o servidores AWS Graviton.

## Stage 6: Escaneo de Seguridad

### Escaneo de Vulnerabilidades

Después de construir las imágenes Docker, Trivy escanea cada imagen en busca de vulnerabilidades del sistema operativo y aplicaciones. Las vulnerabilidades se clasifican por severidad: CRITICAL, HIGH, MEDIUM, LOW y UNKNOWN. El pipeline está configurado para fallar si se encuentran vulnerabilidades CRITICAL o HIGH no remediadas.

### Escaneo de Configuración

KICS (Keeping Infrastructure as Code Secure) analiza los archivos de Terraform y Docker Compose en busca de configuraciones inseguras. Reglas como permisos excesivos en buckets de S3, puertos expuestos innecesariamente, y credenciales hardcodeadas se detectan y reportan durante este stage.

### Análisis de Secrets

Gitleaks busca secrets hardcodeados en el código fuente. Si se detecta una credencial, API key, o token en el repositorio, el pipeline se detiene inmediatamente y requiere que el secret sea rotado y removido antes de que el código pueda avanzar.

## Stage 7: Despliegue a Staging

### Preparación del Entorno

El despliegue a staging comienza preparando el entorno objetivo. Terraform aplica los cambios de infraestructura necesarios si los hay, esperando que los recursos estén saludables antes de proceder. Luego, el pipeline ejecuta cualquier script de migración de base de datos necesario para actualizar el esquema de datos.

### Despliegue de Servicios

Los servicios se despliegan utilizando docker-compose con la configuración específica del entorno de staging. El proceso de despliegue sigue una estrategia blue-green donde el nuevo código se despliega en paralelo con el código existente, y una vez que los nuevos contenedores están saludables, el tráfico se redirige gradualmente.

### Verificación Post-Despliegue

Después del despliegue, el pipeline ejecuta un conjunto de pruebas de smoke que verifican la funcionalidad básica de la aplicación. Estas pruebas incluyen verificación de que el endpoint de salud responde correctamente, que la autenticación funciona, y que las operaciones CRUD básicas están operativas.

## Stage 8: Pruebas de Aceptación

### Pruebas de Regresión

Un conjunto completo de pruebas de regresión se ejecuta contra el entorno de staging. Estas pruebas verifican que las funcionalidades existentes siguen operando correctamente después de los cambios introducidos. El equipo de QA puede activar pruebas manuales adicionales a través de comentarios en el pull request.

### Pruebas de Carga

k6 ejecuta pruebas de carga básicas contra el entorno de staging para verificar que el sistema puede manejar la carga esperada sin degradación de rendimiento significativa. Los umbrales de respuesta se establecen en el script de prueba: tiempo de respuesta del percentil 95 inferior a 500ms y tasa de error inferior al 1%.

### Aprobación Manual

Para despliegues a producción, se requiere aprobación manual de al menos un miembro del equipo de Release Engineering. Los aprobadores reciben una notificación en Slack con un resumen de los cambios y un enlace al pipeline para revisión. La aprobación se otorga a través de la interfaz de GitHub Actions.

## Stage 9: Despliegue a Producción

### Window de Despliegue

Los despliegues a producción están restringidos a ventanas de mantenimiento definidas: martes y jueves de 10:00 a 16:00 UTC. Esta restricción no aplica para despliegues de emergencia que remediaan incidentes críticos. La política de window reduce el riesgo de desplegar durante períodos de alto tráfico no anticipado y asegura que el equipo de soporte está disponible durante el despliegue.

### Despliegue Gradual

El despliegue a producción sigue una estrategia canary donde el nuevo código se despliega inicialmente al 5% del tráfico. Durante este período, métricas de error rate, latency y business metrics se monitorean estrechamente. Si los indicadores permanecen dentro de umbrales aceptables, el tráfico se incrementa gradualmente: 25%, 50%, 100% en intervalos de 10 minutos.

### Notificaciones

Slack notifica al canal #deployments cuando un despliegue a producción comienza, cuando alcanza cada milestone del rollout, y cuando completa exitosamente o falla. Esta transparencia permite que todo el equipo esté informado sobre el estado de la plataforma.

## Estrategias de Despliegue

### Blue-Green Deployment

Blue-green deployment mantiene dos entornos idénticos de producción, denominados blue y green. En cualquier momento, uno está sirve todo el tráfico mientras el otro permanece inactivo. Para desplegar una nueva versión, el código se despliega al entorno inactivo, se verifican las pruebas de smoke, y luego el balanceador de carga se conmuta para apuntar al nuevo entorno. Si algo falla, la conmutación se revierte instantáneamente.

### Canary Releases

Las canary releases despliegan nueva funcionalidad a un subconjunto pequeño de usuarios antes de expandir a toda la base de usuarios. Esta estrategia permite validar el comportamiento en producción con riesgo mínimo. Spottruck utiliza feature flags para complementar las canary releases, permitiendo activar y desactivar funcionalidades específicas sin requerir un nuevo despliegue.

### Rolling Updates

Los rolling updates reemplazan gradualmente las instancias antiguas con nuevas en un entorno de producción. Cada instancia antigua se detiene solo después de que una nueva está funcionando correctamente. Esta estrategia es útil cuando no es práctico mantener dos entornos completos de producción.

## Rollback y Recuperación

### Rollback Automático

El pipeline monitorea continuamente las métricas de salud después de cada despliegue. Si la tasa de errores HTTP 5xx excede el umbral del 2% durante más de 5 minutos, o si el tiempo de respuesta del percentil 99 supera 2 segundos, el pipeline automáticamente invierte el despliegue y restaura la versión anterior. Esta automatización asegura respuesta inmediata a problemas sin requerir intervención manual.

### Rollback Manual

Si el monitoreo automatizado no detecta el problema pero el equipo observa comportamientos inesperados, el rollback puede activarse manualmente a través de la interfaz de GitHub Actions o mediante un comando de CLI. El rollback típicamente completa en menos de 3 minutos, restaurando el sistema a su estado anterior.

### Recuperación de Base de Datos

Los cambios de esquema de base de datos son los más riesgosos de revertir porque los datos pueden haber sido modificados durante el tiempo que la nueva versión estuvo en producción. Para estos casos, el pipeline mantiene backups automáticos diarios y point-in-time recovery. En caso de rollback, la base de datos puede ser restaurada al estado anterior al despliegue.

## Monitoreo Post-Despliegue

### Dashboard de Grafana

Un dashboard dedicado en Grafana muestra las métricas clave de la aplicación en tiempo real: requests por segundo, latency percentiles, error rates, y uso de recursos. El dashboard incluye anotaciones que marcan cada despliegue, permitiendo correlacionar cambios en métricas con despliegues específicos.

### Alertas

AlertManager configura alertas que notifican al equipo cuando las métricas superan umbrales predefinidos. Las alertas se escalan según su severidad: alertas info van al canal de Slack, alertas warning incluyen notificación al equipo on-call, y alertas critical despiertan al equipo de incidentes inmediatamente.

### Logs Distribuidos

Loki agrega logs de todos los servicios de Spottruck, proporcionando capacidad de búsqueda y correlación entre contenedores. Los logs se retienen durante 30 días en almacenamiento caliente y 90 días adicionales en almacenamiento frío. Esta retención permite análisis post-incidente sin consumir recursos de producción.

## Configuración de GitHub Actions

### Estructura del Workflow

El archivo .github/workflows/ci.yml define el pipeline de integración continua que se ejecuta en cada push y pull request. El workflow utiliza una matriz de jobs para ejecutar verificaciones en paralelo y está optimizado para proporcionar retroalimentación rápida mientras minimiza el tiempo total de ejecución.

El pipeline de CI se estructura en jobs independientes que pueden ejecutarse en paralelo: lint y type-check pueden correr simultáneamente, y los tests unitarios y de integración se ejecutan en paralelo con el build. Esta estructura reduce el tiempo total de ejecución del pipeline significativamente comparado con una ejecución secuencial.

### Variables y Secrets

Las variables no sensibles se configuran como GitHub Actions Secrets para valores que no deben ser visibles en logs. Los secrets incluyen credenciales de base de datos de staging y producción, API keys de servicios externos, y certificados. GitHub Actions Secrets están encriptados y solo se exponen a los runners durante la ejecución del workflow.

### Caché de Dependencias

La caché de npm y Docker se configura en el workflow para acelerar construcciones subsecuentes. La acción actions/cache guarda el directorio node_modules basado en el hash de package-lock.json, asegurando que la caché se invalida solo cuando las dependencias cambian.

## Integración con Slack y Notificaciones

### Canales de Slack

El equipo mantiene varios canales de Slack dedicados a diferentes aspectos del pipeline: #deployments para notificaciones generales de despliegues, #ci-failures para fallos de pipelines que requieren atención, #security-alerts para vulnerabilidades detectadas, y #on-call para incidentes de producción.

### Notificaciones de Pipeline

Las notificaciones de Slack incluyen contexto relevante: el autor del cambio, la rama afectada, enlace al commit o pull request, resultados de las pruebas más críticas, y tiempo de ejecución total. Esta información permite al equipo triagear rápidamente si la atención es necesaria.

### Approvals

Los requests de aprobación de producción se envían directamente al aprobador designado con acciones inline en Slack: Approve, View Details, o Request Changes. Los botones de aprobación simplifican el proceso sin requerir navegación a GitHub.

## Métricas y Mejora Continua

### Métricas de Pipeline

El equipo monitorea varias métricas del pipeline para identificar oportunidades de mejora: tiempo de ejecución total (objetivo: <15 minutos), tasa de fallo de builds (objetivo: <10%), tiempo de ejecución de pruebas (objetivo: <5 minutos), y disponibilidad de runners (objetivo: >99.5%).

### Revisiones Post-Incidente

Después de cada incidente de producción, el equipo conduce una revisión post-incidente (PIR) que examina no solo el evento inmediato sino también la efectividad del pipeline de CI/CD en detectar y prevenir problemas similares en el futuro. Las lecciones aprendidas se traducen en cambios al pipeline cuando es apropiado.

### Optimización Continua

El equipo reserva tiempo cada sprint para trabajar en mejoras al pipeline de CI/CD. Las optimizaciones recientes han incluido la paralelización de pruebas, implementación de caché de dependencias, y eliminación de steps redundantes. Estas mejoras incrementales han reducido el tiempo total del pipeline en un 40% desde su implementación inicial.

## Conclusión

El pipeline de CI/CD de Spottruck representa una inversión significativa en la calidad, seguridad y velocidad de entrega de la plataforma. Con este sistema en su lugar, el equipo puede mantener un ritmo de innovación acelerado mientras asegura que cada cambio que llega a producción ha sido rigurosamente verificado y es reversible en caso de problemas.

La automatización exhaustiva del pipeline libera al equipo de tareas manuales repetitivas y les permite enfocarse en trabajo de mayor valor: escribir código, diseñar arquitectura, y resolver problemas complejos de negocio. El resultado es una plataforma más confiable, un equipo más productivo, y usuarios más satisfechos.
