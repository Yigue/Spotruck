import { useEffect, useState } from 'react'

interface AuctionCountdownProps {
  endTime: string
  status: string
}

function remaining(endTime: string) {
  return Math.max(0, new Date(endTime).getTime() - Date.now())
}

function format(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (days > 0) return `${days}d ${h}h ${m}m`
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

// Cuenta regresiva en vivo de la subasta (se actualiza cada segundo)
export function AuctionCountdown({ endTime, status }: AuctionCountdownProps) {
  const [ms, setMs] = useState(() => remaining(endTime))

  useEffect(() => {
    setMs(remaining(endTime))
    const interval = setInterval(() => setMs(remaining(endTime)), 1000)
    return () => clearInterval(interval)
  }, [endTime])

  if (status !== 'OPEN' && status !== 'PENDING') {
    return <span className="text-sm font-semibold text-text-muted">Subasta finalizada</span>
  }

  if (ms <= 0) {
    return <span className="text-sm font-semibold text-warning">Cerrando…</span>
  }

  const urgent = ms < 5 * 60 * 1000

  return (
    <span
      className={`font-mono font-bold text-lg ${urgent ? 'text-error animate-pulse' : 'text-primary'}`}
      title="Tiempo restante de la subasta"
    >
      ⏱ {format(ms)}
    </span>
  )
}
