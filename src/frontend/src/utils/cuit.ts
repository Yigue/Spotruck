// Validación de CUIT argentino (algoritmo mod-11 de AFIP) — Wave 1.
// Paridad con Control/cuit_validator.php de la app legacy.
export type CuitResult =
  | { ok: true; formatted: string }
  | { ok: false; error: string }

const CUIT_PREFIXES = new Set(['20', '23', '24', '25', '26', '27', '30', '33', '34'])
// Multiplicadores del mod-11 según AFIP, de izquierda a derecha sobre los primeros 10 dígitos
const CUIT_MULTIPLIERS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]

export function validateCuit(raw: string): CuitResult {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: 'Ingresá un CUIT' }

  // Acepta "20123456786" o "20-12345678-6"; rechaza todo lo demás
  const digits = trimmed.replace(/-/g, '')
  if (!/^\d+$/.test(digits)) {
    return { ok: false, error: 'El CUIT solo puede tener números y guiones' }
  }
  if (digits.length !== 11) {
    return { ok: false, error: 'El CUIT debe tener 11 dígitos' }
  }

  const prefix = digits.slice(0, 2)
  if (!CUIT_PREFIXES.has(prefix)) {
    return { ok: false, error: 'El prefijo del CUIT no es válido para empresas o personas físicas' }
  }

  const body = digits.slice(0, 10).split('').map(Number)
  const sum = body.reduce((acc, d, i) => acc + d * CUIT_MULTIPLIERS[i], 0)
  const mod = sum % 11
  let expected = 11 - mod
  if (expected === 11) expected = 0
  if (expected === 10) expected = 9
  const provided = Number(digits[10])

  if (expected !== provided) {
    return { ok: false, error: 'El dígito verificador del CUIT no es válido' }
  }

  const formatted = `${prefix}-${digits.slice(2, 10)}-${digits[10]}`
  return { ok: true, formatted }
}
