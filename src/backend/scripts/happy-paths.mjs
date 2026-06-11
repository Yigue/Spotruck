// Verificación end-to-end de los happy paths de Spottruck contra el server real.
// Usuarios nuevos (no del seed) para validar el funnel completo desde cero.
import { execSync } from 'child_process'

const B = 'http://localhost:4000/api/v1'
let passed = 0
let failed = 0
const failures = []

function check(name, cond, extra = '') {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    failures.push(`${name} ${extra}`)
    console.log(`  ✗ ${name} ${extra}`)
  }
}

async function api(method, path, token, body) {
  const res = await fetch(`${B}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let json = null
  try { json = await res.json() } catch { /* empty */ }
  return { status: res.status, body: json }
}

function sql(q) {
  return execSync(
    `sudo -u postgres psql -t -A spottruck -c "${q.replace(/"/g, '\\"')}"`,
    { encoding: 'utf8' }
  ).trim()
}

const ts = Date.now()
const emailCo = `hp-empresa-${ts}@test.com`
const emailDr = `hp-driver-${ts}@test.com`
const emailDr2 = `hp-driver2-${ts}@test.com`

// ════════ HP1: Registro de empresa + verificación de email ════════
console.log('\nHP1 — Registro de empresa y verificación de email')
let r = await api('POST', '/auth/register', null, {
  email: emailCo, password: 'Password1', role: 'COMPANY',
  companyName: 'HappyPath SA', companyCuit: '30-11111111-1', phone: '+54 9 11 4444 0001',
})
check('registro empresa devuelve tokens', r.status === 201 && !!r.body.data.accessToken)
const CO = r.body.data.accessToken

r = await api('GET', '/auth/me', CO)
check('emailVerified arranca en false', r.body.data.emailVerified === false)

const vtoken = sql(`SELECT email_verify_token FROM users WHERE email='${emailCo}'`)
check('token de verificación generado', vtoken.length > 10)
r = await api('POST', '/auth/verify-email', null, { token: vtoken })
check('verify-email funciona', r.status === 200 && r.body.data.verified === true)
r = await api('GET', '/auth/me', CO)
check('emailVerified queda en true', r.body.data.emailVerified === true)

// ════════ HP2: Registro transportista + flota + verificación admin ════════
console.log('\nHP2 — Transportista: registro, flota y verificación admin')
r = await api('POST', '/auth/register', null, {
  email: emailDr, password: 'Password1', role: 'DRIVER',
  companyName: 'Carlos Camionero', driverLicense: 'LIC-9999', phone: '+54 9 11 4444 0002',
})
check('registro transportista', r.status === 201)
const DR = r.body.data.accessToken

r = await api('POST', '/trucks', DR, { plate: `HP ${String(ts).slice(-6)}`, type: 'JAULA', capacityKg: 20000, preferredCargo: 'GENERAL' })
check('alta de camión en la flota', r.status === 201)
const truckId = r.body.data.id

r = await api('GET', '/trucks', DR)
check('flota propia listada', r.body.data.length === 1)

r = await api('POST', '/users/me/request-verification', DR)
check('solicitar verificación (con licencia y camión)', r.status === 200 && r.body.data.documentsStatus === 'PENDING')

let admin = await api('POST', '/auth/login', null, { email: 'admin@spottruck.com', password: 'Demo1234!' })
const ADM = admin.body.data.accessToken
const drId = sql(`SELECT id FROM users WHERE email='${emailDr}'`)
r = await api('PATCH', `/users/${drId}/verify`, ADM, { action: 'approve' })
check('admin aprueba documentación', r.body.data?.documentsStatus === 'APPROVED')
r = await api('GET', `/users/${drId}/profile`, CO)
check('perfil público muestra APPROVED (insignia ✓)', r.body.data.documentsStatus === 'APPROVED')
r = await api('GET', '/notifications', DR)
check('driver notificado de la aprobación', r.body.data.some((n) => n.type === 'DOCUMENTS_REVIEWED'))

// ════════ HP3: Empresa publica viaje → nace en subasta visible ════════
console.log('\nHP3 — Publicar viaje (nace en subasta, visible para transportistas)')
const endDate = new Date(Date.now() + 48 * 3600e3).toISOString()
r = await api('POST', '/trips', CO, {
  originAddress: 'Belén, Catamarca', originLat: -27.65, originLng: -67.03,
  originProvince: 'Catamarca', originCity: 'Belén',
  destAddress: 'Valle Viejo, Catamarca', destLat: -28.6, destLng: -65.7,
  destProvince: 'Catamarca', destCity: 'Valle Viejo',
  distanceKm: 306, durationMin: 237,
  cargoType: 'BULK', weightKg: 15000, volumeDesc: 'Maíz a granel',
  scheduledDate: new Date(Date.now() + 24 * 3600e3).toISOString(), endDate,
  basePrice: 50000,
})
check('publicación creada en AUCTION', r.status === 201 && r.body.data.status === 'AUCTION')
check('subasta abierta automáticamente', r.body.data.auction?.status === 'OPEN')
check('subasta cierra en la fecha fin', r.body.data.auction?.endTime === endDate)
const tripId = r.body.data.id
const auctionId = r.body.data.auction.id

r = await api('GET', '/trips?status=AUCTION&limit=100', DR)
check('visible para el transportista (Explorar)', r.body.data.some((t) => t.id === tripId))

// ════════ HP4: Transportista ve detalle y se postula ════════
console.log('\nHP4 — Postularse con camión, precio y aclaración')
r = await api('GET', `/trips/${tripId}`, DR)
check('detalle con datos completos (distancia/duración/volumen)', r.body.data.distanceKm === 306 && r.body.data.volumeDesc === 'Maíz a granel')
check('teléfono de la empresa visible (WhatsApp)', !!r.body.data.user.phone)

r = await api('POST', `/auctions/${auctionId}/bid`, DR, { amount: 44000, truckId, note: 'Tengo factura A' })
check('oferta con camión y aclaración', r.status === 201 && r.body.data.status === 'PENDING')
const bidId = r.body.data.id

// segundo postulante (del seed)
const d2 = await api('POST', '/auth/login', null, { email: 'camionero2@demo.com', password: 'Demo1234!' })
const DR2 = d2.body.data.accessToken
const trucks2 = await api('GET', '/trucks', DR2)
r = await api('POST', `/auctions/${auctionId}/bid`, DR2, { amount: 39000, truckId: trucks2.body.data[0].id })
check('segundo postulante oferta', r.status === 201)

r = await api('GET', '/notifications', CO)
check('empresa notificada de las ofertas (NEW_BID)', r.body.data.filter((n) => n.type === 'NEW_BID').length >= 2)

// ════════ HP5: Empresa compara postulantes y acepta ════════
console.log('\nHP5 — Aceptar oferta (cierra subasta, asigna viaje, hold de pago)')
r = await api('GET', `/trips/${tripId}`, CO)
check('empresa ve tabla de postulantes (2 ofertas)', r.body.data.auction.bids.length === 2)
check('empresa ve teléfono y camión del postulante', !!r.body.data.auction.bids.find((b) => b.id === bidId)?.user.phone && !!r.body.data.auction.bids.find((b) => b.id === bidId)?.truck)

r = await api('PATCH', `/bids/${bidId}`, CO, { action: 'accept' })
check('aceptar oferta', r.status === 200 && r.body.data.bid.status === 'ACCEPTED')
check('pago en custodia (HELD, modo simulado)', r.body.data.payment.status === 'HELD' && r.body.data.payment.amount === 44000)

r = await api('GET', `/trips/${tripId}`, CO)
check('viaje ASSIGNED', r.body.data.status === 'ASSIGNED')
check('subasta SETTLED', r.body.data.auction.status === 'SETTLED')
check('otra oferta REJECTED', r.body.data.auction.bids.every((b) => b.id === bidId ? b.status === 'ACCEPTED' : b.status === 'REJECTED'))

r = await api('GET', '/notifications', DR)
check('ganador notificado (BID_ACCEPTED)', r.body.data.some((n) => n.type === 'BID_ACCEPTED'))
r = await api('GET', '/notifications', DR2)
check('perdedor notificado (BID_REJECTED)', r.body.data.some((n) => n.type === 'BID_REJECTED'))

// ════════ HP6: Ciclo del viaje con tracking ════════
console.log('\nHP6 — Stepper del viaje: empezar → tracking → terminar → confirmar')
r = await api('POST', `/trips/${tripId}/start`, DR)
check('driver empieza (IN_PROGRESS)', r.body.data?.status === 'IN_PROGRESS')

r = await api('POST', `/tracking/${tripId}`, DR, { lat: -28.0, lng: -66.5, speed: 80 })
check('driver comparte ubicación', r.status === 201)
r = await api('GET', `/tracking/${tripId}/current`, CO)
check('empresa ve la posición actual', r.body.data?.lat === -28.0)

r = await api('POST', `/trips/${tripId}/finish`, DR)
check('driver termina (DELIVERED, esperando confirmación)', r.body.data?.status === 'DELIVERED')

const completedBefore = Number(sql(`SELECT trips_completed FROM users WHERE id='${drId}'`))
r = await api('POST', `/trips/${tripId}/confirm-delivery`, CO)
check('empresa confirma (SETTLED)', r.body.data?.status === 'SETTLED')
r = await api('GET', `/payments/${tripId}`, DR)
check('pago liberado al transportista (RELEASED)', r.body.data.status === 'RELEASED' && r.body.data.netAmount === 40480)
const completedAfter = Number(sql(`SELECT trips_completed FROM users WHERE id='${drId}'`))
check('tripsCompleted del driver +1', completedAfter === completedBefore + 1)

// ════════ HP7: Valoración bidireccional ════════
console.log('\nHP7 — Valoraciones cruzadas')
const coId = sql(`SELECT id FROM users WHERE email='${emailCo}'`)
r = await api('POST', '/ratings', CO, { tripId, toUserId: drId, score: 5, punctuality: 5, communication: 5, cargoCondition: 5, comment: 'Muy buen conductor' })
check('empresa valora al transportista', r.status === 201 || r.status === 200)
r = await api('POST', '/ratings', DR, { tripId, toUserId: coId, score: 4, punctuality: 4, communication: 5, cargoCondition: 4, comment: 'Todo a tiempo y rápido' })
check('transportista valora a la empresa', r.status === 201 || r.status === 200)
r = await api('GET', `/users/${drId}/profile`, CO)
check('rating del driver actualizado (5.0)', r.body.data.ratingAvg === 5 && r.body.data.ratingCount === 1)
r = await api('GET', `/trips/${tripId}`, CO)
check('trip expone ratings (para ocultar botón Valorar)', r.body.data.ratings.length === 2)

// ════════ HP8: Estadísticas reflejan la actividad ════════
console.log('\nHP8 — Estadísticas por rol')
r = await api('GET', '/stats/me', DR)
check('driver: ingreso registrado en stats', r.body.data.kpis.totalIncome === 40480 && r.body.data.kpis.bidsAccepted === 1)
r = await api('GET', '/stats/me', CO)
check('empresa: gasto y viaje finalizado en stats', r.body.data.kpis.totalSpend === 44000 && r.body.data.kpis.tripsSettled === 1)

// ════════ HP9: Cierre automático por vencimiento (cron) ════════
console.log('\nHP9 — Cierre automático de subasta vencida (adjudica al menor precio)')
r = await api('POST', '/trips', CO, {
  originAddress: 'A', originLat: -30, originLng: -60, destAddress: 'B', destLat: -31, destLng: -61,
  cargoType: 'GENERAL', weightKg: 1000, scheduledDate: new Date(Date.now() + 24 * 3600e3).toISOString(), basePrice: 20000,
})
const trip2 = r.body.data.id
const auc2 = r.body.data.auction.id
await api('POST', `/auctions/${auc2}/bid`, DR, { amount: 17500, truckId })
// vencer la subasta y esperar a que el CRON REAL del servidor la cierre (corre cada 60s)
sql(`UPDATE auctions SET end_time = NOW() - INTERVAL '1 minute' WHERE id='${auc2}'`)
console.log('  … esperando el ciclo del cron (hasta 75s)')
for (let i = 0; i < 15; i++) {
  await new Promise((res) => setTimeout(res, 5000))
  r = await api('GET', `/trips/${trip2}`, CO)
  if (r.body.data.auction.status === 'SETTLED') break
}
check('cron adjudica al mejor postor y asigna', r.body.data.status === 'ASSIGNED' && r.body.data.auction.status === 'SETTLED')
r = await api('GET', `/payments/${trip2}`, CO)
check('pago creado por el cierre automático', r.body.data.status === 'HELD' && r.body.data.amount === 17500)

// ════════ HP9b: Subasta vencida SIN ofertas ════════
console.log('\nHP9b — Subasta vencida sin ofertas')
r = await api('POST', '/trips', CO, {
  originAddress: 'C', originLat: -30, originLng: -60, destAddress: 'D', destLat: -31, destLng: -61,
  cargoType: 'GENERAL', scheduledDate: new Date(Date.now() + 24 * 3600e3).toISOString(), basePrice: 9000,
})
const trip3 = r.body.data.id
const auc3 = r.body.data.auction.id
sql(`UPDATE auctions SET end_time = NOW() - INTERVAL '1 minute' WHERE id='${auc3}'`)
console.log('  … esperando el ciclo del cron (hasta 75s)')
for (let i = 0; i < 15; i++) {
  await new Promise((res) => setTimeout(res, 5000))
  r = await api('GET', `/trips/${trip3}`, CO)
  if (r.body.data.auction.status === 'SETTLED') break
}
console.log(`  → estado del viaje tras vencer sin ofertas: trip=${r.body.data.status}, auction=${r.body.data.auction.status}`)
check('viaje sin ofertas NO queda zombie en AUCTION', r.body.data.status !== 'AUCTION', `(quedó en ${r.body.data.status})`)

// ════════ Resumen ════════
console.log(`\n${'═'.repeat(50)}`)
console.log(`RESULTADO: ${passed} ✓ | ${failed} ✗`)
if (failures.length) {
  console.log('Fallas:')
  failures.forEach((f) => console.log(` - ${f}`))
}
process.exit(failed > 0 ? 1 : 0)
