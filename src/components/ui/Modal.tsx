import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({
  children,
  onClose,
  open,
  title,
}: {
  children: ReactNode
  onClose: () => void
  open: boolean
  title: string
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          style={{ background: 'rgba(11, 28, 48, 0.4)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative mt-8 w-full max-w-3xl rounded-xl p-6 md:p-8"
            exit={{ opacity: 0, scale: 0.98, y: 16 }}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border-2)',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{title}</h2>
              <button
                className="rounded-lg p-2 transition hover:bg-[var(--color-surface)]"
                style={{ color: 'var(--color-muted)' }}
                onClick={onClose}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
