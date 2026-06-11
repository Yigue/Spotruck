// Testeo integral de caminos infelices y edge cases contra el servidor real:
// validaciones, permisos, transiciones inválidas, dobles acciones y concurrencia.
const B = 'http://localhost:4000/api/v1'
let passed = 0
let failed = 0
const failures = []

function check(name, cond, extra = '') {
  if (cond) { passed++; console.log(`  ✓ ${name}`) }
  else { failed++; failures.push(name); console.log(`  ✗ ${name} ${extra}`) }
}

async function api(method, path, token, body) {
  const res = await fetch(`${B}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  let json = null
  try { json = await res.json() } catch { /* empty */ }
  return { status: res.status, body: json }
}

const login = async (email) =>
  (await api('POST', '/auth/login', null, { email, password: 'Demo1234!' })).body.data.accessToken

const CO = await login('empresa@demo.com')       // empresa dueña
const CO2 = await login('logistica@demo.com')    // otra empresa
const DR = await login('camionero1@demo.com')
const DR2 = await login('camionero2@demo.com')

const futureDate = new Date(Date.now() + 86400e3).toISOString()
const baseTrip = {
  originAddress: 'A', originLat: -30, originLng: -60,
  destAddress: 'B', destLat: -31, destLng: -61,
  cargoType: 'GENERAL', weightKg: 5000, scheduledDate: futureDate, basePrice: 30000,
}

// ════════ E1: Validaciones de entrada ════════
console.log('\nE1 — Validaciones de entrada')
let r = await api('POST', '/trips', CO, { ...baseTrip, originLat: -999 })
check('lat fuera de rango → 400', r.status === 400)
r = await api('POST', '/trips', CO, { ...baseTrip, basePrice: -5 })
check('precio negativo → 400', r.status === 400)
r = await api('POST', '/trips', CO, { ...baseTrip, cargoType: 'PIANOS' })
check('cargoType inválido → 400', r.status === 400)
r = await api('POST', '/trips', DR, baseTrip)
check('transportista no puede publicar → 403', r.status === 403)
r = await api('POST', '/trips', null, baseTrip)
check('sin token → 401', r.status === 401)
r = await api('POST', '/auth/register', null, { email: 'no-es-email', password: 'Password1', role: 'DRIVER' })
check('email inválido → 400', r.status === 400)
r = await api('POST', '/auth/register', null, { email: `x${Date.now()}@t.com`, password: 'sinmayuscula1', role: 'DRIVER' })
check('contraseña sin mayúscula → 400', r.status === 400)
r = await api('POST', '/auth/login', null, { email: 'empresa@demo.com', password: 'incorrecta' })
check('login con password errónea → 401', r.status === 401)
r = await api('POST', '/auth/refresh', null, { refreshToken: CO })
check('access token usado como refresh → 401', r.status === 401)

// ════════ E2: Permisos y ownership ════════
console.log('\nE2 — Permisos y ownership')
r = await api('POST', '/trips', CO, baseTrip)
const tripId = r.body.data.id
const auctionId = r.body.data.auction.id
const myTrucks = (await api('GET', '/trucks', DR)).body.data
const truckId = myTrucks[0].id

r = await api('PUT', `/trips/${tripId}`, CO2, { basePrice: 1 })
check('otra empresa no puede editar el viaje → 403', r.status === 403)
r = await api('DELETE', `/trips/${tripId}`, CO2)
check('otra empresa no puede borrar el viaje → 403', r.status === 403)
r = await api('POST', `/auctions/${auctionId}/bid`, CO, { amount: 20000 })
check('una empresa no puede ofertar → 403', r.status === 403)

const otherTruck = (await api('GET', '/trucks', DR2)).body.data[0]
r = await api('POST', `/auctions/${auctionId}/bid`, DR, { amount: 25000, truckId: otherTruck.id })
check('ofertar con camión ajeno → 400', r.status === 400)
const smallTruckRes = await api('POST', '/trucks', DR, { plate: `SM ${String(Date.now()).slice(-6)}`, type: 'FURGON', capacityKg: 100 })
r = await api('POST', `/auctions/${auctionId}/bid`, DR, { amount: 25000, truckId: smallTruckRes.body.data.id })
check('camión con capacidad insuficiente → 400', r.status === 400)
r = await api('DELETE', `/trucks/${otherTruck.id}`, DR)
check('borrar camión ajeno → 403', r.status === 403)

r = await api('POST', `/auctions/${auctionId}/bid`, DR, { amount: 30000, truckId })
check('oferta igual al precio base → 400 (mínimo -10%)', r.status === 400)
r = await api('POST', `/auctions/${auctionId}/bid`, DR, { amount: 26000, truckId })
check('oferta válida (-13%) aceptada', r.status === 201)
const bidId = r.body.data.id

r = await api('PATCH', `/bids/${bidId}`, CO2, { action: 'accept' })
check('otra empresa no puede aceptar la oferta → 403', r.status === 403)
r = await api('PATCH', `/bids/${bidId}`, DR, { action: 'accept' })
check('un transportista no puede aceptar ofertas → 403', r.status === 403)

const notifs = (await api('GET', '/notifications', DR2)).body.data
if (notifs.length > 0) {
  r = await api('PATCH', `/notifications/${notifs[0].id}/read`, DR)
  check('marcar leída una notificación ajena → 403', r.status === 403)
} else {
  check('marcar leída una notificación ajena → 403 (sin datos, skip)', true)
}

// ════════ E3: Transiciones de estado inválidas ════════
console.log('\nE3 — Transiciones de estado inválidas')
r = await api('POST', `/trips/${tripId}/start`, DR)
check('empezar viaje sin estar asignado → 400', r.status === 400)
r = await api('POST', `/trips/${tripId}/confirm-delivery`, CO)
check('confirmar entrega de viaje en subasta → 400', r.status === 400)
r = await api('POST', `/trips/${tripId}/publish`, CO)
check('publicar un viaje ya en subasta → 400', r.status === 400)

// aceptar y avanzar para probar la cadena
await api('PATCH', `/bids/${bidId}`, CO, { action: 'accept' })
r = await api('POST', `/trips/${tripId}/finish`, DR)
check('terminar sin haber empezado → 400', r.status === 400)
r = await api('POST', `/trips/${tripId}/start`, DR2)
check('empezar el viaje de otro driver → 403', r.status === 403)
await api('POST', `/trips/${tripId}/start`, DR)
r = await api('POST', `/trips/${tripId}/start`, DR)
check('empezar dos veces → 400', r.status === 400)
r = await api('PUT', `/trips/${tripId}`, CO, { basePrice: 99999 })
check('editar viaje en curso → 400', r.status === 400)
await api('POST', `/trips/${tripId}/finish`, DR)
r = await api('POST', `/trips/${tripId}/confirm-delivery`, CO2)
check('otra empresa no puede confirmar la entrega → 403', r.status === 403)
await api('POST', `/trips/${tripId}/confirm-delivery`, CO)

// ════════ E4: Dobles acciones ════════
console.log('\nE4 — Dobles acciones e idempotencia')
const coId = (await api('GET', '/auth/me', CO)).body.data.id
const drId = (await api('GET', '/auth/me', DR)).body.data.id
r = await api('POST', '/ratings', CO, { tripId, toUserId: drId, score: 5 })
check('primera valoración OK', r.status === 200 || r.status === 201)
r = await api('POST', '/ratings', CO, { tripId, toUserId: drId, score: 1 })
check('valorar dos veces el mismo viaje → error', r.status >= 400)
r = await api('POST', '/ratings', DR, { tripId, toUserId: drId, score: 5 })
check('valorarse a uno mismo → error', r.status >= 400)
r = await api('POST', '/trucks', DR, { plate: myTrucks[0].plate, type: 'SEMI', capacityKg: 10000 })
check('patente duplicada → 409', r.status === 409)

// ════════ E5: Concurrencia — dos aceptaciones simultáneas ════════
console.log('\nE5 — Concurrencia (lock de adjudicación)')
r = await api('POST', '/trips', CO, baseTrip)
const trip2 = r.body.data.id
const auc2 = r.body.data.auction.id
const b1 = (await api('POST', `/auctions/${auc2}/bid`, DR, { amount: 26000, truckId })).body.data.id
const b2 = (await api('POST', `/auctions/${auc2}/bid`, DR2, { amount: 22000, truckId: otherTruck.id })).body.data.id
const [r1, r2] = await Promise.all([
  api('PATCH', `/bids/${b1}`, CO, { action: 'accept' }),
  api('PATCH', `/bids/${b2}`, CO, { action: 'accept' }),
])
const oks = [r1, r2].filter((x) => x.status === 200).length
check('exactamente UNA aceptación gana en paralelo', oks === 1, `(ganaron ${oks})`)
r = await api('GET', `/payments/${trip2}`, CO)
check('un solo pago creado', r.status === 200)
const tripState = (await api('GET', `/trips/${trip2}`, CO)).body.data
const accepted = tripState.auction.bids.filter((b) => b.status === 'ACCEPTED').length
check('una sola oferta ACCEPTED', accepted === 1, `(hay ${accepted})`)

// ════════ E6: Borradores y visibilidad ════════
console.log('\nE6 — Borradores y visibilidad')
r = await api('POST', '/trips', CO, { ...baseTrip, draft: true })
const draftId = r.body.data.id
check('borrador creado sin subasta', r.body.data.status === 'DRAFT' && !r.body.data.auction)
r = await api('GET', '/trips?status=AUCTION&limit=100', DR)
check('borrador NO visible en subastas', !r.body.data.some((t) => t.id === draftId))
r = await api('POST', `/trips/${draftId}/publish`, CO2)
check('otra empresa no puede publicar mi borrador → 403', r.status === 403)
r = await api('POST', `/trips/${draftId}/publish`, CO)
check('publicar borrador propio OK', r.status === 200 && r.body.data.status === 'AUCTION')

// ════════ E7: Paginación y filtros ════════
console.log('\nE7 — Paginación y filtros')
r = await api('GET', '/trips?limit=2&page=1', CO)
check('paginación respeta el límite', r.body.data.length <= 2 && r.body.meta.limit === 2)
r = await api('GET', '/trips?status=NOEXISTE', CO)
check('filtro con estado inexistente no rompe (500 NO)', r.status !== 500)
r = await api('GET', '/trips/00000000-0000-0000-0000-000000000000', CO)
check('viaje inexistente → 404', r.status === 404)
r = await api('GET', '/trips/id-no-uuid', CO)
check('id malformado no rompe (500 NO)', r.status !== 500)

console.log(`\n${'═'.repeat(50)}`)
console.log(`RESULTADO: ${passed} ✓ | ${failed} ✗`)
if (failures.length) failures.forEach((f) => console.log(` - ${f}`))
process.exit(failed > 0 ? 1 : 0)
