import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api, tokens } from '../lib/api'
import type { AuthUser } from '../types'

interface AuthContextValue {
  error: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  user: AuthUser | null;
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'

  // On mount — validate stored token and hydrate user
  const refresh = useCallback(async () => {
    if (!tokens.getAccess()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const current = await api.getCurrentUser()
      setUser(current)
      setError(null)
    } catch {
      tokens.clear()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  // Listen for silent-refresh failure dispatched by api.ts
  useEffect(() => {
    function handleExpired() {
      setUser(null)
      navigate('/login', { replace: true, state: { from: location } })
    }
    window.addEventListener('auth:expired', handleExpired)
    return () => window.removeEventListener('auth:expired', handleExpired)
  }, [navigate, location])

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    try {
      const current = await api.login({ username, password })
      setUser(current)
      setError(null)
      navigate(from, { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign you in.')
      throw caught
    } finally {
      setLoading(false)
    }
  }, [navigate, from])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      tokens.clear()
    } finally {
      setUser(null)
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const value = useMemo(
    () => ({ error, loading, login, logout, refresh, user }),
    [error, loading, login, logout, refresh, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
