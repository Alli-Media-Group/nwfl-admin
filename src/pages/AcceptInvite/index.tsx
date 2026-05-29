import { CheckCircle2, Loader2, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { api } from '../../lib/api'

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)
  const [error, setError] = useState('')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) {
      setChecking(false)
      setError('No invitation token provided.')
      return
    }
    // We don't have a validate-token endpoint, so we just let the accept call handle validation.
    // But we can decode the role from the token if we want. For now, we'll just show the form
    // and let the backend reject invalid tokens on submit.
    setChecking(false)
    setValid(true)
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setSubmitting(true)
    setError('')
    try {
      await api.acceptInvitation({
        token,
        username: username.trim(),
        password,
        full_name: fullName.trim(),
      })
      setDone(true)
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
        <Card className="w-full max-w-sm p-8 text-center">
          <CheckCircle2 size={40} className="mx-auto mb-4" style={{ color: 'var(--color-success)' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Account Created
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
            Your invitation has been accepted. You can now sign in.
          </p>
          <Button onClick={() => navigate('/login')} type="button">
            Go to Sign In
          </Button>
        </Card>
      </div>
    )
  }

  if (!valid || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
        <Card className="w-full max-w-sm p-8 text-center">
          <Mail size={40} className="mx-auto mb-4" style={{ color: 'var(--color-danger)' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Invalid Invitation
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            {error || 'This invitation link is invalid or has expired.'}
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg"
            style={{ background: 'var(--color-primary)' }}
          >
            <img alt="NWFL" className="h-7 w-7 object-contain invert" src="/logo.svg" />
          </div>
          <h1 className="text-2xl" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>
            Accept Invitation
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
            Set up your account to join NWFL Admin
          </p>
        </div>

        <Card className="rounded-lg p-6 space-y-4" style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          {error && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--color-danger)' }}>
              {error}
            </p>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-2)' }}>
                Full Name
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-2)' }}>
                Username
              </label>
              <Input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-2)' }}>
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                autoComplete="new-password"
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
              Create Account
            </button>
          </form>
        </Card>
      </div>
    </div>
  )
}
