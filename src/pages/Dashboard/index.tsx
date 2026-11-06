import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Card, CardHeader } from '../../components/ui/Card'
import { Select } from '../../components/ui/Input'
import { Skeleton, SkeletonStats } from '../../components/ui/Skeleton'
import { TeamCrest } from '../../components/ui/TeamCrest'
import { api } from '../../lib/api'
import type { Match, Team } from '../../types'

const formatDate = (iso: string | null) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'No date'

function Scoreline({ match }: { match: Match }) {
  if (match.home_score == null || match.away_score == null) {
    return <span className="scoreline scoreline--pending">{match.kick_off ? match.kick_off.slice(0, 5) : 'v'}</span>
  }
  return (
    <span className="scoreline">
      {match.home_score}
      <span className="scoreline__sep">–</span>
      {match.away_score}
    </span>
  )
}

/** One fixture as a row: home team, score, away team. */
function MatchRow({ match, trailing }: { match: Match; trailing?: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[3.5rem_1fr_auto_1fr] items-center gap-3 border-t px-5 py-3 first:border-t-0 sm:grid-cols-[4.5rem_1fr_auto_1fr_auto]" style={{ borderColor: 'var(--color-border)' }}>
      <span className="text-[0.78rem] text-[var(--color-muted)]">{formatDate(match.date)}</span>
      <span className="flex min-w-0 items-center justify-end gap-2 text-right">
        <span className="truncate text-[0.875rem] font-medium">{match.home_team.short_name || match.home_team.name}</span>
        <TeamCrest team={match.home_team} size={22} />
      </span>
      <Scoreline match={match} />
      <span className="flex min-w-0 items-center gap-2">
        <TeamCrest team={match.away_team} size={22} />
        <span className="truncate text-[0.875rem] font-medium">{match.away_team.short_name || match.away_team.name}</span>
      </span>
      {trailing ? <span className="hidden justify-self-end sm:block">{trailing}</span> : null}
    </li>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'warning' }) {
  return (
    <Card className="p-4">
      <p className="text-[0.8rem] text-[var(--color-muted)]">{label}</p>
      <p className="figure mt-2 text-[2rem] leading-none" style={{ color: tone === 'warning' && value > 0 ? 'var(--color-warning)' : 'var(--color-text)' }}>
        {value}
      </p>
    </Card>
  )
}

export function DashboardPage() {
  const [seasons, setSeasons] = useState<string[] | null>(null)
  const [season, setSeason] = useState('')
  const [data, setData] = useState<{ season: string; teams: Team[]; matches: Match[] } | null>(null)

  useEffect(() => {
    api.getSeasons()
      .then(list => {
        setSeasons(list)
        setSeason(list[0] ?? '')
      })
      .catch(() => setSeasons([]))
  }, [])

  useEffect(() => {
    if (seasons === null) return
    let live = true
    Promise.all([api.getTeams(), api.getMatches({ season })])
      .then(([teams, matches]) => live && setData({ season, teams, matches }))
      .catch(() => live && setData({ season, teams: [], matches: [] }))
    return () => { live = false }
  }, [seasons, season])

  const loading = !data || data.season !== season

  const view = useMemo(() => {
    const matches = data?.matches ?? []
    const byDateDesc = [...matches].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    const byDateAsc = [...byDateDesc].reverse()
    return {
      pending: byDateDesc.filter(m => m.status === 'PENDING'),
      results: byDateDesc.filter(m => m.status === 'FT').slice(0, 8),
      fixtures: byDateAsc.filter(m => m.status === 'UPCOMING' || m.status === 'LIVE').slice(0, 6),
      counts: {
        played: matches.filter(m => m.status === 'FT').length,
        upcoming: matches.filter(m => m.status === 'UPCOMING').length,
        pending: matches.filter(m => m.status === 'PENDING').length,
        teams: data?.teams.length ?? 0,
      },
    }
  }, [data])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[0.85rem] text-[var(--color-muted)]">
          Season
          <Select className="w-auto min-w-[8.5rem]" onChange={e => setSeason(e.target.value)} value={season} disabled={!seasons?.length}>
            {(seasons ?? []).map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </label>
      </div>

      {loading ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Results entered" value={view.counts.played} />
          <Stat label="Fixtures to play" value={view.counts.upcoming} />
          <Stat label="Waiting for review" value={view.counts.pending} tone="warning" />
          <Stat label="Teams" value={view.counts.teams} />
        </div>
      )}

      <Card>
        <CardHeader
          title="Needs attention"
          description="Results that were entered but not yet confirmed."
          actions={view.pending.length ? <Link className="btn-outline" to="/matches">Review in Matches <ArrowRight size={14} /></Link> : null}
        />
        {loading ? (
          <div className="space-y-3 p-5"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" /></div>
        ) : view.pending.length ? (
          <ul>
            {view.pending.slice(0, 6).map(m => (
              <MatchRow key={m.id} match={m} trailing={<span className="inline-flex items-center gap-1.5 text-[0.8rem] text-[var(--color-warning)]"><AlertCircle size={14} />{m.pending_reason || 'Needs review'}</span>} />
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 px-5 py-5 text-[0.875rem] text-[var(--color-muted)]">
            <CheckCircle2 size={16} className="text-[var(--color-success)]" />
            Nothing waiting. Every entered result is confirmed.
          </p>
        )}
      </Card>

      <div className="grid gap-6 2xl:grid-cols-2">
        <Card>
          <CardHeader title="Latest results" actions={<Link className="btn-outline" to="/matches">All matches</Link>} />
          {loading ? (
            <div className="space-y-4 p-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
          ) : view.results.length ? (
            <ul>{view.results.map(m => <MatchRow key={m.id} match={m} />)}</ul>
          ) : (
            <p className="px-5 py-5 text-[0.875rem] text-[var(--color-muted)]">No results this season yet.</p>
          )}
        </Card>

        <Card>
          <CardHeader title="Next fixtures" />
          {loading ? (
            <div className="space-y-4 p-5">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
          ) : view.fixtures.length ? (
            <ul>{view.fixtures.map(m => <MatchRow key={m.id} match={m} trailing={<Badge pulse={m.status === 'LIVE'} value={m.status} />} />)}</ul>
          ) : (
            <p className="px-5 py-5 text-[0.875rem] text-[var(--color-muted)]">No fixtures scheduled for this season.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
