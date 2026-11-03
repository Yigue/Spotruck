// Utilidades compartidas por las suites e2e (scripts/*.mjs).
// Portables: usan Prisma (ya instalado) en lugar de psql/sudo/python, así corren
// igual en Docker, Windows, macOS o CI. Leen DATABASE_URL y API_URL del entorno.
import { PrismaClient } from '@prisma/client'

export const API = `${process.env.API_URL ?? 'http://localhost:4000'}/api/v1`

const prisma = new PrismaClient()

// SELECT → primer valor de la primera fila (string); cualquier otra sentencia → ejecuta
export async function sql(q) {
  if (/^\s*select/i.test(q)) {
    const rows = await prisma.$queryRawUnsafe(q)
    const first = rows[0] ? Object.values(rows[0])[0] : ''
    return String(first ?? '')
  }
  await prisma.$executeRawUnsafe(q)
  return ''
}

// PNG válido de 1x1 px para probar uploads
export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
)

export const closeDb = () => prisma.$disconnect()
