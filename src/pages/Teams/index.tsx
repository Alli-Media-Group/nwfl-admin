import { Bot, MapPin, Pencil, Users, ImageIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
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

  const locationText = team.city && team.state
    ? `${team.city}, ${team.state}`
    : team.city || team.state || 'Location not set'

  return (
    <Card className="overflow-hidden p-0 flex flex-col transition-all duration-300 hover:-translate-y-0.5" style={{ boxShadow: 'var(--shadow-card)' }}>
      {/* Top content */}
      <div className="flex-1 p-5">
        {/* Header: logo + group badge */}
        <div className="flex justify-between items-start mb-4">
          <div
            className="grid h-16 w-16 place-items-center rounded-lg p-2 shrink-0"
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
            }}
          >
            {!exhausted ? (
              <img
                src={sources[srcIndex]}
                alt={team.name}
                onError={() => setSrcIndex(i => i + 1)}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                {team.short_name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <span
            className="inline-flex items-center rounded px-2 py-1 text-[10px] font-bold uppercase tracking-tighter"
            style={{
              background: team.group === 'A'
                ? 'rgba(51,0,130,0.10)'
                : 'rgba(70,72,212,0.10)',
              color: team.group === 'A'
                ? 'var(--color-primary)'
                : 'var(--color-highlight)',
              border: team.group === 'A'
                ? '1px solid rgba(51,0,130,0.20)'
                : '1px solid rgba(70,72,212,0.20)',
            }}
          >
            Group {team.group}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>
          {team.name}
        </h3>

        {/* Location */}
        <p className="flex items-center gap-1 text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
          <MapPin size={13} />
          {locationText}
        </p>

        {/* Status tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {team.titles > 0 && (
            <span
              className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold"
              style={{
                background: 'rgba(70,72,212,0.10)',
                color: 'var(--color-highlight)',
                border: '1px solid rgba(70,72,212,0.20)',
              }}
            >
              {team.titles}× Champion
            </span>
          )}
          <span
            className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: 'var(--color-surface-2)',
              color: 'var(--color-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            Active
          </span>
        </div>

        {/* Info rows */}
        <div className="space-y-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Coach
            </span>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {team.manager || '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Founded
            </span>
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>
              {team.founded || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div
        className="grid grid-cols-3 gap-2 p-2"
        style={{
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <button
          type="button"
          onClick={onEdit}
          className="flex flex-col items-center justify-center gap-1 rounded py-2 transition-colors group"
          style={{ color: 'var(--color-muted)' }}
        >
          <Pencil size={18} className="transition-colors group-hover:text-[var(--color-primary)]" />
          <span className="text-[9px] font-bold uppercase tracking-wider transition-colors group-hover:text-[var(--color-primary)]">
            Edit
          </span>
        </button>

        <button
          type="button"
          disabled
          className="flex flex-col items-center justify-center gap-1 rounded py-2 transition-colors group cursor-not-allowed opacity-50"
          style={{ color: 'var(--color-muted)', borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}
        >
          <Users size={18} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Roster</span>
        </button>

        <button
          type="button"
          disabled
          className="flex flex-col items-center justify-center gap-1 rounded py-2 transition-colors group cursor-not-allowed opacity-50"
          style={{ color: 'var(--color-muted)' }}
        >
          <ImageIcon size={18} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Media</span>
        </button>
      </div>
    </Card>
  )
}
