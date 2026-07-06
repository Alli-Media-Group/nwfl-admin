import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

interface AlertProps {
  children: ReactNode
  className?: string
  icon?: LucideIcon
  title?: string
  variant?: AlertVariant
}

const STYLES: Record<AlertVariant, { border: string; iconBg: string; iconColor: string }> = {
  info: {
    border: 'var(--color-highlight)',
    iconBg: 'rgba(70, 72, 212, 0.10)',
    iconColor: 'var(--color-highlight)',
  },
  success: {
    border: 'var(--color-success)',
    iconBg: 'rgba(22, 163, 74, 0.10)',
    iconColor: 'var(--color-success)',
  },
  warning: {
    border: 'var(--color-warning)',
    iconBg: 'rgba(217, 119, 6, 0.10)',
    iconColor: 'var(--color-warning)',
  },
  danger: {
    border: 'var(--color-danger)',
    iconBg: 'rgba(186, 26, 26, 0.10)',
    iconColor: 'var(--color-danger)',
  },
}

export function Alert({ children, className, icon: Icon, title, variant = 'info' }: AlertProps) {
  const style = STYLES[variant]

  return (
    <div
      className={clsx('flex items-start gap-3 rounded-lg p-4', className)}
      style={{
        background: 'var(--color-card)',
        border: `1px solid ${style.border}`,
        boxShadow: 'var(--shadow-card)',
      }}
      role="alert"
    >
      {Icon ? (
        <div
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md"
          style={{ background: style.iconBg }}
        >
          <Icon size={18} style={{ color: style.iconColor }} />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        {title ? (
          <p
            className="mb-1 text-sm font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            {title}
          </p>
        ) : null}
        <div className="text-sm leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
