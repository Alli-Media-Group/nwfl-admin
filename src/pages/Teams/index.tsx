import { Building2, Bot, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { TeamForm } from '../../components/domain/TeamForm'
import { TeamAIParser } from '../../components/domain/TeamAIParser'
import { api, LOGO_SOURCES } from '../../lib/api'
import type { Team } from '../../types'

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Team | null>(null)
  const [showAIParser, setShowAIParser] = useState(false)

  async function loadTeams() {
    setLoading(true)
    try {
      setTeams(await api.getTeams())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadTeams() }, [])

  const groupA = teams.filter(t => t.group === 'A')
  const groupB = teams.filter(t => t.group === 'B')

  return (
    <div className="space-y-6">

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-muted)' }}>
            {teams.length} clubs registered · Group A: {groupA.length} · Group B: {groupB.length}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowAIParser(true)}
        >
          <Bot size={15} />
          AI Import Team
        </button>
      </div>

      {/* AI Parser modal */}
      <Modal
        open={showAIParser}
        onClose={() => setShowAIParser(false)}
        title="Import Team with AI"
      >
        <TeamAIParser
          onClose={() => { setShowAIParser(false); void loadTeams() }}
          onSaved={() => { void loadTeams() }}
        />
      </Modal>

      {/* Edit team modal */}
      <Modal
        onClose={() => setSelected(null)}
        open={Boolean(selected)}
        title={selected ? `Edit ${selected.name}` : 'Edit Team'}
      >
        <TeamForm
          onSaved={() => { setSelected(null); void loadTeams() }}
          team={selected}
        />
      </Modal>

      {loading ? (
        <Spinner label="Loading teams" />
      ) : teams.length === 0 ? (
        /* Empty state */
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            display: 'inline-grid', placeItems: 'center', width: 56, height: 56,
            borderRadius: 16, background: 'var(--color-surface)', marginBottom: 16,
          }}>
            <Bot size={24} style={{ color: 'var(--color-highlight)' }} />
          </div>
          <h3 style={{ margin: '0 0 8px', color: 'var(--color-text)' }}>No teams yet</h3>
          <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
            Use AI Import to add teams from text, Wikipedia, or a screenshot.
          </p>
          <button type="button" className="btn-primary" onClick={() => setShowAIParser(true)}>
            <Bot size={15} /> Import First Team
          </button>
        </div>
      ) : (
        <>
          {/* Group A */}
          {groupA.length > 0 && (
            <section>
              <h2 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', margin: '0 0 12px' }}>
                Group A — {groupA.length} clubs
              </h2>
              <div className="data-grid data-grid-4">
                {groupA.map(team => <TeamCard key={team.id} team={team} onEdit={() => setSelected(team)} />)}
              </div>
            </section>
          )}

          {/* Group B */}
          {groupB.length > 0 && (
            <section>
              <h2 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', margin: '0 0 12px' }}>
                Group B — {groupB.length} clubs
              </h2>
              <div className="data-grid data-grid-4">
                {groupB.map(team => <TeamCard key={team.id} team={team} onEdit={() => setSelected(team)} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function TeamCard({ team, onEdit }: { team: Team; onEdit: () => void }) {
  const sources = team.logo ? [team.logo, ...LOGO_SOURCES(team.slug)] : LOGO_SOURCES(team.slug)
  const [srcIndex, setSrcIndex] = useState(0)
  const exhausted = srcIndex >= sources.length

  return (
    <Card className="p-5">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        {/* Logo — walks fallback chain on each error, then shows initials */}
        {!exhausted ? (
          <img
            src={sources[srcIndex]}
            alt={team.name}
            onError={() => setSrcIndex(i => i + 1)}
            style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'contain', border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}
          />
        ) : (
          <div style={{
            width: 52, height: 52, borderRadius: 12, display: 'grid', placeItems: 'center',
            background: 'var(--color-surface-2)', fontWeight: 700, fontSize: '1rem',
            color: 'var(--color-highlight)',
          }}>
            {team.short_name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <Badge value={team.group as 'A' | 'B'} />
      </div>

      <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--color-text)' }}>{team.name}</h3>
      <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: 'var(--color-muted)' }}>
        {team.city && team.state ? `${team.city}, ${team.state}` : team.city || team.state || 'Location not set'}
      </p>

      {team.manager && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--color-text-2)', marginBottom: 12 }}>
          <Building2 size={13} />
          {team.manager}
        </div>
      )}

      {team.titles > 0 && (
        <p style={{ fontSize: '0.72rem', color: 'var(--color-warning)', fontWeight: 600, margin: '0 0 12px' }}>
          {team.titles}× NWFL Champion
        </p>
      )}

      <button
        type="button"
        onClick={onEdit}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-highlight)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        <Pencil size={13} />
        Edit
      </button>
    </Card>
  )
}
