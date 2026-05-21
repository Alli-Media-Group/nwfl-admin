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
  const [loading, setLoading] = useState(true)
  const [showAI, setShowAI] = useState(false)

  async function loadStandings() {
    setLoading(true)
    try {
      const response = await api.getStandings()
      setRows(response)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStandings()
  }, [])

  if (loading) {
    return <Spinner label="Loading standings" />
  }

  const groupA = rows.filter((row) => row.team.group === 'A')
  const groupB = rows.filter((row) => row.team.group === 'B')

  return (
    <>
      {/* Page header with AI Import button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--color-highlight)' }}>Season 2024/25</p>
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
