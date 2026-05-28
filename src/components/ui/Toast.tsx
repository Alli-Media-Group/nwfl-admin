import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null)

// ── Config ────────────────────────────────────────────────────────────────────
const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
}

const STYLES: Record<ToastVariant, { icon: string; bar: string }> = {
  success: { icon: 'var(--color-success)', bar: 'var(--color-success)' },
  error:   { icon: 'var(--color-danger)',  bar: 'var(--color-danger)'  },
  warning: { icon: 'var(--color-warning)', bar: 'var(--color-warning)' },
  info:    { icon: 'var(--color-highlight)', bar: 'var(--color-highlight)' },
}

// ── Single toast item ─────────────────────────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const duration = toast.duration ?? 4000
  const Icon = ICONS[toast.variant]
  const style = STYLES[toast.variant]

  // Entrance
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(() => dismiss(), duration)
    return () => clearTimeout(t)
  }, [duration])

  function dismiss() {
    setLeaving(true)
    setTimeout(() => onDismiss(toast.id), 300)
  }

  return (
    <div
      onClick={dismiss}
      style={{
        transform: visible && !leaving ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.95)',
        opacity: visible && !leaving ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-elevated)',
        overflow: 'hidden',
        cursor: 'pointer',
        minWidth: '300px',
        maxWidth: '380px',
        position: 'relative',
      }}
    >
      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2px',
          background: style.bar,
          width: '100%',
          transformOrigin: 'left',
          animation: `toast-progress ${duration}ms linear forwards`,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 14px 16px' }}>
        {/* Icon */}
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: `color-mix(in srgb, ${style.icon} 12%, transparent)`,
            flexShrink: 0,
            marginTop: '1px',
          }}
        >
          <Icon size={15} style={{ color: style.icon }} />
        </div>

        {/* Message */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'var(--color-text)',
              lineHeight: 1.45,
              fontFamily: 'var(--font-body)',
            }}
          >
            {toast.message}
          </p>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); dismiss() }}
          style={{
            display: 'grid',
            placeItems: 'center',
            background: 'none',
            border: 'none',
            padding: '2px',
            cursor: 'pointer',
            color: 'var(--color-muted)',
            borderRadius: '2px',
            flexShrink: 0,
          }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, variant: ToastVariant = 'info', duration?: number) => {
    const id = `toast-${++counter.current}`
    setToasts(prev => [...prev, { id, message, variant, duration }])
  }, [])

  const value: ToastContextValue = {
    toast,
    success: (msg) => toast(msg, 'success'),
    error:   (msg) => toast(msg, 'error'),
    warning: (msg) => toast(msg, 'warning'),
    info:    (msg) => toast(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Portal-style fixed stack */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'flex-end',
        }}
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>

      <style>{`
        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
