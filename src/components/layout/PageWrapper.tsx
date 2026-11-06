import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { findNav } from '../../lib/nav'

/** Page frame: the title and one line on what the page is for, both taken from the navigation list. */
export function PageWrapper({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  const { pathname } = useLocation()
  const here = findNav(pathname)

  return (
    <motion.div
      key={pathname}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-6 md:px-8 md:pt-8"
      initial={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {here ? (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
          <div className="min-w-0">
            <h1 className="text-[1.6rem] leading-tight md:text-[1.85rem]">{here.item.label}</h1>
            <p className="mt-1 text-[0.9rem] text-[var(--color-muted)]">{here.item.description}</p>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </motion.div>
  )
}
