import { AlertTriangle, ArrowRight, CalendarRange, Clock3, ShieldCheck, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { api } from '../../lib/api'
import type { DashboardStats, Match, Team } from '../../types'

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const duration = 500
    const start = performance.now()
    const frame = (time: number) => {
      const progress = Math.min((time - start) / duration, 1)
      setDisplay(Math.round(value * progress))
      if (progress < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [value])

  return <span>{display}</span>
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [season, setSeason] = useState('')
  const [seasons, setSeasons] = useState<string[]>([])
  const [seasonsReady, setSeasonsReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function loadSeasons() {
      try {
        const response = await api.getSeasons()
        setSeasons(response)
        if (response.length && !season) {
          setSeason(response[0])
        }
      } finally {
        setSeasonsReady(true)
      }
    }
    void loadSeasons()
  }, [])

  useEffect(() => {
    if (!seasonsReady) return
    async function load() {
      setLoading(true)
      try {
        const [teamData, matchData] = await Promise.all([
          api.getTeams(),
          api.getMatches({ season }),
        ])
        setTeams(teamData)
        setMatches(matchData)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [seasonsReady, season])

  const stats = useMemo<DashboardStats>(() => {
    const pendingMatches = matches.filter((match) => match.status === 'PENDING').length
    const upcomingMatches = matches.filter((match) => match.status === 'UPCOMING').length
    return {
      pendingMatches,
      totalMatches: matches.length,
      totalTeams: teams.length,
      upcomingMatches,
    }
  }, [matches, teams])

  const pendingAlerts = matches.filter((match) => match.status === 'PENDING' && match.notify_admin)
  const recentMatches = [...matches].sort((left, right) => (right.date ?? '').localeCompare(left.date ?? '')).slice(0, 10)

  const cards: Array<{
    icon: typeof Users
    label: string
    tone?: 'warning'
    value: number
  }> = [
    { icon: Users, label: 'Total Teams', value: stats.totalTeams },
    { icon: ShieldCheck, label: 'Total Matches', value: stats.totalMatches },
    { icon: AlertTriangle, label: 'Pending Matches', tone: 'warning', value: stats.pendingMatches },
    { icon: CalendarRange, label: 'Upcoming Matches', value: stats.upcomingMatches },
  ]

  if (loading) {
    return <Spinner label="Loading dashboard" />
  }

  return (
    <div className="space-y-6">
      {!dismissed && pendingAlerts.length ? (
        <div className="shell-panel flex flex-wrap items-center justify-between gap-4 rounded-lg px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--color-warning)' }}>Pending Alerts</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text)' }}>
              {pendingAlerts.length} match {pendingAlerts.length > 1 ? 'entries need' : 'entry needs'} review before publication.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn-outline" onClick={() => navigate('/matches')} type="button">
              Review
            </button>
            <button className="btn-primary" onClick={() => setDismissed(true)} type="button">
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Season</span>
        <select
          className="rounded-md border px-3 py-1.5 text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
          value={season}
          onChange={(e) => setSeason(e.target.value)}
        >
          {seasons.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="data-grid data-grid-4">
        {cards.map(({ icon: Icon, label, tone, value }) => (
          <Card className="p-5" key={label}>
            <div className="mb-8 flex items-start justify-between">
              <div className="rounded-lg p-3" style={{
                background: tone === 'warning' ? 'rgba(217,119,6,0.12)' : 'var(--color-surface-2)',
                color: tone === 'warning' ? 'var(--color-warning)' : 'var(--color-primary)',
              }}>
                <Icon size={20} />
              </div>
              {tone === 'warning' && value > 0 ? <Badge value="PENDING" /> : null}
            </div>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{label}</p>
            <h3 className="mt-2 text-4xl" style={{ color: 'var(--color-text)' }}>
              <CountUp value={value} />
            </h3>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--color-highlight)' }}>Recent Matches</p>
            <h3 className="mt-1 text-2xl" style={{ color: 'var(--color-text)' }}>Latest results and fixtures</h3>
          </div>
          <button className="btn-outline" onClick={() => navigate('/matches')} type="button">
            Open Desk
          </button>
        </div>

        <div className="table-shell rounded-none border-0">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Fixture</th>
                <th>Status</th>
                <th>Venue</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentMatches.map((match) => (
                <tr key={match.id}>
                  <td>{match.date}</td>
                  <td>
                    <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                      {match.home_team.name} {match.home_score ?? '-'}:{match.away_score ?? '-'} {match.away_team.name}
                    </div>
                  </td>
                  <td>
                    <Badge pulse={match.status === 'LIVE'} value={match.status} />
                  </td>
                  <td>{match.venue || 'TBC'}</td>
                  <td>
                    <button className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-highlight)]" onClick={() => navigate('/matches')} type="button">
                      Edit <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="data-grid data-grid-2">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--color-highlight)' }}>Desk Tempo</p>
          <h3 className="mt-2 text-2xl" style={{ color: 'var(--color-text)' }}>Tonight&apos;s live operations</h3>
          <div className="mt-5 space-y-4">
            {matches
              .filter((match) => match.status === 'LIVE' || match.status === 'UPCOMING')
              .slice(0, 4)
              .map((match) => (
                <div className="flex items-center justify-between rounded-lg border px-4 py-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }} key={match.id}>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                      {match.home_team.short_name} vs {match.away_team.short_name}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>{match.venue || 'Venue pending'}</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
                      <Clock3 size={14} /> {match.kick_off || 'TBA'}
                    </div>
                    <div className="mt-2">
                      <Badge pulse={match.status === 'LIVE'} value={match.status} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
