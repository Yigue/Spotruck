import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './useAuthStore'

describe('useAuthStore.updateUser', () => {
  beforeEach(() => useAuthStore.getState().logout())

  it('fusiona nombre y foto sin perder el resto del usuario', () => {
    useAuthStore
      .getState()
      .setAuth({ accessToken: 'a', refreshToken: 'r' }, { id: '1', email: 'x@y.com', role: 'DRIVER' })
    useAuthStore.getState().updateUser({ companyName: 'Fletes SA', avatarUrl: '/uploads/avatars/1.png' })
    expect(useAuthStore.getState().user).toEqual({
      id: '1',
      email: 'x@y.com',
      role: 'DRIVER',
      companyName: 'Fletes SA',
      avatarUrl: '/uploads/avatars/1.png',
    })
  })

  it('no crea un usuario si no hay sesión', () => {
    useAuthStore.getState().updateUser({ companyName: 'Nadie' })
    expect(useAuthStore.getState().user).toBeNull()
  })
})
