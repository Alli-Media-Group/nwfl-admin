import clsx from 'clsx'
import type { Match, ParsedMatchResult } from '../../types'

type Status = Match['status'] | ParsedMatchResult['confidence'] | 'A' | 'B'

const styles: Record<Status, string> = {
  A: 'bg-white/10 text-white',
  B: 'bg-[var(--color-surface-2)] text-[var(--color-off-white)]',
  FT: 'bg-emerald-500/15 text-emerald-300',
  HIGH: 'bg-emerald-500/15 text-emerald-300',
  LIVE: 'bg-red-500/15 text-red-300',
  LOW: 'bg-red-500/15 text-red-300',
  MEDIUM: 'bg-amber-500/15 text-amber-300',
  PENDING: 'bg-amber-500/15 text-amber-300',
  UPCOMING: 'bg-[var(--color-surface-2)] text-[var(--color-off-white)]',
}

export function Badge({ value, pulse = false }: { pulse?: boolean; value: Status }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.68rem] font-bold tracking-[0.14em] uppercase',
        styles[value],
      )}
    >
      {pulse ? <span className="h-2 w-2 animate-pulse rounded-full bg-current" /> : null}
      {value}
    </span>
  )
}
