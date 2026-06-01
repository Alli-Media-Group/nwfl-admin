import { useRef, useState } from 'react'
import { Bot, ImageIcon, CheckCircle2, AlertTriangle, X, Check, SkipForward } from 'lucide-react'
import { api, LOGO_SOURCES } from '../../lib/api'
import { useToast } from '../ui/Toast'
import { Spinner } from '../ui/Spinner'
import { VisionFallbackModal } from '../ui/VisionFallbackModal'
import type { ParsedTeamResult, Team, TeamExistenceResult } from '../../types'

interface Props {
  onSaved: (team: Team) => void
}

type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW'

const CONF: Record<ConfidenceLevel, { color: string; bg: string; label: string }> = {
  HIGH:   { color: 'var(--color-success)', bg: 'rgba(34,197,94,0.08)',   label: 'HIGH' },
  MEDIUM: { color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.08)',  label: 'MED'  },
  LOW:    { color: 'var(--color-danger)',  bg: 'rgba(239,68,68,0.08)',   label: 'LOW'  },
}

// ── Single team review card ───────────────────────────────────────────────────
function TeamReviewCard({
  result,
  existence,
  onSave,
  onSkip,
}: {
  result: ParsedTeamResult
  existence: TeamExistenceResult | null
  onSave: (draft: ParsedTeamResult) => Promise<void>
  onSkip: () => void
}) {
  const alreadyExists = existence?.exists ?? false
  const existingTeam  = existence?.team ?? null
  const [draft, setDraft] = useState<ParsedTeamResult>({ ...result })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [skipped, setSkipped] = useState(false)
  const [logoIndex, setLogoIndex] = useState(0)
  const conf = CONF[draft.confidence] ?? CONF.LOW
  const logoSources = draft.slug ? LOGO_SOURCES(draft.slug) : []

  if (saved) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
        <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-success)' }}>{draft.name} saved</span>
      </div>
    )
  }

  if (skipped) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 10, background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', opacity: 0.5 }}>
        <SkipForward size={16} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{draft.name} — skipped</span>
      </div>
    )
  }

  function field(key: keyof ParsedTeamResult, label: string, type: 'text' | 'number' = 'text', fullWidth = false) {
    return (
      <div key={key} style={fullWidth ? { gridColumn: '1 / -1' } : {}}>
        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: 3 }}>
          {label}
        </label>
        <input
          className="field-base"
          type={type}
          value={(draft[key] as string | number) ?? ''}
          onChange={e => setDraft(d => ({ ...d, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
          style={{ fontSize: '0.82rem', padding: '0.5rem 0.7rem' }}
        />
      </div>
    )
  }

  return (
    <div style={{ border: `1px solid ${alreadyExists ? 'rgba(245,158,11,0.4)' : 'var(--color-border)'}`, borderRadius: 12, overflow: 'hidden', background: 'var(--color-card)' }}>
      {/* Duplicate warning */}
      {alreadyExists && existingTeam && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle size={13} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)', fontWeight: 600 }}>
            Already in DB as "{existingTeam.name}" — saving will create a duplicate. Use Update instead.
          </span>
        </div>
      )}
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--color-border)', background: conf.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {draft.confidence === 'HIGH'
            ? <CheckCircle2 size={13} style={{ color: conf.color }} />
            : <AlertTriangle size={13} style={{ color: conf.color }} />
          }
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: conf.color }}>{draft.name}</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: conf.color, opacity: 0.7, background: conf.bg, borderRadius: 4, padding: '1px 5px', border: `1px solid ${conf.color}` }}>
            {conf.label}
          </span>
        </div>
        {/* Logo preview — walks fallback chain */}
        {logoSources.length > 0 && logoIndex < logoSources.length && (
          <img
            src={logoSources[logoIndex]}
            alt=""
            style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain', background: 'var(--color-surface)' }}
            onError={() => setLogoIndex(i => i + 1)}
          />
        )}
      </div>

      {/* Fields */}
      <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {field('name', 'Full Name', 'text', true)}
        {field('short_name', 'Short Name')}
        {field('slug', 'Slug')}
        {/* Group select */}
        <div>
          <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: 3 }}>Group</label>
          <select
            className="field-base"
            value={draft.group ?? 'A'}
            onChange={e => setDraft(d => ({ ...d, group: e.target.value as 'A' | 'B' }))}
            style={{ fontSize: '0.82rem', padding: '0.5rem 0.7rem' }}
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
        {/* Bio */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: 3 }}>Bio</label>
          <textarea
            className="field-base"
            rows={2}
            value={draft.bio ?? ''}
            onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
            style={{ fontFamily: 'var(--font-body)', resize: 'vertical', fontSize: '0.82rem', padding: '0.5rem 0.7rem' }}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
        <button
          type="button"
          className="btn-outline"
          onClick={() => { setSkipped(true); onSkip() }}
          style={{ fontSize: '0.78rem', padding: '0.5rem 0.9rem' }}
        >
          <SkipForward size={13} /> Skip
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={saving || !draft.name}
          onClick={async () => {
            setSaving(true)
            try {
              await onSave(draft)
              setSaved(true)
            } finally {
              setSaving(false)
            }
          }}
          style={{ fontSize: '0.78rem', padding: '0.5rem 0.9rem' }}
        >
          {saving ? <Spinner size="sm" /> : <Check size={13} />}
          {alreadyExists ? 'Update' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ── Main parser panel ─────────────────────────────────────────────────────────
export function TeamAIParser({ onSaved }: Props) {
  const { success, error: toastError } = useToast()

  const [text, setText]               = useState('')
  const [image, setImage]             = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileRef                       = useRef<HTMLInputElement>(null)
  const [parsing, setParsing]             = useState(false)
  const [results, setResults]             = useState<ParsedTeamResult[]>([])
  const [existence, setExistence]         = useState<Record<string, TeamExistenceResult>>({})
  const [savedCount, setSavedCount]       = useState(0)
  const [skippedCount, setSkippedCount]   = useState(0)
  const [visionFallback, setVisionFallback] = useState(false)

  function handleImageDrop(file: File) {
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleParse() {
    if (!text.trim() && !image) return
    setParsing(true)
    setResults([])
    setExistence({})
    setSavedCount(0)
    setSkippedCount(0)
    try {
      const parsed = await api.parseTeam({ text: text.trim() || undefined, image: image ?? undefined })
      // Check all parsed names against the DB in one shot
      const existenceMap = await api.checkTeams(parsed.map(p => p.name))
      setResults(parsed)
      setExistence(existenceMap)
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

  async function handleSave(draft: ParsedTeamResult): Promise<void> {
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
    const existing = existence[draft.name]
    let saved: Team
    if (existing?.exists && existing.team) {
      // Team already in DB — update it instead of creating a duplicate
      saved = await api.updateTeam(existing.team.id, payload)
      success(`${saved.name} updated.`)
    } else {
      saved = await api.createTeam(payload)
      success(`${saved.name} saved.`)
    }
    setSavedCount(n => n + 1)
    onSaved(saved)
  }

  return (
    <>
    {visionFallback && (
      <VisionFallbackModal context="team" onClose={() => setVisionFallback(false)} />
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '80vh', overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, background: 'var(--color-surface-2)', flexShrink: 0 }}>
            <Bot size={16} style={{ color: 'var(--color-highlight)' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>AI Team Parser</p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-muted)' }}>
              Paste text, a Wikipedia excerpt, or drop a screenshot — supports multiple teams at once
            </p>
          </div>
        </div>
      </div>

      {/* Input — only show before results */}
      {results.length === 0 && (
        <>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: 6 }}>
              Raw text / Wikipedia / NFF page / match notes
            </label>
            <textarea
              className="field-base"
              rows={5}
              placeholder='Paste team info here — you can include multiple teams in one paste'
              value={text}
              onChange={e => setText(e.target.value)}
              style={{ fontFamily: 'monospace', resize: 'vertical', fontSize: '0.82rem' }}
            />
          </div>

          {/* Image drop */}
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: 6 }}>
              Screenshot (optional)
            </label>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleImageDrop(f) }}
              onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed var(--color-border)', borderRadius: 10, padding: imagePreview ? 0 : '20px', textAlign: 'center', cursor: 'pointer', background: 'var(--color-bg-subtle)', overflow: 'hidden', position: 'relative' }}
            >
              {imagePreview ? (
                <div style={{ position: 'relative' }}>
                  <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
                  <button type="button" onClick={e => { e.stopPropagation(); setImage(null); setImagePreview(null) }}
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

          <button type="button" className="btn-primary" onClick={handleParse} disabled={parsing || (!text.trim() && !image)} style={{ alignSelf: 'flex-start' }}>
            {parsing ? <Spinner size="sm" /> : <Bot size={14} />}
            {parsing ? 'Parsing...' : 'Parse with AI'}
          </button>
        </>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>
              {results.length} team{results.length > 1 ? 's' : ''} found — review and save each one
            </p>
            <div style={{ display: 'flex', gap: 8, fontSize: '0.72rem', color: 'var(--color-muted)' }}>
              <span style={{ color: 'var(--color-success)' }}>{savedCount} saved</span>
              <span>·</span>
              <span>{skippedCount} skipped</span>
              <span>·</span>
              <button type="button" onClick={() => setResults([])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-highlight)', fontSize: '0.72rem', fontWeight: 600, padding: 0 }}>
                Parse again
              </button>
            </div>
          </div>

          {results.map((r, i) => (
            <TeamReviewCard
              key={`${r.slug}-${i}`}
              result={r}
              existence={existence[r.name] ?? null}
              onSave={handleSave}
              onSkip={() => setSkippedCount(n => n + 1)}
            />
          ))}
        </div>
      )}
    </div>
    </>
  )
}
