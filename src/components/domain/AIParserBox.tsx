import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../lib/api'
import type { ParsedMatchResult } from '../../types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Textarea } from '../ui/Input'
import { Spinner } from '../ui/Spinner'

export function AIParserBox({
  onParsed,
}: {
  onParsed: (result: ParsedMatchResult) => void
}) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ParsedMatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleParse() {
    if (!text.trim()) return

    setLoading(true)
    setError(null)

    try {
      const parsed = await api.parseMatch(text)
      setResult(parsed)
      onParsed(parsed)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not parse input.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-highlight)]">
            <Sparkles size={14} />
            AI Match Parser
          </p>
          <h3 className="text-xl text-[var(--color-off-white)]">Paste raw updates and fill the form automatically</h3>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted)]">
            Built for quick desk entry when reporters send incomplete score updates, lineup notes, or venue changes.
          </p>
        </div>
        {result ? <Badge value={result.confidence} /> : null}
      </div>

      <div className="space-y-4">
        <Textarea
          onChange={(event) => setText(event.target.value)}
          placeholder="e.g. Matchday 7: Bayelsa Queens 2-0 Naija Ratels, Samson Siasia Stadium, Saturday 4pm"
          rows={4}
          value={text}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            icon={loading ? <Spinner size="sm" /> : <Sparkles size={16} />}
            onClick={() => void handleParse()}
            type="button"
          >
            Parse With AI
          </Button>
          {result ? (
            <p className="text-sm text-[var(--color-off-white)]">
              Filled fields for <span className="font-semibold">{result.home_team}</span> vs{' '}
              <span className="font-semibold">{result.away_team}</span>
            </p>
          ) : null}
        </div>
        {error ? <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p> : null}
      </div>
    </Card>
  )
}
