import clsx from 'clsx'
import type { ReactNode } from 'react'

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={clsx('card-surface rounded-[var(--radius-md)]', className)}>{children}</section>
}
