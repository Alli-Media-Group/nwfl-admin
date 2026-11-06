import clsx from 'clsx'

export function Spinner({
  label,
  size = 'md',
}: {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const dimensions = size === 'lg' ? 'h-8 w-8' : size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'

  return (
    <span className={clsx('inline-flex items-center gap-2.5', label && 'text-[var(--color-muted)]')} role="status">
      <span
        aria-hidden
        className={clsx(dimensions, 'inline-block animate-spin rounded-full border-2 border-current border-t-transparent opacity-80')}
      />
      {label ? <span className="text-sm">{label}</span> : <span className="sr-only">Loading</span>}
    </span>
  )
}
