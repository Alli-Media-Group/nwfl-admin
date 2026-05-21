import { useEffect, useRef, useState } from 'react'
import {
  Bot, ImageIcon, CheckCircle2, X, Check, SkipForward, Upload,
  Search, ChevronDown, ChevronUp,
} from 'lucide-react'
import { api, toMatchPayload } from '../../lib/api'
import { useToast } from '../ui/Toast'
import { Spinner } from '../ui/Spinner'
import { VisionFallbackModal } from '../ui/VisionFallbackModal'
import type { ParsedMatchResult, ParsedTeamResult, Team } from '../../types'

interface Props {
  onSaved: () => void
  onClose: () => void
}

type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW'
const CONF: Record<ConfidenceLevel, { color: string; label: string }> = {
  HIGH:   { color: 'var(--color-success)', label: 'HIGH' },
  MEDIUM: { color: 'var(--color-warning)', label: 'MED'  },
  LOW:    { color: 'var(--color-danger)',  label: 'LOW'  },
}

const STATUS_COLORS: Record<string, string> = {
  FT:       'var(--color-success)',
  UPCOMING: 'var(--color-highlight)',
  LIVE:     'var(--color-danger)',
  PENDING:  'var(--color-warning)',
}

// Best-effort fuzzy match: exact → short_name → slug keyword → first distinctive word
function resolveTeam(aiName: string | null, teams: Team[]): Team | null {
  if (!aiName) return null
  const q = aiName.toLowerCase().trim()

  // 1. Exact full name
  const exact = teams.find(t => t.name.toLowerCase() === q)
  if (exact) return exact

  // 2. Exact short name
  const byShort = teams.find(t => t.short_name?.toLowerCase() === q)
  if (byShort) return byShort

  // 3. slug match (e.g. "rivers-angels-fc" contains "rivers-angels")
  const bySlug = teams.find(t => t.slug && q.replace(/\s+/g, '-').includes(t.slug))
  if (bySlug) return bySlug

  // 4. The AI name contains the team's distinctive keyword (first non-generic word)
  const genericWords = new Set(['fc', 'queens', 'ladies', 'angels', 'the'])
  const byKeyword = teams.find(t => {
    const keyword = t.name.toLowerCase().split(' ').find(w => !genericWords.has(w))
    return keyword && q.includes(keyword)
  })
  if (byKeyword) return byKeyword

  // 5. Team name contains a word from the AI name (reverse)
  const aiWords = q.split(' ').filter(w => !genericWords.has(w) && w.length > 3)
  const byAiWord = teams.find(t =>
    aiWords.some(w => t.name.toLowerCase().includes(w))
  )
  return byAiWord ?? null
}

// ── Inline research+create for a single unresolved team ───────────────────────
function TeamResolver({
  aiName,
  teams,
  onResolved,
}: {
  aiName: string
  teams: Team[]
  onResolved: (team: Team) => void
}) {
  const { success, error: toastError } = useToast()
  const [open, setOpen]           = useState(false)
  const [researching, setResearching] = useState(false)
  const [draft, setDraft]         = useState<ParsedTeamResult | null>(null)
  const [saving, setSaving]       = useState(false)

  async function handleResearch() {
    setResearching(true)
    setDraft(null)
    try {
      const results = await api.researchTeams([aiName])
      if (!Array.isArray(results)) {
        const err = results as unknown as { error: string }
        if (err.error === 'ai_quota_exceeded') {
          toastError('OpenRouter daily limit reached — try again tomorrow.')
          return
        }
        toastError('Unexpected research response.')
        return
      }
      const r = results[0]
      if (r.error || !r.result) {
        toastError(r.error ?? 'Research returned no data — fill in manually below.')
        setDraft({ name: aiName, short_name: '', slug: '', city: null, state: null, group: null, founded: null, manager: null, titles: 0, bio: '', confidence: 'LOW' })
        return
      }
      setDraft(r.result)
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Research failed.')
    } finally {
      setResearching(false)
    }
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    try {
      const team = await api.createTeam({
        name:       draft.name,
        short_name: draft.short_name ?? '',
        slug:       draft.slug ?? '',
        city:       draft.city ?? '',
        state:      draft.state ?? '',
        group:      draft.group ?? 'A',
        founded:    draft.founded ?? null,
        manager:    draft.manager ?? '',
        titles:     draft.titles ?? 0,
        bio:        draft.bio ?? '',
      })
      success(`${team.name} created.`)
      onResolved(team)
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  function field(key: keyof ParsedTeamResult, label: string, type: 'text' | 'number' = 'text') {
    if (!draft) return null
    return (
      <div key={key}>
        <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: 3 }}>{label}</label>
        <input
          className="field-base"
          type={type}
          value={(draft[key] as string | number) ?? ''}
          onChange={e => setDraft(d => d ? { ...d, [key]: type === 'number' ? Number(e.target.value) : e.target.value } : d)}
          style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem' }}
        />
      </div>
    )
  }

  return (
    <div style={{ marginTop: 6, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, overflow: 'hidden', background: 'var(--color-bg-subtle)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: 'rgba(239,68,68,0.06)' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-danger)' }}>
          "{aiName}" not in DB
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {!draft ? (
            <button
              type="button"
              disabled={researching}
              onClick={handleResearch}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--gradient-primary)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.72rem', color: '#fff', fontWeight: 600 }}
            >
              {researching ? <Spinner size="sm" /> : <Search size={11} />}
              {researching ? 'Researching...' : 'Research & Create'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.72rem' }}
            >
              {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {open ? 'Collapse' : 'Review'}
            </button>
          )}
          {/* Also allow picking an existing team */}
          <select
            className="field-base"
            defaultValue=""
            onChange={e => {
              const t = teams.find(t => String(t.id) === e.target.value)
              if (t) onResolved(t)
            }}
            style={{ fontSize: '0.72rem', padding: '3px 6px' }}
          >
            <option value="">Or pick existing…</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Editable research result */}
      {draft && open && (
        <>
          <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {field('name', 'Full Name')}
            {field('short_name', 'Short Name')}
            {field('slug', 'Slug')}
            <div>
              <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: 3 }}>Group</label>
              <select
                className="field-base"
                value={draft.group ?? 'A'}
                onChange={e => setDraft(d => d ? { ...d, group: e.target.value as 'A' | 'B' } : d)}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem' }}
              >
                <option value="A">Group A</option>
                <option value="B">Group B</option>
              </select>
            </div>
            {field('city', 'City')}
            {field('state', 'State')}
            {field('manager', 'Manager')}
            {field('founded', 'Founded', 'number')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '8px 12px', borderTop: '1px solid var(--color-border)' }}>
            <button
              type="button"
              onClick={handleResearch}
              disabled={researching}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--color-muted)' }}
            >
              {researching ? <Spinner size="sm" /> : <Search size={11} />} Re-research
            </button>
            <button
              type="button"
              disabled={saving || !draft.name}
              onClick={handleSave}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--gradient-primary)', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: '0.72rem', color: '#fff', fontWeight: 600 }}
            >
              {saving ? <Spinner size="sm" /> : <Check size={11} />} Create & Use
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── One parsed match card ─────────────────────────────────────────────────────
function MatchReviewCard({
  row,
  teams: initialTeams,
  onApply,
  onSkip,
}: {
  row: ParsedMatchResult
  teams: Team[]
  onApply: (row: ParsedMatchResult, home: Team, away: Team) => Promise<void>
  onSkip: () => void
}) {
  const [draft, setDraft]       = useState<ParsedMatchResult>({ ...row })
  const [applying, setApplying] = useState(false)
  const [applied, setApplied]   = useState(false)
  const [skipped, setSkipped]   = useState(false)
  const conf = CONF[draft.confidence] ?? CONF.LOW

  // localTeams grows when user creates a new team via TeamResolver
  const [localTeams, setLocalTeams] = useState<Team[]>(initialTeams)
  useEffect(() => { setLocalTeams(initialTeams) }, [initialTeams])

  // Canonical DB names stored in draft — resolved on first render
  const [homeResolved, setHomeResolved] = useState<Team | null>(() => resolveTeam(row.home_team, initialTeams))
  const [awayResolved, setAwayResolved] = useState<Team | null>(() => resolveTeam(row.away_team, initialTeams))

  // Keep select values in sync with resolved teams
  const [homeSelectVal, setHomeSelectVal] = useState<string>(() => resolveTeam(row.home_team, initialTeams)?.name ?? '')
  const [awaySelectVal, setAwaySelectVal] = useState<string>(() => resolveTeam(row.away_team, initialTeams)?.name ?? '')

  const hasTeams = !!homeResolved && !!awayResolved
  const homeUnresolved = !homeResolved && !!draft.home_team
  const awayUnresolved = !awayResolved && !!draft.away_team

  function handleTeamSelect(side: 'home' | 'away', name: string) {
    const t = localTeams.find(t => t.name === name) ?? null
    if (side === 'home') { setHomeResolved(t); setHomeSelectVal(name) }
    else                 { setAwayResolved(t); setAwaySelectVal(name) }
  }

  function handleTeamCreated(side: 'home' | 'away', team: Team) {
    setLocalTeams(prev => prev.find(t => t.id === team.id) ? prev : [...prev, team])
    if (side === 'home') { setHomeResolved(team); setHomeSelectVal(team.name) }
    else                 { setAwayResolved(team); setAwaySelectVal(team.name) }
  }

  if (applied) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)' }}>
        <CheckCircle2 size={13} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-success)' }}>
          {homeResolved?.name ?? draft.home_team} vs {awayResolved?.name ?? draft.away_team} — saved
        </span>
      </div>
    )
  }
  if (skipped) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', opacity: 0.45 }}>
        <SkipForward size={13} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>
          {draft.home_team} vs {draft.away_team} — skipped
        </span>
      </div>
    )
  }

  function numInput(key: 'home_score' | 'away_score', label: string) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>{label}</span>
        <input
          type="number" min={0}
          value={draft[key] ?? ''}
          onChange={e => setDraft(d => ({ ...d, [key]: e.target.value === '' ? null : Number(e.target.value) }))}
          style={{ width: 44, textAlign: 'center', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 0', fontSize: '0.82rem', color: 'var(--color-text)' }}
        />
      </div>
    )
  }

  return (
    <div style={{ border: `1px solid ${!hasTeams ? 'rgba(239,68,68,0.35)' : 'var(--color-border)'}`, borderRadius: 10, overflow: 'hidden', background: 'var(--color-card)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--color-text)' }}>
            {homeResolved?.name ?? draft.home_team ?? '?'} vs {awayResolved?.name ?? draft.away_team ?? '?'}
          </span>
          {draft.matchday != null && (
            <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>MD{draft.matchday}</span>
          )}
          {draft.date && (
            <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>{draft.date}</span>
          )}
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: conf.color, background: `${conf.color}18`, border: `1px solid ${conf.color}`, borderRadius: 4, padding: '1px 5px' }}>
            {conf.label}
          </span>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: STATUS_COLORS[draft.status] ?? 'var(--color-muted)', background: `${STATUS_COLORS[draft.status] ?? 'var(--color-muted)'}18`, borderRadius: 4, padding: '1px 5px', border: `1px solid ${STATUS_COLORS[draft.status] ?? 'var(--color-border)'}` }}>
            {draft.status}
          </span>
        </div>
      </div>

      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Team selects */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(['home', 'away'] as const).map(side => {
            const label     = side === 'home' ? 'Home Team' : 'Away Team'
            const selectVal = side === 'home' ? homeSelectVal : awaySelectVal
            const resolved  = side === 'home' ? homeResolved  : awayResolved
            const aiName    = side === 'home' ? draft.home_team : draft.away_team
            const unresolved = side === 'home' ? homeUnresolved : awayUnresolved

            return (
              <div key={side} style={{ flex: 1, minWidth: 200 }}>
                <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: unresolved ? 'var(--color-danger)' : 'var(--color-muted)', marginBottom: 3 }}>
                  {label}{unresolved ? ' — not found' : ''}
                </span>
                <select
                  className="field-base"
                  value={selectVal}
                  onChange={e => handleTeamSelect(side, e.target.value)}
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.6rem', borderColor: unresolved ? 'rgba(239,68,68,0.5)' : undefined }}
                >
                  <option value="">— select team —</option>
                  {localTeams.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
                {unresolved && !resolved && (
                  <TeamResolver
                    aiName={aiName ?? ''}
                    teams={localTeams}
                    onResolved={team => handleTeamCreated(side, team)}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Scores + meta row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          {numInput('home_score', 'Home')}
          {numInput('away_score', 'Away')}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>MD</span>
            <input
              type="number" min={1}
              value={draft.matchday ?? ''}
              onChange={e => setDraft(d => ({ ...d, matchday: e.target.value === '' ? null : Number(e.target.value) }))}
              style={{ width: 44, textAlign: 'center', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 0', fontSize: '0.82rem', color: 'var(--color-text)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>Date</span>
            <input
              type="date"
              value={draft.date ?? ''}
              onChange={e => setDraft(d => ({ ...d, date: e.target.value || null }))}
              style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 8px', fontSize: '0.78rem', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>Status</span>
            <select
              className="field-base"
              value={draft.status}
              onChange={e => setDraft(d => ({ ...d, status: e.target.value as ParsedMatchResult['status'] }))}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.6rem' }}
            >
              <option value="FT">FT</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="LIVE">LIVE</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={() => { setSkipped(true); onSkip() }}
            >
              <SkipForward size={12} /> Skip
            </button>
            <button
              type="button"
              disabled={applying || !hasTeams}
              onClick={async () => {
                if (!homeResolved || !awayResolved) return
                setApplying(true)
                try { await onApply(draft, homeResolved, awayResolved); setApplied(true) }
                finally { setApplying(false) }
              }}
              style={{ background: hasTeams ? 'var(--gradient-primary)' : 'var(--color-surface-2)', border: `1px solid ${hasTeams ? 'transparent' : 'var(--color-border)'}`, borderRadius: 7, padding: '5px 14px', cursor: hasTeams ? 'pointer' : 'not-allowed', fontSize: '0.75rem', color: hasTeams ? '#fff' : 'var(--color-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, opacity: hasTeams ? 1 : 0.6 }}
            >
              {applying ? <Spinner size="sm" /> : <Check size={12} />} Apply
            </button>
          </div>
        </div>

        {/* Venue + kick-off */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>Venue</span>
            <input
              type="text"
              value={draft.venue ?? ''}
              onChange={e => setDraft(d => ({ ...d, venue: e.target.value || null }))}
              placeholder="e.g. Samson Siasia Stadium"
              style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 8px', fontSize: '0.78rem', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>Kick-off</span>
            <input
              type="time"
              value={draft.kick_off ?? ''}
              onChange={e => setDraft(d => ({ ...d, kick_off: e.target.value || null }))}
              style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 8px', fontSize: '0.78rem', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
            />
          </div>
        </div>

        {draft.status === 'PENDING' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>Pending Reason</span>
            <textarea
              className="field-base"
              rows={2}
              value={draft.pending_reason ?? ''}
              onChange={e => setDraft(d => ({ ...d, pending_reason: e.target.value }))}
              style={{ fontFamily: 'var(--font-body)', resize: 'vertical', fontSize: '0.78rem', padding: '0.4rem 0.6rem' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function MatchesAIParser({ onSaved, onClose }: Props) {
  const { success, error: toastError, warning } = useToast()

  const [text, setText]                 = useState('')
  const [image, setImage]               = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileRef                         = useRef<HTMLInputElement>(null)
  const [parsing, setParsing]           = useState(false)
  const [results, setResults]           = useState<ParsedMatchResult[]>([])
  const [teams, setTeams]               = useState<Team[]>([])
  const [appliedCount, setAppliedCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)
  const [visionFallback, setVisionFallback] = useState(false)

  useEffect(() => {
    api.getTeams().then(setTeams).catch(() => {})
  }, [])

  function handleImageDrop(file: File) {
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleParse() {
    if (!text.trim() && !image) return
    setParsing(true)
    setResults([])
    setAppliedCount(0)
    setSkippedCount(0)
    try {
      const parsed = await api.parseMatchesBulk({ text: text.trim() || undefined, image: image ?? undefined })
      if (!parsed.length) {
        warning('AI found no match data — try pasting more text or a clearer screenshot.')
        return
      }
      setResults(parsed)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('vision_unavailable') || msg.includes('503')) {
        setVisionFallback(true)
      } else {
        toastError(msg || 'Parse failed.')
      }
    } finally {
      setParsing(false)
    }
  }

  async function handleApply(draft: ParsedMatchResult, home: Team, away: Team): Promise<void> {
    const payload = toMatchPayload({
      home_team:      home.id,
      away_team:      away.id,
      home_score:     draft.home_score ?? '',
      away_score:     draft.away_score ?? '',
      matchday:       draft.matchday ?? '',
      date:           draft.date ?? '',
      kick_off:       draft.kick_off ?? '',
      venue:          draft.venue ?? '',
      status:         draft.status,
      pending_reason: draft.pending_reason ?? '',
    })
    await api.createMatch(payload)
    success(`${home.name} vs ${away.name} saved.`)
    setAppliedCount(n => n + 1)
    onSaved()
  }

  async function handleApplyAll() {
    const applicable = results.filter(r =>
      resolveTeam(r.home_team, teams) && resolveTeam(r.away_team, teams)
    )
    if (!applicable.length) {
      warning('No rows with both teams resolved — fix team names first.')
      return
    }
    let count = 0
    for (const row of applicable) {
      const home = resolveTeam(row.home_team, teams)!
      const away = resolveTeam(row.away_team, teams)!
      try {
        await handleApply(row, home, away)
        count++
      } catch { /* individual failures already toasted */ }
    }
    if (count > 0) success(`Saved ${count} match${count > 1 ? 'es' : ''}.`)
  }

  const unresolvedCount = results.filter(r => {
    return !resolveTeam(r.home_team, teams) || !resolveTeam(r.away_team, teams)
  }).length

  return (
    <>
      {visionFallback && (
        <VisionFallbackModal context="matches" onClose={() => setVisionFallback(false)} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '80vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, background: 'var(--color-surface-2)', flexShrink: 0 }}>
              <Bot size={16} style={{ color: 'var(--color-highlight)' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>AI Match Import</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                Paste a fixture list or results table, or drop a screenshot — AI parses and saves to DB
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Input */}
        {results.length === 0 && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: 6 }}>
                Fixture list / results text
              </label>
              <textarea
                className="field-base"
                rows={7}
                placeholder={'Paste match results or fixtures here — e.g.:\nMatchday 14\nRivers Angels 2-1 Edo Queens, April 30, Adokiye Amiesimaka Stadium\nNasarawa Amazons 0-0 Bayelsa Queens'}
                value={text}
                onChange={e => setText(e.target.value)}
                style={{ fontFamily: 'monospace', resize: 'vertical', fontSize: '0.82rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: 6 }}>
                Screenshot (optional)
              </label>
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleImageDrop(f) }}
                onClick={() => fileRef.current?.click()}
                style={{ border: '2px dashed var(--color-border)', borderRadius: 10, padding: imagePreview ? 0 : '20px', textAlign: 'center', cursor: 'pointer', background: 'var(--color-bg-subtle)', overflow: 'hidden' }}
              >
                {imagePreview ? (
                  <div style={{ position: 'relative' }}>
                    <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                    <button type="button"
                      onClick={e => { e.stopPropagation(); setImage(null); setImagePreview(null) }}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#fff' }}>
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div style={{ color: 'var(--color-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <ImageIcon size={20} />
                    <span style={{ fontSize: '0.78rem' }}>Drop screenshot or click to browse</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageDrop(f) }} />
            </div>

            <button type="button" className="btn-primary" onClick={handleParse}
              disabled={parsing || (!text.trim() && !image)}
              style={{ alignSelf: 'flex-start' }}>
              {parsing ? <Spinner size="sm" /> : <Bot size={14} />}
              {parsing ? 'Parsing...' : 'Parse with AI'}
            </button>
          </>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>
                {results.length} match{results.length > 1 ? 'es' : ''} parsed
                {unresolvedCount > 0 && (
                  <span style={{ marginLeft: 8, fontSize: '0.72rem', color: 'var(--color-warning)', fontWeight: 700 }}>
                    · {unresolvedCount} team{unresolvedCount > 1 ? 's' : ''} need fixing
                  </span>
                )}
              </p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                  <span style={{ color: 'var(--color-success)' }}>{appliedCount} saved</span>
                  {' · '}{skippedCount} skipped
                </span>
                <button type="button" className="btn-primary"
                  onClick={() => void handleApplyAll()}
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>
                  <Upload size={12} /> Apply All
                </button>
                <button type="button"
                  onClick={() => setResults([])}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-highlight)', fontSize: '0.72rem', fontWeight: 600, padding: 0 }}>
                  Parse again
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map((r, i) => (
                <MatchReviewCard
                  key={`${r.home_team}-${r.away_team}-${i}`}
                  row={r}
                  teams={teams}
                  onApply={handleApply}
                  onSkip={() => setSkippedCount(n => n + 1)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
