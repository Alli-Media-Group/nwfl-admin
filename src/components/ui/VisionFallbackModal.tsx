import { useState } from 'react'
import { X, Copy, Check, ExternalLink, Bot } from 'lucide-react'

export type VisionContext = 'team' | 'standings' | 'matches'

interface Props {
  context: VisionContext
  onClose: () => void
}

const PROMPTS: Record<VisionContext, { title: string; prompt: string }> = {
  team: {
    title: 'Extract team data from this image',
    prompt: `You are a data entry assistant for the NWFL (Nigeria Women Football League).
Look at the attached image and extract all NWFL team profile information you can find.

Return ONLY a valid JSON array (no explanation, no markdown fences). Each object must have exactly these fields:
{
  "name": "Full official team name",
  "short_name": "Short display name (no FC/Ladies suffix)",
  "slug": "lowercase-hyphenated (strip FC, Ladies)",
  "city": "City name or null",
  "state": "State name or null",
  "group": "A" or "B" or null,
  "founded": integer year or null,
  "manager": "Full name or null",
  "titles": integer (NWFL titles count, default 0),
  "bio": "1-3 sentence summary or empty string",
  "confidence": "HIGH" or "MEDIUM" or "LOW"
}

Known groups:
Group A: Rivers Angels FC, Edo Queens FC, Bayelsa Queens FC, Nasarawa Amazons FC, Naija Ratels FC, Sunshine Queens FC, Abia Angels FC, Heartland Queens FC
Group B: FC Robo Queens, Delta Queens FC, Adamawa Queens FC, Confluence Queens FC, Ibom Angels FC, Dannaz Ladies FC, Ekiti Queens FC, Remo Stars Ladies FC

Return a JSON array even if only one team is found. No other text.`,
  },
  matches: {
    title: 'Extract match results from this image',
    prompt: `You are a data entry assistant for the NWFL (Nigeria Women Football League).
Look at the attached image and extract all match results or fixtures you can find.

Return ONLY a valid JSON array (no explanation, no markdown fences). Each object must have exactly these fields:
{
  "home_team": "Official full team name from NWFL or null",
  "away_team": "Official full team name from NWFL or null",
  "home_score": integer or null,
  "away_score": integer or null,
  "matchday": integer or null,
  "date": "YYYY-MM-DD or null",
  "kick_off": "HH:MM (24h) or null",
  "venue": "venue name or null",
  "status": "FT" or "UPCOMING" or "LIVE" or "PENDING",
  "pending_reason": "one sentence if PENDING, else empty string",
  "confidence": "HIGH" or "MEDIUM" or "LOW"
}

Known NWFL teams:
Group A: Rivers Angels FC, Edo Queens FC, Bayelsa Queens FC, Nasarawa Amazons FC, Naija Ratels FC, Sunshine Queens FC, Abia Angels FC, Heartland Queens FC
Group B: FC Robo Queens, Delta Queens FC, Adamawa Queens FC, Confluence Queens FC, Ibom Angels FC, Dannaz Ladies FC, Ekiti Queens FC, Remo Stars Ladies FC

Status rules: score present + looks final = FT; future date / no score = UPCOMING; disputed = PENDING.
Return a JSON array with one entry per match. No other text.`,
  },
  standings: {
    title: 'Extract standings table from this image',
    prompt: `You are a data entry assistant for the NWFL (Nigeria Women Football League).
Look at the attached image and extract the full standings table.

Return ONLY a valid JSON array (no explanation, no markdown fences). Each object must have exactly these fields:
{
  "team_name": "Official full team name from NWFL",
  "played": integer,
  "won": integer,
  "drawn": integer,
  "lost": integer,
  "gf": integer,
  "ga": integer,
  "points": integer,
  "confidence": "HIGH" or "MEDIUM" or "LOW"
}

Known NWFL teams:
Group A: Rivers Angels FC, Edo Queens FC, Bayelsa Queens FC, Nasarawa Amazons FC, Naija Ratels FC, Sunshine Queens FC, Abia Angels FC, Heartland Queens FC
Group B: FC Robo Queens, Delta Queens FC, Adamawa Queens FC, Confluence Queens FC, Ibom Angels FC, Dannaz Ladies FC, Ekiti Queens FC, Remo Stars Ladies FC

Column abbreviations: P/Pld=played, W=won, D=drawn, L=lost, GF=goals for, GA=goals against, Pts=points.
Verify: won + drawn + lost = played, and (3×won) + drawn = points.

Return a JSON array with one entry per table row. No other text.`,
  },
}

const AI_LINKS = [
  { name: 'ChatGPT', url: 'https://chat.openai.com/', color: '#10a37f' },
  { name: 'Google Gemini', url: 'https://gemini.google.com/', color: '#4285f4' },
  { name: 'Grok', url: 'https://grok.com/', color: '#ffffff' },
]

export function VisionFallbackModal({ context, onClose }: Props) {
  const { title: _title, prompt } = PROMPTS[context]
  const [copied, setCopied] = useState(false)

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'var(--color-card)', borderRadius: 16,
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.12)', flexShrink: 0 }}>
              <Bot size={15} style={{ color: 'var(--color-warning)' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text)' }}>AI Vision Unavailable</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-muted)' }}>All free vision models are rate-limited right now</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
            The free vision models on our AI provider are temporarily rate-limited.
            You can still extract this data using <strong>ChatGPT, Gemini, or Grok</strong> — just copy the prompt below, open one of these tools, attach your image, and paste the response back into the text input.
          </p>

          {/* Prompt box */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>
                Prompt — copy and use with your image
              </label>
              <button
                type="button"
                onClick={copyPrompt}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: copied ? 'rgba(34,197,94,0.12)' : 'var(--color-surface-2)', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`, borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, color: copied ? 'var(--color-success)' : 'var(--color-text)', transition: 'all 0.15s' }}
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? 'Copied!' : 'Copy prompt'}
              </button>
            </div>
            <div style={{
              background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '10px 12px',
              maxHeight: 180, overflowY: 'auto',
              fontFamily: 'monospace', fontSize: '0.75rem',
              color: 'var(--color-muted)', lineHeight: 1.6,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {prompt}
            </div>
          </div>

          {/* Steps */}
          <div style={{ marginBottom: 18 }}>
            <p style={{ margin: '0 0 8px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>Steps</p>
            {[
              'Copy the prompt above',
              'Open ChatGPT, Gemini, or Grok below',
              'Paste the prompt and attach your image',
              'Copy the JSON response it gives you',
              'Close this modal and paste it into the text input',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 5 }}>
                <span style={{ display: 'grid', placeItems: 'center', minWidth: 20, height: 20, borderRadius: '50%', background: 'var(--color-surface-2)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-highlight)' }}>{i + 1}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text)', lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>

          {/* Open AI links */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {AI_LINKS.map(({ name, url, color }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.78rem', fontWeight: 600,
                  color: 'var(--color-text)',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              >
                <ExternalLink size={12} style={{ color }} />
                {name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
