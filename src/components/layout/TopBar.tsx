import { useState, useRef, useEffect } from 'react'
import { LogOut, ChevronDown, Shield, Sun, Moon, Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'

const titles: Record<string, string> = {
  '/': 'Newsroom Overview',
  '/matches': 'Match Operations',
  '/standings': 'Table Control',
  '/teams': 'Club Profiles',
  '/whatsapp-parser': 'WhatsApp Intake',
}

export function TopBar() {
  const { pathname } = useLocation()
  const { logout, user } = useAuth()
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const displayName = user?.full_name || user?.username || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const roleLabel = user?.is_superuser ? 'Administrator' : user?.is_staff ? 'Staff' : 'User'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header
      className="fixed inset-x-0 top-0 z-20 lg:left-[260px]"
      style={{
        background: 'var(--color-sidebar)',
        borderBottom: '1px solid var(--color-border-2)',
      }}
    >
      <div className="flex h-16 items-center justify-between gap-4 px-6 md:px-8 lg:px-10">

        {/* Page title */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--color-primary)' }}>
            NWFL Editorial Desk
          </p>
          <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            {titles[pathname] ?? 'Admin Portal'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="grid h-9 w-9 place-items-center rounded-full transition"
            style={{ color: 'var(--color-muted)' }}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Notifications */}
          <button
            type="button"
            className="relative grid h-9 w-9 place-items-center rounded-full transition"
            style={{ color: 'var(--color-muted)' }}
          >
            <Bell size={18} />
            <span
              className="absolute top-2 right-2 h-2 w-2 rounded-full"
              style={{ background: 'var(--color-danger)' }}
            />
          </button>

          {/* Divider */}
          <div className="mx-2 h-8 w-px" style={{ background: 'var(--color-border-2)' }} />

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="hidden text-right sm:block">
                <p className="text-xs font-bold leading-none" style={{ color: 'var(--color-text)' }}>
                  {displayName}
                </p>
                <p className="text-[10px] leading-tight" style={{ color: 'var(--color-muted)' }}>
                  {roleLabel}
                </p>
              </div>
              <div
                className="grid h-9 w-9 place-items-center rounded-full border text-[11px] font-bold overflow-hidden"
                style={{
                  background: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border-2)',
                  color: 'var(--color-primary)',
                }}
              >
                {initials}
              </div>
              <ChevronDown
                size={13}
                style={{ color: 'var(--color-muted)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
              />
            </button>

            {/* Dropdown panel */}
            {open && (
              <div
                className="absolute right-0 top-full mt-2 w-52 rounded-lg overflow-hidden"
                style={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border-2)',
                  boxShadow: 'var(--shadow-elevated)',
                }}
              >
                {/* User info */}
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold"
                      style={{
                        background: 'var(--color-surface-2)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {displayName}
                      </p>
                      <p className="truncate text-[11px]" style={{ color: 'var(--color-muted)' }}>
                        {user?.email || 'No email set'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-1.5">
                  <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
                    <Shield size={13} style={{ color: 'var(--color-primary)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {roleLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setOpen(false); void logout() }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    <LogOut size={13} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
