import { ChevronDown, ChevronRight, LogOut, Menu, Moon, Sun } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { findNav } from '../../lib/nav'

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { pathname } = useLocation()
  const { logout, user } = useAuth()
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const here = findNav(pathname)

  const displayName = user?.full_name || user?.username || 'User'
  const initials = displayName
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const roleLabel = user?.is_superuser ? 'League owner' : user?.is_staff ? 'Staff' : 'User'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  return (
    <header
      className="sticky top-0 z-20 border-b backdrop-blur-md"
      style={{ background: 'color-mix(in srgb, var(--color-bg) 82%, transparent)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <button
            aria-label="Open menu"
            className="-ml-1 rounded-[var(--radius-sm)] p-2 text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] lg:hidden"
            onClick={onOpenMenu}
            type="button"
          >
            <Menu size={18} />
          </button>
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[0.85rem]">
            {here?.group ? (
              <>
                <span className="hidden text-[var(--color-muted)] sm:inline">{here.group}</span>
                <ChevronRight className="hidden text-[var(--color-border-2)] sm:inline" size={14} />
              </>
            ) : null}
            <span className="truncate font-medium text-[var(--color-text)]">{here?.item.label ?? 'NWFL admin'}</span>
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <button
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
            onClick={toggle}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            type="button"
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                key={theme}
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 45 }}
                transition={{ duration: 0.15 }}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </motion.span>
            </AnimatePresence>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              aria-expanded={open}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-[var(--radius-sm)] py-1 pl-1 pr-2 transition hover:bg-[var(--color-surface-2)]"
              onClick={() => setOpen(v => !v)}
              type="button"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-primary-soft)] text-[0.7rem] font-bold text-[var(--color-primary)]">
                {initials}
              </span>
              <span className="hidden text-[0.85rem] font-medium text-[var(--color-text)] sm:inline">{displayName}</span>
              <ChevronDown
                className="text-[var(--color-muted)] transition-transform duration-200"
                size={14}
                style={{ transform: open ? 'rotate(180deg)' : 'none' }}
              />
            </button>

            <AnimatePresence>
              {open ? (
                <motion.div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-60 origin-top-right overflow-hidden rounded-[var(--radius-md)] border"
                  style={{ background: 'var(--color-card)', borderColor: 'var(--color-border-2)', boxShadow: 'var(--shadow-elevated)' }}
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.14 }}
                >
                  <div className="border-b px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="truncate text-[0.875rem] font-semibold">{displayName}</p>
                    <p className="truncate text-[0.78rem] text-[var(--color-muted)]">{user?.email || roleLabel}</p>
                    <p className="mt-1.5 inline-flex rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[0.7rem] font-medium text-[var(--color-text-2)]">
                      {roleLabel}
                    </p>
                  </div>
                  <div className="p-1">
                    <button
                      className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-[0.85rem] text-[var(--color-danger)] transition hover:bg-[var(--color-danger-soft)]"
                      onClick={() => { setOpen(false); void logout() }}
                      role="menuitem"
                      type="button"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
