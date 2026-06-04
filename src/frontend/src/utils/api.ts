import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Interceptor: inyecta token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('spottruck-auth')
  if (token) {
    try {
      const { state } = JSON.parse(token)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    } catch { /* ignore */ }
  }
  return config
})

// Interceptor: refresca token si expira
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const raw = localStorage.getItem('spottruck-auth')
        if (!raw) throw new Error('No auth')
        const { state } = JSON.parse(raw)
        const { data } = await axios.post('/api/v1/auth/refresh', {
          refreshToken: state.refreshToken,
        })
        const newTokens = data.data
        const current = JSON.parse(localStorage.getItem('spottruck-auth') || '{}')
        current.state.token = newTokens.accessToken
        current.state.refreshToken = newTokens.refreshToken
        localStorage.setItem('spottruck-auth', JSON.stringify(current))
        original.headers.Authorization = `Bearer ${newTokens.accessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('spottruck-auth')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
