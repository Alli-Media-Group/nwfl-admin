import clsx from 'clsx'
import { useState } from 'react'
import { LOGO_SOURCES } from '../../lib/api'
import type { Team } from '../../types'

/** A team's badge, trying the stored logo first and then the older logo folders; the initials if none load. */
export function TeamCrest({ team, size = 24, className }: { team: Pick<Team, 'name' | 'slug' | 'logo'>; size?: number; className?: string }) {
  const sources = [team.logo, ...LOGO_SOURCES(team.slug)].filter((s): s is string => Boolean(s))
  const [index, setIndex] = useState(0)
  const initials = team.name
    .replace(/ FC$/, '')
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <span
      className={clsx('grid shrink-0 place-items-center overflow-hidden rounded-full border', className)}
      // Club badges are drawn for a white background, so they sit on white in both themes.
      style={{ width: size, height: size, borderColor: 'var(--color-border)', background: index < sources.length ? '#fff' : 'var(--color-surface-2)' }}
    >
      {index < sources.length ? (
        <img
          alt=""
          className="h-[80%] w-[80%] object-contain"
          loading="lazy"
          onError={() => setIndex(i => i + 1)}
          src={sources[index]}
        />
      ) : (
        <span className="font-semibold text-[var(--color-text-2)]" style={{ fontSize: Math.max(9, size * 0.36) }}>{initials}</span>
      )}
    </span>
  )
}
