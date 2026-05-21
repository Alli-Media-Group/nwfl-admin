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
      className="page-enter px-4 pb-10 pt-24 md:px-6 lg:px-8"
      initial={{ opacity: 0, y: 12 }}
    >
      <div className="mb-8">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--color-highlight)' }}>
          {eyebrow}
        </p>
        <h1 className="text-3xl md:text-4xl" style={{ color: 'var(--color-text)' }}>{title}</h1>
      </div>
      {children}
    </motion.div>
  )
}
