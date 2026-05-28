import clsx from 'clsx'
import type { Match, ParsedMatchResult } from '../../types'

type Status = Match['status'] | ParsedMatchResult['confidence'] | 'A' | 'B'

export function Badge({ value, pulse = false }: { pulse?: boolean; value: Status }) {
  // Using inline styles + minimal classes so both light and dark modes work cleanly.
  // Maps each status to a semantic token that exists in both themes.
  const map: Record<Status, { bg: string; text: string; border?: string }> = {
    A:       { bg: 'var(--color-surface)',      text: 'var(--color-text)',      border: 'var(--color-border-2)' },
    B:       { bg: 'var(--color-surface-2)',    text: 'var(--color-text-2)' },
    FT:      { bg: 'rgba(22,163,74,0.12)',      text: 'var(--color-success)' },
    HIGH:    { bg: 'rgba(22,163,74,0.12)',      text: 'var(--color-success)' },
    LIVE:    { bg: 'rgba(186,26,26,0.12)',      text: 'var(--color-danger)' },
    LOW:     { bg: 'rgba(186,26,26,0.12)',      text: 'var(--color-danger)' },
    MEDIUM:  { bg: 'rgba(217,119,6,0.12)',      text: 'var(--color-warning)' },
    PENDING: { bg: 'rgba(217,119,6,0.12)',      text: 'var(--color-warning)' },
    UPCOMING:{ bg: 'var(--color-surface-2)',    text: 'var(--color-text-2)' },
  }

  const s = map[value]

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-md px-3 py-1 text-[0.68rem] font-bold tracking-[0.14em] uppercase',
      )}
      style={{
        background: s.bg,
        color: s.text,
        border: s.border ? `1px solid ${s.border}` : 'none',
      }}
    >
      {pulse ? <span className="h-2 w-2 animate-pulse rounded-full bg-current" /> : null}
      {value}
    </span>
  )
}
