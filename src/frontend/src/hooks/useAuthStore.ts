import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  role: 'COMPANY' | 'DRIVER' | 'ADMIN'
  companyName?: string | null
  avatarUrl?: string | null
  ratingAvg?: number
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
  setAuth: (tokens: { accessToken: string; refreshToken: string }, user: User) => void
  updateUser: (patch: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (tokens, user) =>
        set({ token: tokens.accessToken, refreshToken: tokens.refreshToken, user }),
      updateUser: (patch) => set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
      logout: () => set({ token: null, refreshToken: null, user: null }),
    }),
    { name: 'spottruck-auth' }
  )
)
