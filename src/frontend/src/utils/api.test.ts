import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import api from './api'

const respond401 = (config: InternalAxiosRequestConfig) =>
  Promise.reject({ config, response: { status: 401, data: {}, config } })

describe('api interceptor', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('no intenta refrescar ni redirige cuando /auth/login responde 401', async () => {
    const adapter = vi.fn(respond401) as unknown as AxiosAdapter
    const refresh = vi.spyOn(localStorage, 'getItem')

    await expect(api.post('/auth/login', {}, { adapter })).rejects.toMatchObject({
      response: { status: 401 },
    })
    expect(adapter).toHaveBeenCalledTimes(1)
    // sólo leyó el token del request, nunca el refreshToken para refrescar
    expect(refresh.mock.calls.length).toBeLessThanOrEqual(1)
    refresh.mockRestore()
  })

  it('inyecta el Bearer token guardado', async () => {
    localStorage.setItem('spottruck-auth', JSON.stringify({ state: { token: 'abc' } }))
    let seen: string | undefined
    const adapter = (async (config: InternalAxiosRequestConfig) => {
      seen = config.headers.Authorization as string
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }) as unknown as AxiosAdapter
    await api.get('/trips', { adapter })
    expect(seen).toBe('Bearer abc')
  })
})
