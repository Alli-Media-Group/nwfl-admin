import clsx from 'clsx'
import { AudioLines, ClipboardList, LayoutDashboard, Menu, Shield, Users, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const items = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: ClipboardList, label: 'Matches', to: '/matches' },
  { icon: Users, label: 'Teams', to: '/teams' },
  { icon: Shield, label: 'Standings', to: '/standings' },
  { icon: AudioLines, label: 'WhatsApp Parser', to: '/whatsapp-parser' },
]

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-lg p-2.5 lg:hidden"
        style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        onClick={() => setOpen(true)}
        type="button"
      >
        <Menu size={18} />
      </button>

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col px-3 py-5 transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          'md:w-[72px] lg:w-60',
        )}
        style={{
          background: 'var(--color-sidebar)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        {/* Logo */}
        <div className="mb-6 flex items-center justify-between px-1 md:justify-center lg:justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
            >
              <img alt="NWFL" className="h-5 w-5 object-contain" src="/logo.svg" />
            </div>
            <div className="md:hidden lg:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--color-highlight)' }}>
                Internal
              </p>
              <p className="text-sm font-bold" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>
                Admin Portal
              </p>
            </div>
          </div>
          <button
            className="rounded-lg p-1.5 lg:hidden"
            style={{ color: 'var(--color-muted)' }}
            onClick={() => setOpen(false)}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5">
          {items.map(({ icon: Icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  'md:justify-center lg:justify-start',
                  isActive
                    ? 'text-[var(--color-highlight)]'
                    : 'hover:text-[var(--color-text)]',
                )
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--color-surface)' : 'transparent',
                color: isActive ? 'var(--color-highlight)' : 'var(--color-muted)',
              })}
            >
              <Icon size={17} />
              <span className="md:hidden lg:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom label */}
        <div className="mt-4 px-3 md:hidden lg:block">
          <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
            NWFL · Internal tool
          </p>
        </div>
      </aside>

      {open && (
        <button
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          type="button"
        />
      )}
    </>
  )
}
