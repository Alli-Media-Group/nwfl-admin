import { Bot, Pencil, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Field, Input, Select } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { SkeletonRows } from '../../components/ui/Skeleton'
import { TeamCrest } from '../../components/ui/TeamCrest'
import { MatchForm } from '../../components/domain/MatchForm'
import { MatchesAIParser } from '../../components/domain/MatchesAIParser'
import { api } from '../../lib/api'
import type { Match } from '../../types'

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
  const [seasonsReady, setSeasonsReady] = useState(false)

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
      if (response.length) {
        setSeason(response[0])
      }
    } catch {
      // ignore
    } finally {
      setSeasonsReady(true)
    }
  }

  useEffect(() => { void loadSeasons() }, [])
  useEffect(() => {
    if (!seasonsReady) return
    void loadMatches()
  }, [seasonsReady, season, filters.matchday, filters.status])

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

  const openEdit = (match: Match | null) => { setSelected(match); setOpen(true) }

  function MatchLine({ match }: { match: Match }) {
    const played = match.home_score != null && match.away_score != null
    return (
      <li>
        <button
          className="group/row grid w-full grid-cols-[1fr_auto_1fr_auto] items-center gap-3 border-t px-4 py-2.5 text-left transition-colors hover:bg-[var(--color-surface)]"
          onClick={() => openEdit(match)}
          style={{ borderColor: 'var(--color-border)' }}
          title="Edit this match"
          type="button"
        >
          <span className="flex min-w-0 items-center justify-end gap-2">
            <span className="truncate text-right text-[0.85rem] font-medium">{match.home_team.name}</span>
            <TeamCrest team={match.home_team} size={22} />
          </span>
          {played ? (
            <span className="scoreline">{match.home_score}<span className="scoreline__sep">–</span>{match.away_score}</span>
          ) : (
            <span className="scoreline scoreline--pending">{match.kick_off ? match.kick_off.slice(0, 5) : 'v'}</span>
          )}
          <span className="flex min-w-0 items-center gap-2">
            <TeamCrest team={match.away_team} size={22} />
            <span className="truncate text-[0.85rem] font-medium">{match.away_team.name}</span>
          </span>
          <span className="flex min-w-[1.5rem] justify-end">
            {match.status !== 'FT'
              ? <Badge pulse={match.status === 'LIVE'} value={match.status} />
              : <Pencil className="text-[var(--color-muted)] opacity-0 transition-opacity group-hover/row:opacity-100" size={13} />}
          </span>
        </button>
      </li>
    )
  }

  function GroupList({ group, list }: { group: 'A' | 'B'; list: Match[] }) {
    if (!list.length) return null
    return (
      <div className="overflow-hidden rounded-[var(--radius-md)] border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-subtle)' }}>
        <p className="eyebrow px-4 py-2">Group {group}</p>
        <ul>{list.map(m => <MatchLine key={m.id} match={m} />)}</ul>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-[46rem]">
          <Field label="Season">
            <Select onChange={e => setSeason(e.target.value)} value={season}>
              <option value="">All seasons</option>
              {seasons.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} value={filters.status}>
              <option value="">All</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="LIVE">Live</option>
              <option value="FT">Full time</option>
              <option value="PENDING">Needs review</option>
            </Select>
          </Field>
          <Field label="Matchday">
            <Input inputMode="numeric" onChange={e => setFilters(f => ({ ...f, matchday: e.target.value }))} placeholder="Any" value={filters.matchday} />
          </Field>
          <Field label="Group">
            <Select onChange={e => setFilters(f => ({ ...f, group: e.target.value }))} value={filters.group}>
              <option value="">Both</option>
              <option value="A">Group A</option>
              <option value="B">Group B</option>
            </Select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-outline" onClick={() => setShowAI(true)} type="button"><Bot size={15} /> Import from text</button>
          <button className="btn-primary" onClick={() => openEdit(null)} type="button"><Plus size={15} /> Add match</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.85rem] text-[var(--color-muted)]">
          {loading ? 'Loading matches' : `${filteredMatches.length} match${filteredMatches.length === 1 ? '' : 'es'}${season ? ` in ${season}` : ''}`}
        </p>
        <div aria-label="View" className="segmented" role="tablist">
          <button aria-selected={view === 'results'} onClick={() => setView('results')} role="tab" type="button">By matchday</button>
          <button aria-selected={view === 'desk'} onClick={() => setView('desk')} role="tab" type="button">Table</button>
        </div>
      </div>

      {loading ? (
        <SkeletonRows rows={8} />
      ) : !filteredMatches.length ? (
        <Card className="px-5 py-10 text-center">
          <p className="font-medium">No matches for these filters.</p>
          <p className="mt-1 text-[0.85rem] text-[var(--color-muted)]">Change the filters, import results from text, or add a match.</p>
        </Card>
      ) : view === 'results' ? (
        <div className="space-y-5">
          {groupedResults.map(({ matchday, groups }) => (
            <Card className="overflow-hidden" key={matchday}>
              <div className="flex items-baseline justify-between border-b px-5 py-3" style={{ borderColor: 'var(--color-border)' }}>
                <h2 className="text-[1rem]">{matchday ? `Matchday ${matchday}` : 'No matchday'}</h2>
                <span className="text-[0.8rem] text-[var(--color-muted)]">{groups.A.length + groups.B.length} matches</span>
              </div>
              <div className="grid gap-4 p-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))]">
                <GroupList group="A" list={groups.A} />
                <GroupList group="B" list={groups.B} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>MD</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Home</th>
                <th style={{ textAlign: 'center' }}>Score</th>
                <th>Away</th>
                <th>Group</th>
                <th>Status</th>
                <th><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredMatches.map(match => (
                <tr key={match.id}>
                  <td className="figure" style={{ color: 'var(--color-text)' }}>{match.matchday}</td>
                  <td className="whitespace-nowrap">{match.date ?? '—'}</td>
                  <td>
                    <span className="flex items-center justify-end gap-2 font-medium" style={{ color: 'var(--color-text)' }}>
                      <span className="truncate">{match.home_team.name}</span>
                      <TeamCrest team={match.home_team} size={22} />
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {match.home_score != null && match.away_score != null
                      ? <span className="scoreline">{match.home_score}<span className="scoreline__sep">–</span>{match.away_score}</span>
                      : <span className="scoreline scoreline--pending">v</span>}
                  </td>
                  <td>
                    <span className="flex items-center gap-2 font-medium" style={{ color: 'var(--color-text)' }}>
                      <TeamCrest team={match.away_team} size={22} />
                      <span className="truncate">{match.away_team.name}</span>
                    </span>
                  </td>
                  <td>{match.home_team.group}</td>
                  <td><Badge pulse={match.status === 'LIVE'} value={match.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-outline" onClick={() => openEdit(match)} style={{ minHeight: 0, padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} type="button">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal onClose={() => setOpen(false)} open={open} title={selected ? 'Edit Match' : 'Add Match'}>
        <MatchForm match={selected} onSaved={() => { setOpen(false); void loadMatches() }} />
      </Modal>

      <Modal open={showAI} onClose={() => setShowAI(false)} title="AI Match Import">
        <MatchesAIParser onSaved={loadMatches} onClose={() => setShowAI(false)} />
      </Modal>
    </div>
  )
}
