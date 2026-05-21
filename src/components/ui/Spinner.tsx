import clsx from 'clsx'

export function Spinner({
  label,
  size = 'md',
}: {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const dimensions = size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'

  return (
    <div className="flex items-center gap-3 text-[var(--color-off-white)]">
      <span
        className={clsx(
          dimensions,
          'inline-block animate-spin rounded-full border-2 border-white/30 border-t-white',
        )}
      />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  )
}
