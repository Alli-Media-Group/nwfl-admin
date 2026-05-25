import { CloudCog, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { api } from '../../lib/api'

export function SyncPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    status: string
    records: number
    matches_created: number
    matches_updated: number
    goals_created: number
    errors: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSync() {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await api.syncFromSheet()
      setResult(res)
    } catch (e: any) {
      setError(e.message || 'Sync failed')
    } finally {
      setLoading(false)
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

        <Button
          icon={loading ? <Spinner size="sm" /> : <RefreshCw size={16} />}
          onClick={() => void handleSync()}
          type="button"
        >
          {loading ? 'Syncing...' : 'Run Sync'}
        </Button>
      </Card>

      {error && (
        <Card className="border-red-500/30 p-5">
          <p className="text-sm font-medium text-red-300">{error}</p>
        </Card>
      )}

      {result && (
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-[var(--color-highlight)]">
            Sync Complete
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[var(--color-border)] bg-black/20 p-4">
              <p className="text-xs text-[var(--color-muted)]">Sheet Rows</p>
              <p className="mt-1 text-2xl text-[var(--color-off-white)]">{result.records}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-black/20 p-4">
              <p className="text-xs text-[var(--color-muted)]">Matches Created</p>
              <p className="mt-1 text-2xl text-[var(--color-off-white)]">{result.matches_created}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-black/20 p-4">
              <p className="text-xs text-[var(--color-muted)]">Matches Updated</p>
              <p className="mt-1 text-2xl text-[var(--color-off-white)]">{result.matches_updated}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-black/20 p-4">
              <p className="text-xs text-[var(--color-muted)]">Goals Created</p>
              <p className="mt-1 text-2xl text-[var(--color-off-white)]">{result.goals_created}</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
                Warnings ({result.errors.length})
              </p>
              <div className="max-h-48 overflow-auto rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-sm text-amber-200">
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
