import { useState, useRef, useEffect } from 'react'
import { LogOut, ChevronDown, Shield, Sun, Moon } from 'lucide-react'
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

  const displayName = user?.full_name || user?.username || 'Staff User'
  const initials = displayName.slice(0, 2).toUpperCase()

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
      className="fixed inset-x-0 top-0 z-20 lg:left-60"
      style={{
        background: 'var(--color-sidebar)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-nav)',
      }}
    >
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6 lg:px-8">

        {/* Page title */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--color-highlight)' }}>
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
            className="grid h-9 w-9 place-items-center rounded-lg transition"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-2)',
            }}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-subtle)',
              }}
            >
              <div
                className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white"
                style={{ background: 'var(--gradient-glow)' }}
              >
                {initials}
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--color-text)' }}>
                  {displayName}
                </p>
                <p className="text-[11px] leading-tight" style={{ color: 'var(--color-muted)' }}>
                  {user?.is_superuser ? 'Superadmin' : 'Staff'}
                </p>
              </div>

              <ChevronDown
                size={13}
                style={{ color: 'var(--color-muted)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
              />
            </button>

            {/* Dropdown panel */}
            {open && (
              <div
                className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden"
                style={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                {/* User info */}
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                      style={{ background: 'var(--gradient-glow)' }}
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
                    <Shield size={13} style={{ color: 'var(--color-highlight)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {user?.is_superuser ? 'Superadmin access' : 'Staff access'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setOpen(false); void logout() }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-red-50"
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
