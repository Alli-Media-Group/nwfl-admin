import clsx from 'clsx'
import type { CSSProperties, ReactNode } from 'react'

export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <section
      className={clsx('rounded-[var(--radius-lg)] border bg-[var(--color-card)]', className)}
      style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card)', ...style }}
    >
      {children}
    </section>
  )
}

/** A card's heading row: title on the left, optional actions on the right. */
export function CardHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--color-border)' }}>
      <div className="min-w-0">
        <h2 className="text-[1rem]">{title}</h2>
        {description ? <p className="mt-0.5 text-[0.82rem] text-[var(--color-muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
