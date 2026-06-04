import { useEffect, useState } from 'react'
import api from '../utils/api'

export default function AuctionPage() {
  const [auctions, setAuctions] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    api.get('/auctions').then(({ data }) => setAuctions(data.data)).catch(() => {})
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Subastas activas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {auctions.map((auction) => (
          <div key={auction.id as string} className="card">
            <p className="text-xs text-text-muted mb-1">Subasta</p>
            <p className="font-mono font-bold text-accent">${((auction as Record<string, unknown>).currentPrice as number)?.toLocaleString('es-AR')}</p>
            <p className="text-sm mt-2">{(((auction as Record<string, unknown>).trip as Record<string, unknown>)?.originAddress as string) || '—'} → {(((auction as Record<string, unknown>).trip as Record<string, unknown>)?.destAddress as string) || '—'}</p>
            <span className={`badge mt-2 ${(auction.status as string) === 'OPEN' ? 'badge-success' : 'badge-info'}`}>
              {(auction.status as string)}
            </span>
          </div>
        ))}
        {auctions.length === 0 && (
          <div className="text-text-muted col-span-full text-center py-8">No hay subastas activas</div>
        )}
      </div>
    </div>
  )
}
