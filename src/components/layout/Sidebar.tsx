import clsx from 'clsx'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { navFor } from '../../lib/nav'

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth()
  const groups = navFor(Boolean(user?.is_superuser))

  return (
    <nav aria-label="Main" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-6">
      {groups.map(group => (
        <div key={group.label ?? 'top'}>
          {group.label ? <p className="eyebrow mb-1.5 px-3">{group.label}</p> : null}
          <ul className="flex flex-col gap-0.5">
            {group.items.map(({ icon: Icon, label, to }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    clsx(
                      'group relative flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[0.875rem] font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                        : 'text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive ? (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[var(--color-primary)]"
                          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                        />
                      ) : null}
                      <Icon size={16} strokeWidth={isActive ? 2.25 : 1.9} />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-5 pb-6 pt-5">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] border bg-white" style={{ borderColor: 'var(--color-border)' }}>
        <img alt="" className="h-[22px] w-[22px] object-contain" src="/logo.svg" />
      </div>
      <div className="leading-tight">
        <p className="text-[0.95rem] font-bold" style={{ fontFamily: 'var(--font-heading)', fontStretch: 'semi-expanded' }}>NWFL</p>
        <p className="text-[0.72rem] text-[var(--color-muted)]">League admin</p>
      </div>
    </div>
  )
}

/** Fixed sidebar on wide screens; a drawer on phones and tablets (opened from the top bar). */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r lg:flex"
        style={{ background: 'var(--color-sidebar)', borderColor: 'var(--color-border)' }}
      >
        <Brand />
        <NavContent />
      </aside>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              key="scrim"
              aria-label="Close menu"
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              type="button"
            />
            <motion.aside
              key="drawer"
              className="fixed inset-y-0 left-0 z-50 flex w-[272px] max-w-[85vw] flex-col border-r lg:hidden"
              style={{ background: 'var(--color-sidebar)', borderColor: 'var(--color-border)' }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 42 }}
            >
              <div className="flex items-start justify-between">
                <Brand />
                <button
                  aria-label="Close menu"
                  className="m-4 rounded-[var(--radius-sm)] p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
                  onClick={onClose}
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>
              <NavContent onNavigate={onClose} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
