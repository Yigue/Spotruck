// Validación de CUIT argentino (módulo 11) — portado del legacy
// (Control/validar.php) con chequeo de prefijo agregado.

const MULTIPLIERS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
const VALID_PREFIXES = ['20', '23', '24', '25', '26', '27', '30', '33', '34']

/** Acepta "XX-XXXXXXXX-X" o 11 dígitos seguidos. */
export function validateCuit(raw: string): boolean {
  const digits = raw.replace(/-/g, '')
  if (!/^\d{11}$/.test(digits)) return false
  if (!VALID_PREFIXES.includes(digits.slice(0, 2))) return false

  const acum = MULTIPLIERS.reduce((sum, mult, i) => sum + Number(digits[i]) * mult, 0)
  let check = 11 - (acum % 11)
  if (check === 11) check = 0
  if (check === 10) check = 9

  return Number(digits[10]) === check
}

export const CUIT_ERROR = 'CUIT inválido: verificá el número (formato XX-XXXXXXXX-X)'
