import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle, AudioLines, CalendarDays, CloudCog, FileText, Home, ImageIcon, KeyRound, ListOrdered, Mail, Shirt, Users,
} from 'lucide-react'

/**
 * Every page of the admin, grouped by what people do there. The sidebar, the top bar and the page headers all read
 * from this one list, so a page's name is the same everywhere.
 */
export interface NavItem {
  to: string
  label: string
  /** One line under the page title saying what the page is for. */
  description: string
  icon: LucideIcon
  superuserOnly?: boolean
}

export interface NavGroup {
  label: string | null
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    label: null,
    items: [
      { to: '/', label: 'Home', description: 'What needs attention, and the latest results.', icon: Home },
    ],
  },
  {
    label: 'Match day',
    items: [
      { to: '/matches', label: 'Matches', description: 'Fixtures and results. Enter a score or fix one.', icon: CalendarDays },
      { to: '/standings', label: 'Standings', description: 'The league table for each group.', icon: ListOrdered },
      { to: '/whatsapp-parser', label: 'WhatsApp intake', description: 'Paste a results message and turn it into matches.', icon: AudioLines },
    ],
  },
  {
    label: 'League',
    items: [
      { to: '/teams', label: 'Teams', description: 'Club profiles, logos and groups.', icon: Users },
      { to: '/players', label: 'Players', description: 'Squads and player details.', icon: Shirt },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/blog', label: 'News & gallery', description: 'Articles, blog posts and photo galleries for the public site.', icon: FileText },
      { to: '/media-library', label: 'Media library', description: 'Every image uploaded for the league.', icon: ImageIcon },
    ],
  },
  {
    label: 'Access',
    items: [
      { to: '/invitations', label: 'Invitations', description: 'Invite staff to the admin.', icon: Mail, superuserOnly: true },
      { to: '/api-access', label: 'API access', description: 'Keys that let a website read the league data.', icon: KeyRound, superuserOnly: true },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/missing-logos', label: 'Missing logos', description: 'Teams without a logo yet.', icon: AlertTriangle },
      { to: '/sync', label: 'Sheet import', description: 'Bring results in from the old Google Sheet.', icon: CloudCog },
    ],
  },
]

export function navFor(isSuperuser: boolean): NavGroup[] {
  return NAV.map(g => ({ ...g, items: g.items.filter(i => isSuperuser || !i.superuserOnly) })).filter(g => g.items.length)
}

export function findNav(pathname: string): { group: string | null; item: NavItem } | null {
  for (const g of NAV) {
    const item = g.items.find(i => i.to === pathname)
    if (item) return { group: g.label, item }
  }
  return null
}
