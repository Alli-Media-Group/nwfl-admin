import { Bot, Filter, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Field, Input, Select } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { MatchForm } from '../../components/domain/MatchForm'
import { MatchesAIParser } from '../../components/domain/MatchesAIParser'
import { api, LOGO_SOURCES } from '../../lib/api'
import type { Match, Team } from '../../types'

// ── Small team logo with initial fallback ─────────────────────────────────────
function TeamLogo({ team }: { team: Team }) {
  const sources = LOGO_SOURCES(team.slug)
  const [idx, setIdx] = useState(0)
  if (idx < sources.length) {
    return (
      <img
        src={sources[idx]}
        alt={team.name}
        onError={() => setIdx(i => i + 1)}
        style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'contain', flexShrink: 0, background: 'var(--color-surface-2)' }}
      />
    )
  }
  return (
    <div style={{
      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
      background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.58rem', fontWeight: 700, color: 'var(--color-text)',
    }}>
      {team.name.charAt(0)}
    </div>
  )
}

export function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Match | null>(null)
  const [showAI, setShowAI] = useState(false)
  const [view, setView] = useState<'desk' | 'results'>('results')
  const [filters, setFilters] = useState({ group: '', matchday: '', status: '' })
  const [season, setSeason] = useState('')
  const [seasons, setSeasons] = useState<string[]>([])

  async function loadMatches() {
    setLoading(true)
    try {
      const response = await api.getMatches({ season, matchday: filters.matchday, status: filters.status })
      setMatches(response)
    } finally {
      setLoading(false)
    }
  }

  async function loadSeasons() {
    try {
      const response = await api.getSeasons()
      setSeasons(response)
      if (response.length && !season) {
        setSeason(response[0])
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => { void loadSeasons() }, [])
  useEffect(() => { void loadMatches() }, [season, filters.matchday, filters.status])

  const filteredMatches = useMemo(
    () => matches.filter(m =>
      filters.group ? m.home_team.group === filters.group || m.away_team.group === filters.group : true
    ),
    [filters.group, matches],
  )

  const groupedResults = useMemo(() => {
    const grouped = new Map<number, { A: Match[]; B: Match[] }>()

    for (const match of filteredMatches) {
      const matchday = typeof match.matchday === 'number' ? match.matchday : 0
      const groupKey = match.home_team.group
      const existing = grouped.get(matchday) ?? { A: [], B: [] }
      existing[groupKey].push(match)
      grouped.set(matchday, existing)
    }

    return [...grouped.entries()]
      .sort((left, right) => right[0] - left[0])
      .map(([matchday, groups]) => ({
        groups: {
          A: groups.A.sort((left, right) =>
            `${left.home_team.name}-${left.away_team.name}`.localeCompare(
              `${right.home_team.name}-${right.away_team.name}`,
            ),
          ),
          B: groups.B.sort((left, right) =>
            `${left.home_team.name}-${left.away_team.name}`.localeCompare(
              `${right.home_team.name}-${right.away_team.name}`,
            ),
          ),
        },
        matchday,
      }))
  }, [filteredMatches])

  const thStyle: React.CSSProperties = {
    padding: '0.7rem 0.75rem',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#fff',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255,255,255,0.15)',
  }
  const tdStyle: React.CSSProperties = {
    padding: '0.6rem 0.75rem',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    borderRight: '1px solid var(--color-border)',
    fontSize: '0.85rem',
    color: 'var(--color-text)',
    fontWeight: 500,
  }

  const tabButtonStyle = (active: boolean): React.CSSProperties => ({
    appearance: 'none',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--color-highlight)' : '2px solid transparent',
    color: active ? 'var(--color-off-white)' : 'var(--color-muted)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: '0.76rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '0.2rem 0 0.65rem',
    textTransform: 'uppercase',
    transition: 'color 0.15s ease, border-color 0.15s ease',
  })

  const scorePillStyle: React.CSSProperties = {
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.45)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 999,
    color: 'var(--color-off-white)',
    display: 'inline-flex',
    fontSize: '0.78rem',
    fontWeight: 700,
    justifyContent: 'center',
    letterSpacing: '0.08em',
    minWidth: 56,
    padding: '0.36rem 0.65rem',
    whiteSpace: 'nowrap',
  }

  function renderResultGroup(group: 'A' | 'B', groupMatches: Match[]) {
    if (!groupMatches.length) return null

    return (
      <div
        style={{
          background: 'var(--color-bg-subtle)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            borderBottom: '1px solid var(--color-border)',
            color: 'var(--color-highlight)',
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.16em',
            padding: '0.8rem 1rem',
            textTransform: 'uppercase',
          }}
        >
          Group {group}
        </div>
        <div>
          {groupMatches.map((match, index) => {
            const baseBackground = index % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent'
            return (
              <div
                key={match.id}
                style={{
                  alignItems: 'center',
                  background: baseBackground,
                  borderBottom: index < groupMatches.length - 1 ? '1px solid var(--color-border)' : 'none',
                  display: 'grid',
                  gap: '0.55rem',
                  gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr) auto',
                  padding: '0.85rem 1rem',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = baseBackground)}
              >
                <div
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'flex-end',
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      color: 'var(--color-text)',
                      fontSize: '0.83rem',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textAlign: 'right',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {match.home_team.name}
                  </span>
                  <TeamLogo team={match.home_team} />
                </div>

                <span style={scorePillStyle}>
                  {match.home_score ?? '-'} : {match.away_score ?? '-'}
                </span>

                <div
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'flex-start',
                    minWidth: 0,
                  }}
                >
                  <TeamLogo team={match.away_team} />
                  <span
                    style={{
                      color: 'var(--color-text)',
                      fontSize: '0.83rem',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textAlign: 'left',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {match.away_team.name}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {match.status !== 'FT' ? <Badge pulse={match.status === 'LIVE'} value={match.status} /> : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Filters card */}
      <Card className="p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--color-highlight)' }}>{season ? `Season ${season}` : 'All Seasons'}</p>
            <h1 style={{ margin: '4px 0 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-off-white)' }}>Matches</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn-primary" onClick={() => setShowAI(true)} style={{ fontSize: '0.82rem', padding: '0.55rem 1rem' }}>
              <Bot size={15} /> AI Import
            </button>
            <button type="button" className="btn-primary" onClick={() => { setSelected(null); setOpen(true) }} style={{ fontSize: '0.82rem', padding: '0.55rem 1rem' }}>
              <Plus size={15} /> Add Match
            </button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Season">
            <Select onChange={e => setSeason(e.target.value)} value={season}>
              <option value="">All seasons</option>
              {seasons.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} value={filters.status}>
              <option value="">All statuses</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="LIVE">Live</option>
              <option value="FT">Full Time</option>
              <option value="PENDING">Pending</option>
            </Select>
          </Field>
          <Field label="Matchday">
            <Input onChange={e => setFilters(f => ({ ...f, matchday: e.target.value }))} placeholder="e.g. 7" value={filters.matchday} />
          </Field>
          <Field label="Group">
            <Select onChange={e => setFilters(f => ({ ...f, group: e.target.value }))} value={filters.group}>
              <option value="">All groups</option>
              <option value="A">Group A</option>
              <option value="B">Group B</option>
            </Select>
          </Field>
        </div>
      </Card>

      {/* Table card */}
      <div style={{ background: 'var(--color-card)', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--color-highlight)' }}>
              Match Records
            </p>
            <h3 style={{ margin: '2px 0 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>
              <Filter size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''}
            </h3>
          </div>
          <div style={{ alignItems: 'flex-end', display: 'flex', gap: 18 }}>
            <button
              type="button"
              onClick={() => setView('desk')}
              style={tabButtonStyle(view === 'desk')}
            >
              Entry Desk
            </button>
            <button
              type="button"
              onClick={() => setView('results')}
              style={tabButtonStyle(view === 'results')}
            >
              Results
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: '2rem' }}><Spinner label="Loading matches" /></div>
        ) : view === 'results' ? (
          groupedResults.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
              {groupedResults.map(({ matchday, groups }) => (
                <div
                  key={matchday}
                  style={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 14,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      background: 'var(--gradient-primary)',
                      borderBottom: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      padding: '0.9rem 1rem',
                    }}
                  >
                    Matchday {matchday || 'Unassigned'}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gap: '1rem',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      padding: '1rem',
                    }}
                  >
                    {renderResultGroup('A', groups.A)}
                    {renderResultGroup('B', groups.B)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
              No match results found for the current filters.
            </div>
          )
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #4b1fa3 0%, #8a3dff 100%)' }}>
                  <th style={{ ...thStyle, width: 52 }}>MD</th>
                  <th style={{ ...thStyle, width: 90 }}>Date</th>
                  <th style={{ ...thStyle, textAlign: 'left', paddingLeft: '1rem', minWidth: 160 }}>Home</th>
                  <th style={{ ...thStyle, width: 72 }}>Score</th>
                  <th style={{ ...thStyle, textAlign: 'left', paddingLeft: '0.75rem', minWidth: 160 }}>Away</th>
                  <th style={{ ...thStyle, width: 50 }}>Grp</th>
                  <th style={{ ...thStyle, width: 100 }}>Status</th>
                  <th style={{ ...thStyle, borderRight: 'none', width: 60 }}>Edit</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((match, index) => (
                  <tr
                    key={match.id}
                    style={{
                      borderBottom: index < filteredMatches.length - 1 ? '1px solid var(--color-border)' : 'none',
                      background: index % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = index % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent')}
                  >
                    {/* MD */}
                    <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-highlight)' }}>
                      {match.matchday}
                    </td>

                    {/* Date */}
                    <td style={{ ...tdStyle, fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                      {match.date ?? '—'}
                    </td>

                    {/* Home team */}
                    <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <TeamLogo team={match.home_team} />
                        <span style={{ fontWeight: 600, fontSize: '0.83rem', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                          {match.home_team.name}
                        </span>
                      </div>
                    </td>

                    {/* Score */}
                    <td style={{ ...tdStyle, fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-off-white)', letterSpacing: '0.04em' }}>
                      {match.home_score ?? '-'} : {match.away_score ?? '-'}
                    </td>

                    {/* Away team */}
                    <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <TeamLogo team={match.away_team} />
                        <span style={{ fontWeight: 600, fontSize: '0.83rem', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                          {match.away_team.name}
                        </span>
                      </div>
                    </td>

                    {/* Group */}
                    <td style={{ ...tdStyle }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 22, height: 22, borderRadius: '50%',
                        fontSize: '0.65rem', fontWeight: 700,
                        background: match.home_team.group === 'A' ? 'rgba(139,92,246,0.2)' : 'rgba(99,102,241,0.2)',
                        color: 'var(--color-highlight)',
                        border: '1px solid rgba(139,92,246,0.3)',
                      }}>
                        {match.home_team.group}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ ...tdStyle }}>
                      <Badge pulse={match.status === 'LIVE'} value={match.status} />
                    </td>

                    {/* Edit */}
                    <td style={{ ...tdStyle, borderRight: 'none' }}>
                      <button
                        type="button"
                        onClick={() => { setSelected(match); setOpen(true) }}
                        style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-highlight)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredMatches.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                      No matches found — import results or add a match manually.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal onClose={() => setOpen(false)} open={open} title={selected ? 'Edit Match' : 'Add Match'}>
        <MatchForm match={selected} onSaved={() => { setOpen(false); void loadMatches() }} />
      </Modal>

      <Modal open={showAI} onClose={() => setShowAI(false)} title="AI Match Import">
        <MatchesAIParser onSaved={loadMatches} onClose={() => setShowAI(false)} />
      </Modal>
    </div>
  )
}
