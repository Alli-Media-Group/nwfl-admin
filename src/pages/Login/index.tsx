import { LogIn } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'

export function LoginPage() {
  const { error, loading, login, user } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  if (user) return <Navigate to="/" replace />

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo + wordmark */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg"
            style={{ background: 'var(--color-primary)' }}
          >
            <img alt="NWFL" className="h-7 w-7 object-contain" src="/logo.svg" />
          </div>
          <h1 className="text-2xl" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>
            NWFL Admin
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
            Sign in to the editorial desk
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-lg p-6 space-y-4"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); void login(username, password) }}
          >
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-2)' }}>
                Username
              </label>
              <input
                className="field-base"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="your username"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-2)' }}>
                Password
              </label>
              <input
                className="field-base"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--color-danger)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? <Spinner size="sm" /> : <LogIn size={15} />}
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--color-muted)' }}>
          Staff accounts only · Contact admin to get access
        </p>
      </div>
    </div>
  )
}
