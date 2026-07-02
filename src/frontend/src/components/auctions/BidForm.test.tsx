import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import api from '../../utils/api'
import { BidForm } from './BidForm'

vi.mock('../../utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const trucksResponse = {
  data: { data: [{ id: 'truck-1', plate: 'AB123CD', type: 'SEMI', capacityKg: 30000, active: true }] },
}

const renderForm = (auctionType?: 'OPEN' | 'DUTCH' | 'SEALED') =>
  render(
    <BrowserRouter>
      <BidForm auctionId="auction-1" currentPrice={50000} auctionType={auctionType} />
    </BrowserRouter>
  )

describe('BidForm — ramas por tipo de subasta (Wave 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue(trucksResponse)
  })

  it('OPEN muestra precio actual, monto, aclaración y botón de oferta', async () => {
    renderForm('OPEN')
    expect(screen.getByText(/Precio actual/)).toBeInTheDocument()
    expect(screen.getByLabelText('Precio')).toBeInTheDocument()
    expect(screen.getByText('Aclaración')).toBeInTheDocument()
    expect(screen.getByText('Realizar oferta')).toBeInTheDocument()
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/trucks'))
  })

  it('DUTCH solo muestra el botón ¡Tomar! (sin monto ni aclaración)', async () => {
    renderForm('DUTCH')
    expect(screen.getByText('¡Tomar!')).toBeInTheDocument()
    expect(screen.queryByLabelText('Precio')).not.toBeInTheDocument()
    expect(screen.queryByText('Aclaración')).not.toBeInTheDocument()
    await waitFor(() => expect(api.get).toHaveBeenCalled())
  })

  it('DUTCH pide confirmación y envía el precio actual', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: {} } })
    renderForm('DUTCH')
    await waitFor(() => expect(api.get).toHaveBeenCalled())

    fireEvent.click(screen.getByText('¡Tomar!'))
    expect(await screen.findByText(/Vas a aceptar el precio actual/)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Sí, tomar'))
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auctions/auction-1/bid', {
        amount: 50000,
        note: undefined,
        truckId: 'truck-1',
      })
    })
  })

  it('SEALED muestra el mensaje de privacidad y oculta el precio actual', () => {
    renderForm('SEALED')
    expect(screen.getByText(/Oferta sellada — tu propuesta es privada/)).toBeInTheDocument()
    expect(screen.queryByText(/Precio actual/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Precio')).toBeInTheDocument()
    expect(screen.getByText('Realizar oferta')).toBeInTheDocument()
  })

  it('sin auctionType se comporta como OPEN (compatibilidad)', () => {
    renderForm()
    expect(screen.getByText(/Precio actual/)).toBeInTheDocument()
    expect(screen.getByText('Realizar oferta')).toBeInTheDocument()
  })
})
