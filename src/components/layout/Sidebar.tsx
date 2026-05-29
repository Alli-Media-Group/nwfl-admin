import clsx from 'clsx'
import { AudioLines, ClipboardList, CloudCog, ImageIcon, LayoutDashboard, Mail, Menu, Shield, AlertTriangle, Users, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const baseItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: ClipboardList, label: 'Matches', to: '/matches' },
  { icon: Users, label: 'Teams', to: '/teams' },
  { icon: Shield, label: 'Standings', to: '/standings' },
  { icon: AudioLines, label: 'WhatsApp Parser', to: '/whatsapp-parser' },
  { icon: CloudCog, label: 'Sheet Sync', to: '/sync' },
  { icon: ImageIcon, label: 'Media Library', to: '/media-library' },
  { icon: AlertTriangle, label: 'Missing Logos', to: '/missing-logos' },
]

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  const items = user?.is_superuser
    ? [...baseItems, { icon: Mail, label: 'Invitations', to: '/invitations' }]
    : baseItems

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
          'fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col py-8 transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          background: 'var(--color-sidebar)',
          borderRight: '1px solid var(--color-border-2)',
        }}
      >
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3 px-6">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
            style={{ background: 'var(--color-primary)' }}
          >
            <img alt="NWFL" className="h-6 w-6 object-contain invert" src="/logo.svg" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
              NWFL Admin
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
              Governance Portal
            </p>
          </div>
          <button
            className="ml-auto rounded-lg p-1.5 lg:hidden"
            style={{ color: 'var(--color-muted)' }}
            onClick={() => setOpen(false)}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {items.map(({ icon: Icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'font-bold'
                    : 'hover:bg-[var(--color-surface)]',
                )
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--color-surface)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-2)',
                borderLeft: isActive ? '4px solid var(--color-primary)' : '4px solid transparent',
              })}
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom label */}
        <div className="mt-auto px-6 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 px-3 py-2" style={{ color: 'var(--color-muted)' }}>
            <Shield size={14} />
            <span className="text-xs font-semibold uppercase tracking-wider">Internal Tool</span>
          </div>
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
