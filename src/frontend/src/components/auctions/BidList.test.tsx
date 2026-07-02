import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BidList, type BidWithDetails } from './BidList'

const makeBid = (id: string, userId: string, amount: number): BidWithDetails => ({
  id,
  amount,
  status: 'PENDING',
  createdAt: '2026-06-01T10:00:00Z',
  user: { id: userId, companyName: `Transportista ${userId}`, ratingAvg: 4.5 },
  truck: null,
})

// El monto formateado aparece en la card mobile y en la tabla desktop.
// Intl usa espacio no separable (U+00A0), que Testing Library normaliza:
// se matchea con regex tolerante al tipo de espacio.
const countAmount = (amount: number) => {
  const grouped = amount.toLocaleString('es-AR', { minimumFractionDigits: 2 }).replace(/\./g, '\\.')
  return screen.queryAllByText(new RegExp(`\\$\\s?${grouped}`)).length
}

describe('BidList — redacción SEALED (Wave 1)', () => {
  const bids = [makeBid('b1', 'driver-1', 40000), makeBid('b2', 'driver-2', 39000)]

  it('OPEN muestra todos los montos', () => {
    render(<BidList bids={bids} canDecide={false} onDecided={() => {}} auctionType="OPEN" viewerId="driver-1" />)
    expect(countAmount(40000)).toBeGreaterThan(0)
    expect(countAmount(39000)).toBeGreaterThan(0)
    expect(screen.queryByText('Oferta sellada')).not.toBeInTheDocument()
  })

  it('SEALED oculta los montos ajenos y muestra el propio', () => {
    render(<BidList bids={bids} canDecide={false} onDecided={() => {}} auctionType="SEALED" viewerId="driver-1" />)
    expect(countAmount(40000)).toBeGreaterThan(0)
    expect(countAmount(39000)).toBe(0)
    expect(screen.getAllByText('Oferta sellada').length).toBeGreaterThan(0)
  })

  it('SEALED muestra todo a la empresa dueña del viaje', () => {
    render(
      <BidList bids={bids} canDecide onDecided={() => {}} auctionType="SEALED" viewerId="company-1" isOwner />
    )
    expect(countAmount(40000)).toBeGreaterThan(0)
    expect(countAmount(39000)).toBeGreaterThan(0)
    expect(screen.queryByText('Oferta sellada')).not.toBeInTheDocument()
  })

  it('SEALED muestra el aviso de honestidad sobre la redacción', () => {
    render(<BidList bids={bids} canDecide={false} onDecided={() => {}} auctionType="SEALED" viewerId="driver-1" />)
    expect(
      screen.getByText(/La Redacción definitiva se aplica del lado del servidor/)
    ).toBeInTheDocument()
  })

  it('sin auctionType se comporta como OPEN (compatibilidad)', () => {
    render(<BidList bids={bids} canDecide={false} onDecided={() => {}} />)
    expect(countAmount(40000)).toBeGreaterThan(0)
    expect(countAmount(39000)).toBeGreaterThan(0)
  })
})
