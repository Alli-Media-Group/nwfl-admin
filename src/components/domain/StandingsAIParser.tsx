import { useEffect, useRef, useState } from 'react'
import {
  Bot, ImageIcon, CheckCircle2, AlertTriangle,
  X, Check, SkipForward, HelpCircle, Search, ChevronDown, ChevronUp, Upload,
} from 'lucide-react'
import { api, LOGO_SOURCES } from '../../lib/api'
import { useToast } from '../ui/Toast'
import { Spinner } from '../ui/Spinner'
import { VisionFallbackModal } from '../ui/VisionFallbackModal'
import type {
  ParsedStandingRow, ParsedTeamResult, Standing, Team, TeamExistenceResult,
} from '../../types'

interface Props {
  standings: Standing[]
  onSaved: () => void
  onClose: () => void
}

type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW'
const CONF: Record<ConfidenceLevel, { color: string; label: string }> = {
  HIGH:   { color: 'var(--color-success)', label: 'HIGH' },
  MEDIUM: { color: 'var(--color-warning)', label: 'MED'  },
  LOW:    { color: 'var(--color-danger)',  label: 'LOW'  },
}

// ── Inline team import card (shown when a team is unmatched) ─────────────────
function UnmatchedTeamCard({
  teamName,
  triggerResearch,
  onImported,
}: {
  teamName: string
  triggerResearch: number   // increment to auto-trigger research
  onImported: (team: Team) => void
}) {
  const { success, error: toastError } = useToast()
  const [researching, setResearching] = useState(false)
  const [draft, setDraft]             = useState<ParsedTeamResult | null>(null)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [expanded, setExpanded]       = useState(false)
  const [logoIndex, setLogoIndex]     = useState(0)

  // Auto-trigger when parent calls "Research All"
  useEffect(() => {
    if (triggerResearch > 0 && !researching && !draft && !saved) {
      void handleResearch()
    }
  }, [triggerResearch]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleResearch() {
    setResearching(true)
    setDraft(null)
    try {
      const results = await api.researchTeams([teamName])
      // api.researchTeams returns an array — but quota exceeded returns a top-level error object
      if (!Array.isArray(results)) {
        const err = (results as unknown as { error: string; detail?: string })
        if (err.error === 'ai_quota_exceeded') {
          toastError('OpenRouter daily free limit reached. Resets at midnight UTC — try again tomorrow or add credits.')
          return
        }
        toastError('Unexpected response from research endpoint.')
        return
      }
      const r = results[0]
      if (r.error || !r.result) {
        toastError(r.error ?? 'Research returned no data — try again or enter details manually.')
        return
      }
      setDraft(r.result)
      setExpanded(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('ai_quota_exceeded') || msg.includes('503')) {
        toastError('OpenRouter daily free limit reached. Resets at midnight UTC — try again tomorrow.')
      } else {
        toastError(msg || 'Research failed.')
      }
    } finally {
      setResearching(false)
    }
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    try {
      const payload = {
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
      }
      const team = await api.createTeam(payload)
      setSaved(true)
      success(`${team.name} imported.`)
      onImported(team)
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  function field(key: keyof ParsedTeamResult, label: string, type: 'text' | 'number' = 'text', fullWidth = false) {
    if (!draft) return null
    return (
      <div key={key} style={fullWidth ? { gridColumn: '1 / -1' } : {}}>
        <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: 3 }}>
          {label}
        </label>
        <input
          className="field-base"
          type={type}
          value={(draft[key] as string | number) ?? ''}
          onChange={e => setDraft(d => d ? { ...d, [key]: type === 'number' ? Number(e.target.value) : e.target.value } : d)}
          style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
        />
      </div>
    )
  }

  if (saved) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)' }}>
        <CheckCircle2 size={13} style={{ color: 'var(--color-success)' }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-success)' }}>{draft?.name ?? teamName} — imported to DB</span>
      </div>
    )
  }

  const logoSources = draft?.slug ? LOGO_SOURCES(draft.slug) : []
  const conf = draft ? (CONF[draft.confidence] ?? CONF.LOW) : null

  return (
    <div style={{ border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, overflow: 'hidden', background: 'var(--color-card)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: 'rgba(239,68,68,0.06)', borderBottom: draft ? '1px solid var(--color-border)' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HelpCircle size={13} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)' }}>{teamName}</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--color-danger)', fontWeight: 600 }}>not in DB</span>
          {conf && (
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: conf.color, background: `${conf.color}18`, border: `1px solid ${conf.color}`, borderRadius: 4, padding: '1px 5px' }}>
              {conf.label}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!draft && (
            <button
              type="button"
              disabled={researching}
              onClick={handleResearch}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gradient-primary)', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}
            >
              {researching ? <Spinner size="sm" /> : <Search size={12} />}
              {researching ? 'Researching...' : 'Research'}
            </button>
          )}
          {draft && (
            <button
              type="button"
              onClick={() => setExpanded(e => !e)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? 'Collapse' : 'Review'}
            </button>
          )}
        </div>
      </div>

      {/* Researched data — editable form */}
      {draft && expanded && (
        <>
          <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* Logo preview */}
            {logoSources.length > 0 && logoIndex < logoSources.length && (
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src={logoSources[logoIndex]}
                  alt=""
                  style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', background: 'var(--color-surface)' }}
                  onError={() => setLogoIndex(i => i + 1)}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>Logo preview (from local store)</span>
              </div>
            )}
            {field('name', 'Full Name', 'text', true)}
            {field('short_name', 'Short Name')}
            {field('slug', 'Slug')}
            <div>
              <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: 3 }}>Group</label>
              <select
                className="field-base"
                value={draft.group ?? 'A'}
                onChange={e => setDraft(d => d ? { ...d, group: e.target.value as 'A' | 'B' } : d)}
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
              >
                <option value="A">Group A</option>
                <option value="B">Group B</option>
              </select>
            </div>
            {field('city', 'City')}
            {field('state', 'State')}
            {field('manager', 'Manager')}
            {field('founded', 'Founded', 'number')}
            {field('titles', 'Titles', 'number')}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: 3 }}>Bio</label>
              <textarea
                className="field-base"
                rows={2}
                value={draft.bio ?? ''}
                onChange={e => setDraft(d => d ? { ...d, bio: e.target.value } : d)}
                style={{ fontFamily: 'var(--font-body)', resize: 'vertical', fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
            <button
              type="button"
              onClick={handleResearch}
              disabled={researching}
              style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {researching ? <Spinner size="sm" /> : <Search size={12} />} Re-research
            </button>
            <button
              type="button"
              disabled={saving || !draft.name}
              onClick={handleSave}
              style={{ background: 'var(--gradient-primary)', border: 'none', borderRadius: 7, padding: '5px 14px', cursor: 'pointer', fontSize: '0.75rem', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {saving ? <Spinner size="sm" /> : <Check size={12} />} Import to DB
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── One parsed standings row ──────────────────────────────────────────────────
function RowReviewLine({
  row,
  existence,
  onApply,
  onSkip,
}: {
  row: ParsedStandingRow
  existence: TeamExistenceResult | null
  onApply: (row: ParsedStandingRow) => Promise<void>
  onSkip: () => void
}) {
  const [draft, setDraft]       = useState<ParsedStandingRow>({ ...row })
  const [applying, setApplying] = useState(false)
  const [applied, setApplied]   = useState(false)
  const [skipped, setSkipped]   = useState(false)
  const conf = CONF[draft.confidence] ?? CONF.LOW
  const matched   = existence?.exists ? existence.team : null
  const unmatched = !existence?.exists

  if (applied) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)' }}>
        <CheckCircle2 size={13} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-success)' }}>{matched?.name ?? draft.team_name} — applied</span>
      </div>
    )
  }
  if (skipped) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', opacity: 0.45 }}>
        <SkipForward size={13} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>{draft.team_name} — skipped</span>
      </div>
    )
  }

  function numField(key: keyof ParsedStandingRow, label: string) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>{label}</span>
        <input
          type="number" min={0}
          value={(draft[key] as number) ?? 0}
          onChange={e => setDraft(d => ({ ...d, [key]: Number(e.target.value) }))}
          style={{ width: 44, textAlign: 'center', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 0', fontSize: '0.82rem', color: 'var(--color-text)' }}
        />
      </div>
    )
  }

  return (
    <div style={{ border: `1px solid ${unmatched ? 'rgba(239,68,68,0.35)' : 'var(--color-border)'}`, borderRadius: 10, overflow: 'hidden', background: 'var(--color-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--color-text)' }}>
            {matched ? matched.name : draft.team_name}
          </span>
          {matched && matched.name !== draft.team_name && (
            <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>← "{draft.team_name}"</span>
          )}
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: conf.color, background: `${conf.color}18`, border: `1px solid ${conf.color}`, borderRadius: 4, padding: '1px 5px' }}>
            {conf.label}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', flexWrap: 'wrap' }}>
        {numField('played', 'P')}
        {numField('won', 'W')}
        {numField('drawn', 'D')}
        {numField('lost', 'L')}
        {numField('gf', 'GF')}
        {numField('ga', 'GA')}
        {numField('points', 'Pts')}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {unmatched && (
            <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)', fontWeight: 600 }}>
              Import team first ↑
            </span>
          )}
          {!unmatched && (
            <button type="button"
              style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={() => { setSkipped(true); onSkip() }}
            >
              <SkipForward size={12} /> Skip
            </button>
          )}
          <button type="button"
            disabled={applying || unmatched}
            onClick={async () => { setApplying(true); try { await onApply(draft); setApplied(true) } finally { setApplying(false) } }}
            style={{ background: unmatched ? 'var(--color-surface-2)' : 'var(--gradient-primary)', border: `1px solid ${unmatched ? 'var(--color-border)' : 'transparent'}`, borderRadius: 7, padding: '5px 14px', cursor: unmatched ? 'not-allowed' : 'pointer', fontSize: '0.75rem', color: unmatched ? 'var(--color-muted)' : '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, opacity: unmatched ? 0.6 : 1 }}
          >
            {applying ? <Spinner size="sm" /> : <Check size={12} />} Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function StandingsAIParser({ standings: _standings, onSaved, onClose }: Props) {
  const { success, error: toastError, warning } = useToast()

  const [text, setText]                 = useState('')
  const [image, setImage]               = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileRef                         = useRef<HTMLInputElement>(null)
  const [parsing, setParsing]           = useState(false)
  const [results, setResults]           = useState<ParsedStandingRow[]>([])
  const [existence, setExistence]       = useState<Record<string, TeamExistenceResult>>({})
  const [appliedCount, setAppliedCount]     = useState(0)
  const [skippedCount, setSkippedCount]     = useState(0)
  const [visionFallback, setVisionFallback] = useState(false)
  const [researchAllTick, setResearchAllTick] = useState(0)
  // After a team is imported via UnmatchedTeamCard, update existence so its row unlocks
  const [, setImportedTeams] = useState<Record<string, Team>>({})

  function handleImageDrop(file: File) {
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleParse() {
    if (!text.trim() && !image) return
    setParsing(true)
    setResults([])
    setExistence({})
    setAppliedCount(0)
    setSkippedCount(0)
    setImportedTeams({})
    try {
      const parsed = await api.parseStandings({ text: text.trim() || undefined, image: image ?? undefined })
      const existenceMap = await api.checkTeams(parsed.map(p => p.team_name))
      setResults(parsed)
      setExistence(existenceMap)
      const unmatched = parsed.filter(p => !existenceMap[p.team_name]?.exists)
      if (unmatched.length > 0) {
        warning(`${unmatched.length} team${unmatched.length > 1 ? 's' : ''} not found in DB — use "Research" to import them below.`)
      }
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

  function handleResearchAll() {
    // Increment the tick — each UnmatchedTeamCard watches this and auto-starts research
    setResearchAllTick(n => n + 1)
  }

  function handleTeamImported(teamName: string, team: Team) {
    setImportedTeams(prev => ({ ...prev, [teamName]: team }))
    // Update existence map so the standing row becomes applicable
    setExistence(prev => ({
      ...prev,
      [teamName]: { exists: true, team },
    }))
    onSaved() // refresh standings list in parent
  }

  async function handleApply(draft: ParsedStandingRow): Promise<void> {
    const ex = existence[draft.team_name]
    if (!ex?.exists || !ex.team) {
      toastError(`${draft.team_name} not found in DB — import the team first.`)
      return
    }
    // Always fetch fresh standings — the prop snapshot goes stale when teams are imported mid-session
    const freshStandings = await api.getStandings()
    const standing = freshStandings.find(s => s.team.id === ex.team!.id)
    if (!standing) {
      toastError(`No standing row found for ${ex.team.name} — try refreshing the page.`)
      return
    }
    await api.updateStanding(standing.id, {
      played: draft.played,
      won:    draft.won,
      drawn:  draft.drawn,
      lost:   draft.lost,
      gf:     draft.gf,
      ga:     draft.ga,
      points: draft.points,
    })
    success(`${ex.team.name} updated.`)
    setAppliedCount(n => n + 1)
    onSaved()
  }

  async function handleApplyAll() {
    const applicable = results.filter(r => existence[r.team_name]?.exists)
    if (!applicable.length) {
      warning('No matched teams to apply — import the missing teams first.')
      return
    }
    // Fetch standings once for the whole batch instead of once per row
    const freshStandings = await api.getStandings()
    let count = 0
    for (const row of applicable) {
      const ex = existence[row.team_name]
      if (!ex?.exists || !ex.team) continue
      const standing = freshStandings.find(s => s.team.id === ex.team!.id)
      if (!standing) continue
      try {
        await api.updateStanding(standing.id, {
          played: row.played, won: row.won, drawn: row.drawn, lost: row.lost,
          gf: row.gf, ga: row.ga, points: row.points,
        })
        count++
      } catch {
        toastError(`Failed to update ${ex.team.name}.`)
      }
    }
    setAppliedCount(n => n + count)
    if (count > 0) {
      success(`Applied ${count} standing row${count > 1 ? 's' : ''}.`)
      onSaved()
    }
  }

  const unmatchedRows = results.filter(r => !existence[r.team_name]?.exists)

  return (
    <>
    {visionFallback && (
      <VisionFallbackModal context="standings" onClose={() => setVisionFallback(false)} />
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '80vh', overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, background: 'var(--color-surface-2)', flexShrink: 0 }}>
            <Bot size={16} style={{ color: 'var(--color-highlight)' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>AI Standings Import</p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-muted)' }}>
              Paste a table or drop a screenshot — AI reads it, researches missing teams, updates the DB
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
              Pasted table / website text
            </label>
            <textarea
              className="field-base"
              rows={6}
              placeholder={'Paste standings table here — e.g.:\n1. Rivers Angels  14  10  2  2  28  9  32\n2. Nasarawa Amazons  14  9  3  2  ...'}
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

          {/* Summary bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>
              {results.length} row{results.length > 1 ? 's' : ''} parsed
              {unmatchedRows.length > 0 && (
                <span style={{ marginLeft: 8, fontSize: '0.72rem', color: 'var(--color-danger)', fontWeight: 700 }}>
                  · {unmatchedRows.length} need importing
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                <span style={{ color: 'var(--color-success)' }}>{appliedCount} applied</span>
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

          {/* Unmatched teams section — research and import inline */}
          {unmatchedRows.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={13} style={{ color: 'var(--color-warning)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-warning)' }}>
                    {unmatchedRows.length} team{unmatchedRows.length > 1 ? 's' : ''} not in DB — import first, then Apply becomes available
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleResearchAll()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gradient-primary)', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: '0.73rem', color: '#fff', fontWeight: 600 }}
                >
                  <Search size={12} /> Research All
                </button>
              </div>
              {unmatchedRows.map((r, i) => (
                <UnmatchedTeamCard
                  key={`unmatched-${r.team_name}-${i}`}
                  teamName={r.team_name}
                  triggerResearch={researchAllTick}
                  onImported={team => handleTeamImported(r.team_name, team)}
                />
              ))}
            </div>
          )}

          {/* Standing rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map((r, i) => (
              <RowReviewLine
                key={`${r.team_name}-${i}`}
                row={r}
                existence={existence[r.team_name] ?? null}
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
