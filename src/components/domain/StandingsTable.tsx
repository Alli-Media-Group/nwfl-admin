import { Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api, LOGO_SOURCES } from '../../lib/api'
import type { Standing } from '../../types'
import { Spinner } from '../ui/Spinner'

type EditableKey = 'drawn' | 'ga' | 'gf' | 'lost' | 'played' | 'points' | 'won'

const QUALIFY_COUNT = 3
const RELEGATE: Record<'A' | 'B', number> = { A: 3, B: 4 }

function rowStatus(index: number, total: number, relegateCount: number): 'qualify' | 'relegate' | 'safe' {
  if (index < QUALIFY_COUNT) return 'qualify'
  if (index >= total - relegateCount) return 'relegate'
  return 'safe'
}

const STATUS_COLORS = {
  qualify:  { border: 'var(--color-success)', badge: 'rgba(34,197,94,0.18)',  text: 'var(--color-success)' },
  relegate: { border: 'var(--color-danger)',  badge: 'rgba(239,68,68,0.18)',  text: 'var(--color-danger)'  },
  safe:     { border: 'transparent',          badge: 'transparent',            text: 'var(--color-muted)'   },
}

// ── Logo with initials fallback ───────────────────────────────────────────────
function TeamLogo({ slug, name }: { slug: string; name: string }) {
  const sources = LOGO_SOURCES(slug)
  const [idx, setIdx] = useState(0)

  if (idx < sources.length) {
    return (
      <img
        src={sources[idx]}
        alt={name}
        onError={() => setIdx(i => i + 1)}
        style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'contain', flexShrink: 0, background: 'var(--color-surface-2)' }}
      />
    )
  }
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text)',
    }}>
      {name.charAt(0)}
    </div>
  )
}

// ── Inline editable number cell ───────────────────────────────────────────────
function NumCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{
        width: 48, textAlign: 'center',
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: 6,
        padding: '3px 0',
        fontSize: '0.88rem',
        fontWeight: 500,
        color: 'var(--color-text)',
        fontFamily: 'inherit',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onFocus={e => {
        e.currentTarget.style.background = 'var(--color-bg-subtle)'
        e.currentTarget.style.borderColor = 'var(--color-highlight)'
      }}
      onBlur={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.borderColor = 'transparent'
      }}
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function StandingsTable({
  group,
  rows,
  onSaved,
}: {
  group: 'A' | 'B'
  rows: Standing[]
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<Record<number, Partial<Standing>>>({})
  const [saving, setSaving] = useState(false)
  const relegateCount = RELEGATE[group]

  const sorted = useMemo(
    () => [...rows].sort((a, b) => {
      const ma = { ...a, ...draft[a.id] }
      const mb = { ...b, ...draft[b.id] }
      return (mb.points - ma.points) || ((mb.gf - mb.ga) - (ma.gf - ma.ga))
    }),
    [rows, draft],
  )

  function update(id: number, key: EditableKey, value: number) {
    setDraft(cur => ({ ...cur, [id]: { ...cur[id], [key]: value } }))
  }

  async function saveChanges() {
    setSaving(true)
    try {
      await Promise.all(
        Object.entries(draft).map(([id, payload]) => api.updateStanding(Number(id), payload))
      )
      setDraft({})
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const isDirty = Object.keys(draft).length > 0

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
    padding: '0.65rem 0.75rem',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    borderRight: '1px solid var(--color-border)',
    fontSize: '0.88rem',
    color: 'var(--color-text)',
    fontWeight: 500,
  }

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>

      {/* Header */}
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--color-highlight)' }}>
            Group {group}
          </p>
          <h3 style={{ margin: '2px 0 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>
            Standings
          </h3>
        </div>
        <button
          type="button"
          disabled={!isDirty || saving}
          onClick={() => void saveChanges()}
          className="btn-primary"
          style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', opacity: isDirty ? 1 : 0.4 }}
        >
          {saving ? <Spinner size="sm" /> : <Save size={13} />}
          Save Changes
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #4b1fa3 0%, #8a3dff 100%)' }}>
              <th style={{ ...thStyle, width: 40, borderRight: '1px solid rgba(255,255,255,0.15)' }}>#</th>
              <th style={{ ...thStyle, textAlign: 'left', paddingLeft: '1rem', minWidth: 160 }}>Team</th>
              <th style={thStyle}>MP</th>
              <th style={thStyle}>W</th>
              <th style={thStyle}>D</th>
              <th style={thStyle}>L</th>
              <th style={thStyle}>GF</th>
              <th style={thStyle}>GA</th>
              <th style={thStyle}>GD</th>
              <th style={thStyle}>PTS</th>
              <th style={{ ...thStyle, borderRight: 'none', minWidth: 100 }}>Form</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, index) => {
              const merged = { ...row, ...draft[row.id] }
              const status = rowStatus(index, sorted.length, relegateCount)
              const sc = STATUS_COLORS[status]
              const gd = merged.gf - merged.ga

              return (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: index < sorted.length - 1 ? '1px solid var(--color-border)' : 'none',
                    borderLeft: `3px solid ${sc.border}`,
                    background: index % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = index % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent')}
                >
                  {/* Position badge */}
                  <td style={{ ...tdStyle, width: 40 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 24, height: 24, borderRadius: '50%',
                      fontSize: '0.7rem', fontWeight: 700,
                      background: sc.badge, color: sc.text,
                    }}>
                      {index + 1}
                    </span>
                  </td>

                  {/* Team */}
                  <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TeamLogo slug={row.team.slug} name={row.team.name} />
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
                        {row.team.name}
                      </span>
                    </div>
                  </td>

                  {/* Editable stats */}
                  <td style={tdStyle}><NumCell value={merged.played} onChange={v => update(row.id, 'played', v)} /></td>
                  <td style={tdStyle}><NumCell value={merged.won}    onChange={v => update(row.id, 'won',    v)} /></td>
                  <td style={tdStyle}><NumCell value={merged.drawn}  onChange={v => update(row.id, 'drawn',  v)} /></td>
                  <td style={tdStyle}><NumCell value={merged.lost}   onChange={v => update(row.id, 'lost',   v)} /></td>
                  <td style={tdStyle}><NumCell value={merged.gf}     onChange={v => update(row.id, 'gf',     v)} /></td>
                  <td style={tdStyle}><NumCell value={merged.ga}     onChange={v => update(row.id, 'ga',     v)} /></td>

                  {/* GD — read only, derived */}
                  <td style={{ ...tdStyle, fontWeight: 600, color: gd > 0 ? 'var(--color-success)' : gd < 0 ? 'var(--color-danger)' : 'var(--color-muted)' }}>
                    {gd > 0 ? `+${gd}` : gd}
                  </td>

                  {/* Points */}
                  <td style={{ ...tdStyle, fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                    <NumCell value={merged.points} onChange={v => update(row.id, 'points', v)} />
                  </td>

                  {/* Form dots */}
                  <td style={{ ...tdStyle, borderRight: 'none' }}>
                    <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                      {(row.form ?? []).slice(-5).map((result, i) => {
                        const bg = result === 'W' ? 'var(--color-success)' : result === 'D' ? '#d97706' : 'var(--color-danger)'
                        return (
                          <span key={i} title={result} style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 18, height: 18, borderRadius: '50%',
                            background: bg, color: '#fff',
                            fontSize: '0.6rem', fontWeight: 700, flexShrink: 0,
                          }}>
                            {result}
                          </span>
                        )
                      })}
                    </div>
                  </td>
                </tr>
              )
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={11} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                  No teams in Group {group} yet — import teams first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Qualifies for Playoffs', color: 'var(--color-success)' },
          { label: 'Relegation zone', color: 'var(--color-danger)' },
        ].map(({ label, color }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
