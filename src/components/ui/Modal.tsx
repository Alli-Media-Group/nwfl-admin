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
          style={{ background: 'rgba(10, 9, 14, 0.45)', backdropFilter: 'blur(3px)' }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative my-8 w-full max-w-3xl rounded-[var(--radius-lg)] p-5 md:p-7"
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border-2)',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-[1.15rem]">{title}</h2>
              <button
                className="rounded-lg p-2 transition hover:bg-[var(--color-surface)]"
                style={{ color: 'var(--color-muted)' }}
                onClick={onClose}
                aria-label="Close"
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
