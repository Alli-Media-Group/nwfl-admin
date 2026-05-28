import { CalendarDays, CloudCog, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { api } from '../../lib/api'

export function SyncPage() {
  const [loading, setLoading] = useState(false)
  const [loadingFixtures, setLoadingFixtures] = useState(false)
  const [result, setResult] = useState<{
    status: string
    message?: string
    records?: number
    matches_created?: number
    matches_updated?: number
    goals_created?: number
    errors?: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [log, setLog] = useState<string>('')
  const [polling, setPolling] = useState(false)

  async function handleSync() {
    setLoading(true)
    setResult(null)
    setError(null)
    setLog('')

    try {
      const res = await api.syncFromSheet()
      setResult(res)
      if (res.status === 'started') {
        setPolling(true)
        pollLog()
      }
    } catch (e: any) {
      setError(e.message || 'Sync failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSyncFixtures() {
    setLoadingFixtures(true)
    setResult(null)
    setError(null)
    setLog('')

    try {
      const res = await api.syncFixturesFromSheet()
      setResult(res)
      if (res.status === 'started') {
        setPolling(true)
        pollLog()
      }
    } catch (e: any) {
      setError(e.message || 'Fixtures sync failed')
    } finally {
      setLoadingFixtures(false)
    }
  }

  async function pollLog() {
    try {
      const status = await api.syncStatus()
      setLog(status.log)
      // Continue polling if sync hasn't finished
      if (status.log && !status.log.includes('Done.')) {
        setTimeout(pollLog, 3000)
      } else {
        setPolling(false)
      }
    } catch {
      setPolling(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <CloudCog size={22} className="text-[var(--color-highlight)]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-highlight)]">
              Data Pipeline
            </p>
            <h3 className="mt-1 text-2xl text-[var(--color-off-white)]">
              Sync from Google Sheets
            </h3>
          </div>
        </div>

        <p className="mb-5 max-w-xl text-sm text-[var(--color-muted)]">
          Pull the latest match data, scores, and goal details directly from the
          NWFL Google Sheet. This will create new matches and update existing ones.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            icon={loading ? <Spinner size="sm" /> : <RefreshCw size={16} />}
            onClick={() => void handleSync()}
            type="button"
          >
            {loading ? 'Syncing Results...' : 'Sync Results'}
          </Button>
          <Button
            variant="outline"
            icon={loadingFixtures ? <Spinner size="sm" /> : <CalendarDays size={16} />}
            onClick={() => void handleSyncFixtures()}
            type="button"
          >
            {loadingFixtures ? 'Syncing Fixtures...' : 'Sync Fixtures'}
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="p-5" style={{ borderColor: 'rgba(186,26,26,0.30)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>{error}</p>
        </Card>
      )}

      {result && result.status === 'started' && (
        <Card className="p-5" style={{ borderColor: 'rgba(22,163,74,0.30)' }}>
          <p className="mb-1 text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
            Sync Started
          </p>
          <p className="text-xs" style={{ color: 'var(--color-success)', opacity: 0.7 }}>{result.message}</p>
          {polling && (
            <p className="mt-2 text-xs animate-pulse" style={{ color: 'var(--color-success)' }}>
              Live log updating...
            </p>
          )}
        </Card>
      )}

      {(log || polling) && (
        <Card className="p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Live Sync Log
          </p>
          <pre className="max-h-64 overflow-auto rounded-lg p-3 text-xs font-mono" style={{ background: 'var(--color-bg-subtle)', color: 'var(--color-success)' }}>
            {log || 'Waiting for output...'}
          </pre>
        </Card>
      )}

      {result && result.status === 'success' && (
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-[var(--color-highlight)]">
            Sync Complete
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Sheet Rows</p>
              <p className="mt-1 text-2xl" style={{ color: 'var(--color-text)' }}>{result.records}</p>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Matches Created</p>
              <p className="mt-1 text-2xl" style={{ color: 'var(--color-text)' }}>{result.matches_created}</p>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Matches Updated</p>
              <p className="mt-1 text-2xl" style={{ color: 'var(--color-text)' }}>{result.matches_updated}</p>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Goals Created</p>
              <p className="mt-1 text-2xl" style={{ color: 'var(--color-text)' }}>{result.goals_created}</p>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-warning)' }}>
                Warnings ({result.errors.length})
              </p>
              <div className="max-h-48 overflow-auto rounded-lg border p-3" style={{ borderColor: 'rgba(217,119,6,0.20)', background: 'rgba(217,119,6,0.05)' }}>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-sm" style={{ color: 'var(--color-warning)' }}>
                    {err}
                  </p>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
