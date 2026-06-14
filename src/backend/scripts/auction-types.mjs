// Verificación e2e de tipos de subasta DUTCH y SEALED + documentos de camión.
import { execSync } from 'child_process'
import fs from 'fs'
const B = 'http://localhost:4000/api/v1'
let pass = 0, fail = 0
const check = (n, c, x='') => { if (c) { pass++; console.log('  ✓', n) } else { fail++; console.log('  ✗', n, x) } }
async function api(m, p, t, b) {
  const r = await fetch(`${B}${p}`, { method: m, headers: { 'Content-Type':'application/json', ...(t?{Authorization:`Bearer ${t}`}:{}) }, body: b?JSON.stringify(b):undefined })
  let j=null; try{j=await r.json()}catch{}; return { status:r.status, body:j }
}
const sql = (q) => execSync(`sudo -u postgres psql -t -A spottruck -c "${q.replace(/"/g,'\\"')}"`,{encoding:'utf8'}).trim()
const login = async (e)=>(await api('POST','/auth/login',null,{email:e,password:'Demo1234!'})).body.data.accessToken

const CO=await login('empresa@demo.com'), D1=await login('camionero1@demo.com'), D2=await login('camionero2@demo.com')
const t1=(await api('GET','/trucks',D1)).body.data[0], t2=(await api('GET','/trucks',D2)).body.data[0]
const future=new Date(Date.now()+86400e3).toISOString()
const baseTrip={originAddress:'Belén, Catamarca',originLat:-27.6,originLng:-67,destAddress:'Valle Viejo',destLat:-28.6,destLng:-65.7,cargoType:'BULK',weightKg:8000,scheduledDate:future,basePrice:60000}

console.log('\nDUTCH — selección de tipo, decremento y "tomar"')
let r=await api('POST','/trips',CO,{...baseTrip,auctionType:'DUTCH',reservePrice:30000})
check('publicar viaje como DUTCH', r.status===201 && r.body.data.auction?.status==='OPEN', JSON.stringify(r.body).slice(0,100))
const tripId=r.body.data.id
const aucId=r.body.data.auction.id
let det=await api('GET',`/auctions/${aucId}`,D1)
check('tipo DUTCH y precio inicial = base', det.body.data.type==='DUTCH' && Number(det.body.data.currentPrice)===60000)
// simular paso del tiempo y disparar tick (cron cada 15s)
sql(`UPDATE auctions SET start_time = NOW() - INTERVAL '12 hours' WHERE id='${aucId}'`)
console.log('  … esperando tick de decremento (16s)')
await new Promise(s=>setTimeout(s,16000))
det=await api('GET',`/auctions/${aucId}`,D1)
const pNow=Number(det.body.data.currentPrice)
check('el precio bajó', pNow<60000, `(${pNow})`)
check('no baja del piso (30000)', pNow>=30000, `(${pNow})`)
r=await api('POST',`/auctions/${aucId}/bid`,D1,{amount:pNow,truckId:t1.id})
check('D1 toma el viaje', r.status===201 && r.body.data.status==='ACCEPTED', JSON.stringify(r.body).slice(0,100))
r=await api('POST',`/auctions/${aucId}/bid`,D2,{amount:pNow,truckId:t2.id})
check('D2 llega tarde → 4xx', r.status>=400, `(${r.status})`)
check('viaje ASSIGNED', (await api('GET',`/trips/${tripId}`,CO)).body.data.status==='ASSIGNED')
check('pago HELD', (await api('GET',`/payments/${tripId}`,CO)).body.data.status==='HELD')

console.log('\nSEALED — montos ajenos redactados para el transportista')
r=await api('POST','/trips',CO,{...baseTrip,basePrice:40000,auctionType:'SEALED'})
const sTrip=r.body.data.id, sAuc=r.body.data.auction.id
await api('POST',`/auctions/${sAuc}/bid`,D1,{amount:35000,truckId:t1.id,note:'mia'})
await api('POST',`/auctions/${sAuc}/bid`,D2,{amount:33000,truckId:t2.id})
const dv=await api('GET',`/trips/${sTrip}`,D1)
const bids=dv.body.data.auction.bids
check('D1 ve su monto', bids.some(b=>b.amount===35000))
check('D1 NO ve montos ajenos', bids.filter(b=>b.amount!==35000).every(b=>b.amount===null), JSON.stringify(bids.map(b=>b.amount)))
check('empresa ve todos los montos', (await api('GET',`/trips/${sTrip}`,CO)).body.data.auction.bids.every(b=>typeof b.amount==='number'))

console.log('\nDocumentos de camión — upload real (multer)')
execSync(`python3 -c "import zlib,struct
def c(t,d): x=t+d; return struct.pack('>I',len(d))+x+struct.pack('>I',zlib.crc32(x))
open('/tmp/td.png','wb').write(b'\\x89PNG\\r\\n\\x1a\\n'+c(b'IHDR',struct.pack('>IIBBBBB',1,1,8,6,0,0,0))+c(b'IDAT',zlib.compress(b'\\x00\\x10\\x80\\x20\\xff'))+c(b'IEND',b''))"`)
const fd=new FormData()
fd.append('document', new Blob([fs.readFileSync('/tmp/td.png')],{type:'image/png'}), 'cedula.png')
const up=await fetch(`${B}/trucks/${t1.id}/documents`,{method:'POST',headers:{Authorization:`Bearer ${D1}`},body:fd})
const upj=await up.json()
check('subir documento de camión', up.status===200 && upj.data.documentsUrl?.length>0, JSON.stringify(upj).slice(0,100))

console.log(`\n${'='.repeat(40)}\nRESULTADO: ${pass} ✓ | ${fail} ✗`)
process.exit(fail>0?1:0)
