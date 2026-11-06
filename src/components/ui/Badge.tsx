import type { Match, ParsedMatchResult } from '../../types'

type Status = Match['status'] | ParsedMatchResult['confidence'] | 'A' | 'B'

const LABELS: Partial<Record<Status, string>> = {
  FT: 'Full time',
  LIVE: 'Live',
  PENDING: 'Needs review',
  UPCOMING: 'Upcoming',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  A: 'Group A',
  B: 'Group B',
}

const TONES: Record<Status, { bg: string; text: string }> = {
  A:        { bg: 'var(--color-surface-2)',   text: 'var(--color-text-2)' },
  B:        { bg: 'var(--color-surface-2)',   text: 'var(--color-text-2)' },
  FT:       { bg: 'var(--color-success-soft)', text: 'var(--color-success)' },
  HIGH:     { bg: 'var(--color-success-soft)', text: 'var(--color-success)' },
  LIVE:     { bg: 'var(--color-danger-soft)',  text: 'var(--color-danger)' },
  LOW:      { bg: 'var(--color-danger-soft)',  text: 'var(--color-danger)' },
  MEDIUM:   { bg: 'var(--color-warning-soft)', text: 'var(--color-warning)' },
  PENDING:  { bg: 'var(--color-warning-soft)', text: 'var(--color-warning)' },
  UPCOMING: { bg: 'var(--color-surface-2)',   text: 'var(--color-text-2)' },
}

export function Badge({ value, pulse = false }: { pulse?: boolean; value: Status }) {
  const tone = TONES[value] ?? TONES.UPCOMING
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium"
      style={{ background: tone.bg, color: tone.text }}
    >
      <span className={pulse ? 'h-1.5 w-1.5 animate-pulse rounded-full bg-current' : 'h-1.5 w-1.5 rounded-full bg-current opacity-70'} />
      {LABELS[value] ?? value}
    </span>
  )
}
