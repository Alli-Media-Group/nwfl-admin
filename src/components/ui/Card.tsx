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
      className={clsx(
        'rounded-lg border bg-[var(--color-card)] shadow-sm transition hover:shadow-md',
        className,
      )}
      style={{ borderColor: 'var(--color-border)', ...style }}
    >
      {children}
    </section>
  )
}
