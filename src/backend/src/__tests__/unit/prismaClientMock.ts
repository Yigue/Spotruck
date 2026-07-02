/**
 * Mock manual de @prisma/client para unit tests.
 *
 * Usar en cada test file como:
 *   jest.mock('@prisma/client', () => require('./prismaClientMock'))
 *
 * Clave: PrismaClient devuelve SIEMPRE la misma instancia, así el router
 * (que instancia su propio client en models/prisma.ts) y el test espían
 * los mismos jest.fn(). También provee Prisma.Decimal y $transaction.
 */
import { jest } from '@jest/globals'

const makeModel = () => ({
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  aggregate: jest.fn(),
  groupBy: jest.fn(),
})

const instance: Record<string, any> = {
  user: makeModel(),
  trip: makeModel(),
  auction: makeModel(),
  bid: makeModel(),
  truck: makeModel(),
  payment: makeModel(),
  rating: makeModel(),
  notification: makeModel(),
  trackingLog: makeModel(),
}

// $transaction soporta callback (interactive) y array de promesas
instance.$transaction = jest.fn(async (arg: any) =>
  typeof arg === 'function' ? arg(instance) : Promise.all(arg)
)
instance.$queryRaw = jest.fn(async () => [])
instance.$disconnect = jest.fn()

// Decimal mínimo compatible con los usos del código (mul/toDecimalPlaces/toNumber)
class Decimal {
  constructor(public value: number | string | Decimal) {
    if (value instanceof Decimal) this.value = value.value
  }
  mul(factor: number | Decimal) {
    const f = factor instanceof Decimal ? Number(factor.value) : Number(factor)
    return new Decimal(Number(this.value) * f)
  }
  toDecimalPlaces(places: number) {
    return new Decimal(Number(Number(this.value).toFixed(places)))
  }
  toNumber() {
    return Number(this.value)
  }
  toString() {
    return String(this.value)
  }
  minus(other: number | Decimal) {
    const o = other instanceof Decimal ? Number(other.value) : Number(other)
    return new Decimal(Number(this.value) - o)
  }
  plus(other: number | Decimal) {
    const o = other instanceof Decimal ? Number(other.value) : Number(other)
    return new Decimal(Number(this.value) + o)
  }
  lte(other: number | Decimal) {
    return Number(this.value) <= (other instanceof Decimal ? Number(other.value) : Number(other))
  }
  lt(other: number | Decimal) {
    return Number(this.value) < (other instanceof Decimal ? Number(other.value) : Number(other))
  }
  gte(other: number | Decimal) {
    return Number(this.value) >= (other instanceof Decimal ? Number(other.value) : Number(other))
  }
  gt(other: number | Decimal) {
    return Number(this.value) > (other instanceof Decimal ? Number(other.value) : Number(other))
  }
  static isDecimal(v: unknown): v is Decimal {
    return v instanceof Decimal
  }
}

export const PrismaClient = jest.fn(() => instance)
export const Prisma = { Decimal }
export const prismaMockInstance = instance
