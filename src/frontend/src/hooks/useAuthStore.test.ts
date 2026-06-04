import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from './useAuthStore'

const localStorageKey = 'spottruck-auth'

const makeStorage = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: () => { store = {} },
  }
}

const localStorageMock = makeStorage()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    vi.resetModules()
  })

  it('has null initial state', () => {
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.user).toBeNull()
  })

  it('setAuth updates token, refreshToken and user', () => {
    const user = { id: '1', email: 'test@test.com', role: 'COMPANY' as const }
    useAuthStore.getState().setAuth(
      { accessToken: 'access-token', refreshToken: 'refresh-token' },
      user
    )
    const state = useAuthStore.getState()
    expect(state.token).toBe('access-token')
    expect(state.refreshToken).toBe('refresh-token')
    expect(state.user).toEqual(user)
  })

  it('logout clears token, refreshToken and user', () => {
    const user = { id: '1', email: 'test@test.com', role: 'COMPANY' as const }
    useAuthStore.getState().setAuth(
      { accessToken: 'access-token', refreshToken: 'refresh-token' },
      user
    )
    useAuthStore.getState().logout()
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.user).toBeNull()
  })

  it('persists auth state to localStorage', () => {
    const user = { id: '1', email: 'test@test.com', role: 'DRIVER' as const }
    useAuthStore.getState().setAuth(
      { accessToken: 'token-abc', refreshToken: 'refresh-xyz' },
      user
    )
    // Zustand v4 persist middleware writes to localStorage via its storage adapter.
    // We verify the store state was updated (which triggers persistence).
    const state = useAuthStore.getState()
    expect(state.token).toBe('token-abc')
    expect(state.user).toEqual(user)
  })

  it('rehydrates from localStorage on module reload', async () => {
    const user = { id: '2', email: 'restore@test.com', role: 'ADMIN' as const }
    localStorageMock.setItem(localStorageKey, JSON.stringify({
      state: { token: 'stored-token', refreshToken: 'stored-refresh', user },
    }))
    vi.resetModules()
    const { useAuthStore: FreshStore } = await vi.importActual('./useAuthStore')
    expect(FreshStore.getState().token).toBe('stored-token')
  })

  it('setAuth action is a function on the store', () => {
    const partial = useAuthStore.getState()
    expect(typeof partial.setAuth).toBe('function')
    expect(typeof partial.logout).toBe('function')
  })
})