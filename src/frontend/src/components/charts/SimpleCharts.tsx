// Gráficos livianos en CSS/SVG puro (sin dependencias de charting)

interface BarDatum {
  label: string
  value: number
  secondary?: string
}

const formatCompact = (n: number) =>
  new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

// Gráfico de barras verticales
export function BarChart({
  data,
  color = 'bg-primary',
  valueFormatter = formatCompact,
}: {
  data: BarDatum[]
  color?: string
  valueFormatter?: (n: number) => string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-44">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-[10px] font-mono text-text-muted">
            {d.value > 0 ? valueFormatter(d.value) : ''}
          </span>
          <div
            className={`w-full rounded-t ${color} transition-all`}
            style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 1)}%` }}
            title={`${d.label}: ${d.value.toLocaleString('es-AR')}`}
          />
          <span className="text-[10px] text-text-muted truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// Barras horizontales (distribuciones)
export function HBarChart({
  data,
  color = 'bg-accent',
}: {
  data: BarDatum[]
  color?: string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2 text-sm">
          <span className="w-24 shrink-0 text-text-muted text-xs">{d.label}</span>
          <div className="flex-1 bg-background rounded h-5 overflow-hidden">
            <div
              className={`h-full rounded ${color}`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="w-10 text-right font-mono text-xs">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

// Tarjeta de KPI
export function KpiCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string
  hint?: string
  icon?: string
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <p className="text-2xl font-bold font-mono">{value}</p>
      {hint && <p className="text-xs text-text-muted mt-1">{hint}</p>}
    </div>
  )
}
