import { motion } from 'motion/react'
import type { ReactNode } from 'react'

export function PageWrapper({
  children,
  eyebrow,
  title,
}: {
  children: ReactNode
  eyebrow: string
  title: string
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="page-enter px-6 pb-10 pt-24 md:px-8 lg:px-10"
      initial={{ opacity: 0, y: 12 }}
    >
      <div className="mb-8">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--color-primary)' }}>
          {eyebrow}
        </p>
        <h1 className="text-2xl md:text-3xl" style={{ color: 'var(--color-text)' }}>{title}</h1>
      </div>
      {children}
    </motion.div>
  )
}
