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
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="shell-panel relative mt-8 w-full max-w-5xl rounded-[28px] p-6 md:p-8"
            exit={{ opacity: 0, scale: 0.98, y: 16 }}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl text-[var(--color-off-white)]">{title}</h2>
              <button
                className="rounded-full border border-[var(--color-border)] p-2 text-[var(--color-off-white)] transition hover:bg-white/10"
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
