---
name: sdd-workflow
description: Spec-Driven Development workflow para Spottruck — spec antes que código, validación estricta
tags: [sdd, methodology, workflow]
version: 1.0.0
author: Jarvis (Hermes Agent)
---

# SDD — Spec-Driven Development Workflow

## Regla de Oro

**Spec → Spec review → Código → Tests → Merge**

Nunca escribir código sin spec aprobada. El spec ES el contrato.

---

## Flujo SDD Completo

### 1. REQUIRE — Capturar el requerimiento

```
PATTERN: <feature|fix|chore|docs>::<short-description>
TEMPLATE:
## Requirement
[Qué necesita el usuario / sistema]

## Acceptance Criteria
- [ ] Criterio 1
- [ ] Criterio 2

## Constraints
- [ ] Constraint de negocio
- [ ] Constraint técnico
```

### 2. SPEC — Escribir el spec

Crear `docs/specs/<feature-name>.md` con:

```markdown
## Feature: <nombre>

### User Story
COMO <rol>
QUIERO <funcionalidad>
PARA <beneficio>

### Behavior
- Input → Output esperado
- Error cases
- Edge cases

### API Contract (si aplica)
Endpoint, método, request, response

### Data Model (si aplica)
Tabla/colección, campos

### Acceptance Criteria
Checklist que debe pasar
```

### 3. REVIEW — Validar spec

- ¿Está claro el input/output?
- ¿Están los edge cases?
- ¿Los AC son testables?
- ¿No contradice otros specs?

### 4. IMPLEMENT — Codear

- Crear feature branch
- Implementar SPEC.md
- Escribir tests同步
- No agregar features fuera de spec

### 5. VERIFY — Cerrar

- Tests green
- Checklist de AC completada
- PR con referencia al spec
- Code review

---

## Checklist Pre-Merge

- [ ] Spec existe en `docs/specs/`
- [ ] AC del spec cumplidos
- [ ] Tests unitarios >80% coverage
- [ ] Tests de integración passing
- [ ] No hay hardcoded secrets
- [ ] Documentación actualizada
- [ ] Conventional commit message

---

## Anti-Patrones SDD

❌ Codear primero, documentar después
❌ "Ya lo entiendo, no hace falta spec"
❌ Cambiar spec sobre la marcha sin approval
❌ Agregar features "porque quedaron lindas"
❌ Merge sin tests

✅ Spec primero, código después
✅ Cambios = nueva spec o spec update + approval
✅ El spec es la ley
