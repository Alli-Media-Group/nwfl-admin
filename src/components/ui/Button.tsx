import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
}

export function Button({
  children,
  className,
  icon,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        variant === 'primary' && 'btn-primary',
        variant === 'outline' && 'btn-outline',
        variant === 'ghost' && 'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition hover:bg-[var(--color-surface)]',
        variant === 'danger' && 'inline-flex items-center gap-2 rounded-md border border-[var(--color-danger)]/30 px-3 py-2 text-sm font-medium text-[var(--color-danger)] transition hover:bg-[var(--color-danger)]/10',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      style={variant === 'ghost' || variant === 'danger' ? { color: variant === 'danger' ? 'var(--color-danger)' : 'var(--color-text-2)' } : undefined}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  )
}
