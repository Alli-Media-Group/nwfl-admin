import clsx from 'clsx'
import type { CSSProperties } from 'react'

/** A grey shape that stands in for content while it loads. */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden className={clsx('skeleton', className)} style={style} />
}

/** Rows of a list or table while it loads. */
export function SkeletonRows({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div aria-busy="true" aria-label="Loading" className={clsx('overflow-hidden rounded-[var(--radius-lg)] border', className)} style={{ borderColor: 'var(--color-border)', background: 'var(--color-card)' }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-t px-4 py-3.5 first:border-t-0" style={{ borderColor: 'var(--color-border)' }}>
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-3.5" style={{ width: `${38 + ((i * 17) % 30)}%` }} />
          <Skeleton className="ml-auto h-6 w-16" />
        </div>
      ))}
    </div>
  )
}

/** A grid of cards while it loads (teams, images, posts). */
export function SkeletonCards({ count = 8, media = false, className }: { count?: number; media?: boolean; className?: string }) {
  return (
    <div aria-busy="true" aria-label="Loading" className={clsx('grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]', className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-[var(--radius-lg)] border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-card)' }}>
          {media ? <Skeleton className="mb-4 aspect-video w-full" /> : <Skeleton className="mb-4 h-10 w-10 rounded-full" />}
          <Skeleton className="mb-2 h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

/** The summary tiles on Home while they load. */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-[var(--radius-lg)] border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-card)' }}>
          <Skeleton className="mb-4 h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}
