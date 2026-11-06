import { useEffect, useState } from 'react'
import { Bot } from 'lucide-react'
import { SkeletonRows } from '../../components/ui/Skeleton'
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
    return <div className="space-y-6"><SkeletonRows rows={10} /><SkeletonRows rows={9} /></div>
  }

  const groupA = rows.filter((row) => row.team.group === 'A')
  const groupB = rows.filter((row) => row.team.group === 'B')

  return (
    <>
      {/* Page header with season selector and AI Import button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <label className="flex items-center gap-2 text-[0.85rem] text-[var(--color-muted)]">
            Season
            <select
              className="field-base"
              style={{ width: 'auto', minWidth: '8.5rem' }}
              value={season}
              onChange={(e) => setSeason(e.target.value)}
            >
              {seasons.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          className="btn-outline"
          onClick={() => setShowAI(true)}
        >
          <Bot size={15} /> Import from text
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
