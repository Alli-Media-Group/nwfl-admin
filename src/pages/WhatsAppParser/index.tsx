import { Check, MessageSquareText, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Textarea } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { api } from '../../lib/api'
import type { ParsedMatchResult } from '../../types'

interface ParsedRow extends ParsedMatchResult {
  localId: string;
}

export function WhatsAppParserPage() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [savedCount, setSavedCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)

  async function handleParse() {
    setLoading(true)
    try {
      const response = await api.parseWhatsApp(text)
      setRows(response.map((row, index) => ({ ...row, localId: `${row.home_team}-${row.away_team}-${index}` })))
      setSavedCount(0)
      setSkippedCount(0)
    } finally {
      setLoading(false)
    }
  }

  async function approve(row: ParsedRow) {
    await api.createMatch({
      away_score: row.away_score,
      away_team_name: row.away_team,
      date: row.date,
      home_score: row.home_score,
      home_team_name: row.home_team,
      kick_off: row.kick_off,
      matchday: row.matchday,
      pending_reason: row.pending_reason,
      status: row.status,
      venue: row.venue,
    })
    setRows((current) => current.filter((item) => item.localId !== row.localId))
    setSavedCount((current) => current + 1)
  }

  function skip(localId: string) {
    setRows((current) => current.filter((item) => item.localId !== localId))
    setSkippedCount((current) => current + 1)
  }

  const summary = useMemo(() => {
    if (!savedCount && !skippedCount) return null
    return `${savedCount} matches saved, ${skippedCount} skipped.`
  }, [savedCount, skippedCount])

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-highlight)]">
            <MessageSquareText size={14} />
            WhatsApp Match Parser
          </p>
          <h3 className="mt-2 text-2xl text-[var(--color-off-white)]">Paste a full chat export and extract match results</h3>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
            This view is designed for editors who receive long matchday threads from field correspondents and need to approve only the usable entries.
          </p>
        </div>
        <Textarea
          className="font-mono text-sm"
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste the WhatsApp export here..."
          rows={12}
          value={text}
        />
        <div className="mt-4">
          <Button icon={loading ? <Spinner size="sm" /> : <Sparkles size={16} />} onClick={() => void handleParse()} type="button">
            Parse Chat
          </Button>
        </div>
      </Card>

      {summary ? <p className="text-sm font-medium text-[var(--color-off-white)]">{summary}</p> : null}

      <div className="space-y-4">
        {rows.map((row) => (
          <Card className="p-5" key={row.localId}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl text-[var(--color-off-white)]">
                    {row.home_team} {row.home_score ?? '-'}:{row.away_score ?? '-'} {row.away_team}
                  </h3>
                  <Badge value={row.confidence} />
                  <Badge value={row.status} />
                </div>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  Matchday {row.matchday ?? 'TBD'} • {row.date ?? 'Date missing'} • {row.venue ?? 'Venue missing'}
                </p>
                {row.status === 'PENDING' ? (
                  <p className="mt-3 rounded-2xl bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                    Pending reason: {row.pending_reason || 'Needs editorial review'}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-3">
                <Button icon={<Check size={16} />} onClick={() => void approve(row)} type="button">
                  Approve
                </Button>
                <Button icon={<X size={16} />} onClick={() => skip(row.localId)} type="button" variant="outline">
                  Skip
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
