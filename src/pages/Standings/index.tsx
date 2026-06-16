import { useEffect, useState } from 'react'
import { Bot } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'
import { StandingsTable } from '../../components/domain/StandingsTable'
import { StandingsAIParser } from '../../components/domain/StandingsAIParser'
import { Modal } from '../../components/ui/Modal'
import { api } from '../../lib/api'
import type { Standing } from '../../types'

export function StandingsPage() {
  const [rows, setRows] = useState<Standing[]>([])
  const [seasons, setSeasons] = useState<string[]>([])
  const [season, setSeason] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showAI, setShowAI] = useState(false)

  async function loadSeasons() {
    try {
      const response = await api.getStandingsSeasons()
      setSeasons(response)
      if (response.length && !season) {
        setSeason(response[0])
      }
    } catch {
      // seasons endpoint may be unavailable on older backends — fall back to hardcoded
      setSeasons(['2024/25'])
      if (!season) setSeason('2024/25')
    }
  }

  async function loadStandings() {
    setLoading(true)
    try {
      const response = await api.getStandings(season || undefined)
      setRows(response)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSeasons()
  }, [])

  useEffect(() => {
    if (!season) return
    void loadStandings()
  }, [season])

  if (loading) {
    return <Spinner label="Loading standings" />
  }

  const groupA = rows.filter((row) => row.team.group === 'A')
  const groupB = rows.filter((row) => row.team.group === 'B')

  return (
    <>
      {/* Page header with season selector and AI Import button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-highlight)',
                cursor: 'pointer',
              }}
            >
              {seasons.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--color-muted)' }}>Season</p>
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-off-white)' }}>Standings</h1>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowAI(true)}
          style={{ fontSize: '0.82rem', padding: '0.55rem 1rem' }}
        >
          <Bot size={15} /> AI Import
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <StandingsTable group="A" onSaved={loadStandings} rows={groupA} />
        <StandingsTable group="B" onSaved={loadStandings} rows={groupB} />
      </div>

      <Modal open={showAI} onClose={() => setShowAI(false)} title="AI Standings Import">
        <StandingsAIParser
          standings={rows}
          onSaved={loadStandings}
          onClose={() => setShowAI(false)}
        />
      </Modal>
    </>
  )
}
