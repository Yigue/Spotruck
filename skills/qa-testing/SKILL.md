---
name: qa-testing
description: Best practices de testing para Spottruck — unit, integration, e2e, coverage, bug reporting
tags: [testing, qa, jest, playwright, vitest]
version: 1.0.0
author: Jarvis (Hermes Agent)
---

# QA Testing — Spottruck

## Strategy de Testing

```
Pyramid:
        /\
       /e2e\         ← Pocas, críticas, end-to-end
      /------\
     /integr. \       ← Medium, servicios + DB
    /  unit    \
   /------------\     ← Muchas, rápidas, aisladas
```

---

## Unit Tests

### Backend (Jest + Supertest)
```typescript
// Estructura: __tests__/unit/<module>.test.ts
// Cobertura mínima: 80%

describe('AuthService', () => {
  describe('login', () => {
    it('returns token given valid credentials', async () => { ... })
    it('throws 401 given invalid password', async () => { ... })
    it('rate limits after 5 failed attempts', async () => { ... })
  })
})
```

### Frontend (Vitest + Testing Library)
```typescript
// Estructura: src/__tests__/<Component>.test.tsx

it('renders trip card with correct price', () => {
  render(<TripCard trip={mockTrip} />)
  expect(screen.getByText('$45.000')).toBeInTheDocument()
})
```

### Naming Convention
```
test:    <acción> given <estado> returns <resultado>
feature: <lo que prueba>
```

---

## Integration Tests

```typescript
// tests/integration/trips.test.ts
// Usa DB real o test containers

it('POST /trips creates trip and returns 201', async () => {
  const res = await request(app)
    .post('/api/v1/trips')
    .set('Authorization', `Bearer ${token}`)
    .send({ origin: 'Buenos Aires', ... })

  expect(res.status).toBe(201)
  expect(res.body.data.id).toBeDefined()
})
```

---

## E2E Tests (Playwright)

```typescript
// tests/e2e/auction-flow.spec.ts

test('company creates trip and receives bids', async ({ page }) => {
  await page.goto('http://localhost:3000/trips/new')
  await page.fill('[data-testid=origin]', 'Rosario')
  await page.fill('[data-testid=destination]', 'Buenos Aires')
  await page.click('[data-testid=submit-trip]')
  
  expect(await page.locator('[data-testid=auction-live]')).toBeVisible()
})
```

---

## Coverage Requirements

| Layer | Minimum | Report |
|-------|---------|--------|
| Backend | 80% | clover.xml → SonarQube |
| Frontend | 70% | coverage/ |
| E2E | happy path + 5 edge cases | playwright-report/ |

---

## Bug Reporting

```markdown
## Bug Report

**Title:** <qué> cuando <acción> resulta en <bug>

**Severity:** P0(crash)|P1(critical)|P2(major)|P3(minor)

**Steps to Reproduce:**
1. Go to ...
2. Click on ...
3. See error

**Expected:** ...
**Actual:** ...

**Console errors:**
```
[paste error]
```

**Environment:** Chrome 125, macOS, localhost:3000
```

---

## Pre-Merge Gates

- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] E2E smoke passing
- [ ] No console errors en critical paths
- [ ] Lighthouse score >80 (Performance, Accessibility)
- [ ] Security scan clean (no secrets hardcoded)

---

## Test Data Fixtures

```typescript
// tests/fixtures/
// Mock data para todos los modelos
// Usar factories, no datos hardcoded en tests
```

---

## Continuous Testing (CI)

```yaml
# GitHub Actions
- run: npm test:unit
- run: npm test:integration  
- run: npm run test:e2e
- run: npm run test:coverage
- run: npx playwright show-report
```
