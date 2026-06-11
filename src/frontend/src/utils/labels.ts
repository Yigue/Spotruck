// Etiquetas y colores compartidos para estados y tipos (una sola fuente
// de verdad para toda la UI)

export const tripStatusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  OPEN: 'Abierto',
  AUCTION: 'En subasta',
  ASSIGNED: 'Asignado',
  IN_PROGRESS: 'En viaje',
  DELIVERED: 'Esperando confirmación',
  SETTLED: 'Finalizado',
  CANCELLED: 'Vencido / cancelado',
}

export const tripStatusVariant: Record<
  string,
  'success' | 'warning' | 'error' | 'info' | 'default' | 'accent'
> = {
  DRAFT: 'default',
  OPEN: 'success',
  AUCTION: 'success',
  ASSIGNED: 'accent',
  IN_PROGRESS: 'info',
  DELIVERED: 'warning',
  SETTLED: 'default',
  CANCELLED: 'error',
}

export const cargoLabels: Record<string, string> = {
  BULK: 'Granel',
  PALLETS: 'Pallets',
  GENERAL: 'General',
  REFRIGERATED: 'Refrigerada',
}
