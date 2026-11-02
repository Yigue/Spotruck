import { describe, it, expect } from 'vitest'
import { validateCuit } from './cuit'

// Dígitos verificadores calculados con el algoritmo mod-11 de AFIP:
// 2012345678 → suma 148, resto 5, dígito 6
// 3012345678 → suma 153, resto 10, dígito 9→... (11-10=1) dígito 1
// 2012345684 → suma 143, resto 0, caso especial 11→0
// 2012345676 → suma 144, resto 1, caso especial 10→9
describe('validateCuit', () => {
  it.each([
    ['20-12345678-6', '20-12345678-6'],
    ['20123456786', '20-12345678-6'],
    ['30-12345678-1', '30-12345678-1'],
    ['  20-12345678-6  ', '20-12345678-6'],
  ])('acepta %s y lo normaliza a %s', (input, formatted) => {
    expect(validateCuit(input)).toEqual({ ok: true, formatted })
  })

  it('caso especial mod 11 → dígito 0', () => {
    expect(validateCuit('20-12345684-0')).toEqual({ ok: true, formatted: '20-12345684-0' })
  })

  it('caso especial mod 10 → dígito 9', () => {
    expect(validateCuit('20-12345676-9')).toEqual({ ok: true, formatted: '20-12345676-9' })
  })

  it('rechaza CUIT vacío', () => {
    expect(validateCuit('')).toEqual({ ok: false, error: 'Ingresá un CUIT' })
    expect(validateCuit('   ')).toEqual({ ok: false, error: 'Ingresá un CUIT' })
  })

  it.each(['2012345678', '201234567890'])('rechaza longitud inválida: %s', (input) => {
    expect(validateCuit(input)).toEqual({ ok: false, error: 'El CUIT debe tener 11 dígitos' })
  })

  it('rechaza caracteres no numéricos', () => {
    expect(validateCuit('20-1234567A-9')).toEqual({
      ok: false,
      error: 'El CUIT solo puede tener números y guiones',
    })
  })

  it('rechaza prefijo desconocido', () => {
    expect(validateCuit('99-12345678-9')).toEqual({
      ok: false,
      error: 'El prefijo del CUIT no es válido para empresas o personas físicas',
    })
  })

  it('rechaza dígito verificador incorrecto', () => {
    expect(validateCuit('20-12345678-9')).toEqual({
      ok: false,
      error: 'El dígito verificador del CUIT no es válido',
    })
  })
})
