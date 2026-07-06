import type {
  AuthUser,
  BlogPost,
  Gallery,
  Invitation,
  Match,
  MatchFormValues,
  MediaImage,
  MissingLogoTeam,
  ParsedMatchResult,
  ParsedStandingRow,
  ParsedTeamResult,
  Player,
  Standing,
  Team,
  TeamExistenceResult,
  TeamResearchResult,
} from '../types'

const RAW_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const BASE = RAW_BASE.replace(/\/$/, '')

// ── Token storage ─────────────────────────────────────────────────────────────
export const tokens = {
  getAccess:   () => localStorage.getItem('access_token'),
  getRefresh:  () => localStorage.getItem('refresh_token'),
  set: (access: string, refresh: string) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  },
  clear: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },
}

// ── Silent token refresh ───────────────────────────────────────────────────────
let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  // Deduplicate — if multiple requests 401 at once, only one refresh fires
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refresh = tokens.getRefresh()
    if (!refresh) throw new Error('No refresh token.')

    const res = await fetch(`${BASE}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })

    if (!res.ok) {
      tokens.clear()
      throw new Error('Session expired.')
    }

    const data = await res.json() as { access: string }
    tokens.set(data.access, refresh)
    return data.access
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

// ── Core request helper ───────────────────────────────────────────────────────
async function request<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  const headers = new Headers(init?.headers)

  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const access = tokens.getAccess()
  if (access) headers.set('Authorization', `Bearer ${access}`)

  const response = await fetch(`${BASE}${path}`, { ...init, headers })

  // Silent refresh on 401 — retry once with new token
  if (response.status === 401 && retry) {
    try {
      const newAccess = await refreshAccessToken()
      const retryHeaders = new Headers(headers)
      retryHeaders.set('Authorization', `Bearer ${newAccess}`)
      return request<T>(path, { ...init, headers: retryHeaders }, false)
    } catch {
      // Refresh failed — clear tokens, let the auth guard redirect to login
      tokens.clear()
      window.dispatchEvent(new Event('auth:expired'))
      throw new Error('Session expired. Please sign in again.')
    }
  }

  if (response.status === 204) return undefined as T

  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ detail: 'Request failed. Please try again.' }))
    const err = new Error(payload.detail ?? payload.error ?? 'Request failed.') as Error & { status: number; data: Record<string, unknown> }
    err.status = response.status
    err.data = payload
    throw err
  }

  return response.json() as Promise<T>
}

// DRF returns paginated { count, results: [] } — unwrap to plain array
async function list<T>(path: string): Promise<T[]> {
  const data = await request<{ results: T[] } | T[]>(path)
  return Array.isArray(data) ? data : data.results
}

// ── Public API ────────────────────────────────────────────────────────────────
export const api = {
  login: async (payload: { username: string; password: string }): Promise<AuthUser> => {
    // Clear any stale tokens so the login request doesn't send an expired Authorization header
    tokens.clear()
    // Pass retry=false so a 401 from bad credentials doesn't trigger the refresh flow
    const data = await request<{ access: string; refresh: string }>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, false)
    tokens.set(data.access, data.refresh)
    return request<AuthUser>('/api/auth/me/')
  },

  getCurrentUser: (): Promise<AuthUser> =>
    request<AuthUser>('/api/auth/me/'),

  logout: async (): Promise<void> => {
    const refresh = tokens.getRefresh()
    try {
      await request('/api/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
      })
    } finally {
      tokens.clear()
    }
  },

  getTeams: () => list<Team>('/api/teams/'),

  getPlayers: (filters?: { team?: number | string; position?: string; group?: string; search?: string }) => {
    const params = new URLSearchParams()
    Object.entries(filters ?? {}).forEach(([key, value]) => {
      if (value !== '' && value !== undefined) params.set(key, String(value))
    })
    const query = params.toString()
    return list<Player>(`/api/players/${query ? `?${query}` : ''}`)
  },

  getPlayer: (slug: string): Promise<Player> =>
    request<Player>(`/api/players/${encodeURIComponent(slug)}/`),

  createPlayer: (payload: FormData | Record<string, unknown>) =>
    request<Player>('/api/players/', {
      method: 'POST',
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    }),

  updatePlayer: (slug: string, payload: FormData | Record<string, unknown>) =>
    request<Player>(`/api/players/${encodeURIComponent(slug)}/`, {
      method: 'PATCH',
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    }),

  deletePlayer: (slug: string): Promise<void> =>
    request(`/api/players/${encodeURIComponent(slug)}/`, { method: 'DELETE' }),

  getPlayerTopScorers: (season?: string, limit = 20): Promise<Player[]> => {
    const params = new URLSearchParams()
    if (season) params.set('season', season)
    if (limit) params.set('limit', String(limit))
    const query = params.toString()
    return request<Player[]>(`/api/players/top-scorers/${query ? `?${query}` : ''}`)
  },

  createTeam: (payload: FormData | Record<string, unknown>) =>
    request<Team>('/api/teams/', {
      method: 'POST',
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    }),

  updateTeam: (id: number, payload: FormData | Record<string, unknown>) =>
    request<Team>(`/api/teams/${id}/`, {
      method: 'PATCH',
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    }),

  getMatches: (filters?: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams()
    Object.entries(filters ?? {}).forEach(([key, value]) => {
      if (value !== '' && value !== undefined) params.set(key, String(value))
    })
    const query = params.toString()
    return list<Match>(`/api/matches/${query ? `?${query}` : ''}`)
  },

  getSeasons: () => request<string[]>('/api/matches/seasons/'),

  createMatch: (payload: Record<string, unknown>) =>
    request<Match>('/api/matches/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateMatch: (id: number, payload: Record<string, unknown>) =>
    request<Match>(`/api/matches/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getStandings: (season?: string) => {
    const query = season ? `?season=${encodeURIComponent(season)}` : ''
    return list<Standing>(`/api/standings/${query}`)
  },

  getStandingsSeasons: () => request<string[]>('/api/standings/seasons/'),

  updateStanding: (id: number, payload: Partial<Standing>) =>
    request<Standing>(`/api/standings/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  parseMatch: (text: string) =>
    request<ParsedMatchResult>('/api/internal/parse-match/', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  parseWhatsApp: (text: string) =>
    request<ParsedMatchResult[]>('/api/internal/parse-whatsapp/', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  parseTeam: (payload: { text?: string; image?: File }): Promise<ParsedTeamResult[]> => {
    if (payload.image) {
      const form = new FormData()
      if (payload.text) form.append('text', payload.text)
      form.append('image', payload.image)
      return request<ParsedTeamResult[]>('/api/internal/parse-team/', { method: 'POST', body: form })
    }
    return request<ParsedTeamResult[]>('/api/internal/parse-team/', {
      method: 'POST',
      body: JSON.stringify({ text: payload.text }),
    })
  },

  checkTeams: (names: string[]): Promise<Record<string, TeamExistenceResult>> =>
    request('/api/internal/check-teams/', {
      method: 'POST',
      body: JSON.stringify({ teams: names }),
    }),

  researchTeams: (names: string[]): Promise<TeamResearchResult[]> =>
    request('/api/internal/research-teams/', {
      method: 'POST',
      body: JSON.stringify({ teams: names }),
    }),

  parseMatchesBulk: (payload: { text?: string; image?: File }): Promise<ParsedMatchResult[]> => {
    if (payload.image) {
      const form = new FormData()
      if (payload.text) form.append('text', payload.text)
      form.append('image', payload.image)
      return request<ParsedMatchResult[]>('/api/internal/parse-matches-bulk/', { method: 'POST', body: form })
    }
    return request<ParsedMatchResult[]>('/api/internal/parse-matches-bulk/', {
      method: 'POST',
      body: JSON.stringify({ text: payload.text }),
    })
  },

  parseStandings: (payload: { text?: string; image?: File }): Promise<ParsedStandingRow[]> => {
    if (payload.image) {
      const form = new FormData()
      if (payload.text) form.append('text', payload.text)
      form.append('image', payload.image)
      return request<ParsedStandingRow[]>('/api/internal/parse-standings/', { method: 'POST', body: form })
    }
    return request<ParsedStandingRow[]>('/api/internal/parse-standings/', {
      method: 'POST',
      body: JSON.stringify({ text: payload.text }),
    })
  },

  syncFromSheet: (): Promise<{
    status: string
    message?: string
    records?: number
    matches_created?: number
    matches_updated?: number
    goals_created?: number
    errors?: string[]
  }> => request('/api/internal/sync-sheet/', { method: 'POST', body: JSON.stringify({}) }),

  syncFixturesFromSheet: (): Promise<{
    status: string
    message?: string
  }> => request('/api/internal/sync-sheet/', { method: 'POST', body: JSON.stringify({ fixtures: true }) }),

  syncStatus: (): Promise<{ log: string }> =>
    request('/api/internal/sync-status/', { method: 'GET' }),

  // ── Media Library ────────────────────────────────────────────────────────────
  getMediaImages: (params?: { tag?: string; tags?: string }): Promise<{ count: number; results: MediaImage[] }> => {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString() : ''
    return request(`/api/media/images/${qs}`)
  },

  uploadMediaImage: (file: File, tags: string[]): Promise<MediaImage> => {
    const form = new FormData()
    form.append('file', file)
    tags.forEach((t) => form.append('tag_list', t))
    return request('/api/media/images/', { method: 'POST', body: form })
  },

  suggestImageTags: (file: File): Promise<{ tags: string[] }> => {
    const form = new FormData()
    form.append('image', file)
    return request('/api/media/images/suggest-tags/', { method: 'POST', body: form })
  },

  deleteMediaImage: (id: number): Promise<void> =>
    request(`/api/media/images/${id}/`, { method: 'DELETE' }),

  updateMediaImage: (id: number, tags: string[]): Promise<MediaImage> => {
    const form = new FormData()
    tags.forEach((t) => form.append('tag_list', t))
    return request(`/api/media/images/${id}/`, { method: 'PATCH', body: form })
  },

  searchMediaByTags: (tags: string[]): Promise<{ count: number; tags: string[]; results: MediaImage[] }> =>
    request(`/api/media/images/search-by-tags/?tags=${tags.join(',')}`),

  getMediaTags: (): Promise<{ tags: string[] }> =>
    request('/api/media/images/tags/all/'),

  // ── Missing Logos ────────────────────────────────────────────────────────────
  getTeamsMissingLogos: (): Promise<{ missing_count: number; teams: MissingLogoTeam[] }> =>
    request('/api/internal/teams-missing-logos/'),

  updateTeamLogo: (id: number, logoFile: File): Promise<Team> => {
    const form = new FormData()
    form.append('logo', logoFile)
    return request<Team>(`/api/teams/${id}/`, { method: 'PATCH', body: form })
  },

  // ── Invitations ──────────────────────────────────────────────────────────────
  getInvitations: (): Promise<Invitation[]> =>
    request<Invitation[]>('/api/internal/invitations/'),

  createInvitation: (payload: { email: string; role: string }): Promise<Invitation> =>
    request<Invitation>('/api/internal/invitations/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  acceptInvitation: (payload: { token: string; username: string; password: string; full_name: string }): Promise<{ detail: string; user: AuthUser }> =>
    request('/api/internal/invitations/accept/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  revokeInvitation: (id: number): Promise<{ detail: string }> =>
    request<{ detail: string }>(`/api/internal/invitations/${id}/`, {
      method: 'DELETE',
    }),

  // ── Blog / News / Gallery ─────────────────────────────────────────────────────
  getBlogPosts: (category?: string): Promise<BlogPost[]> => {
    const query = category ? `?category=${encodeURIComponent(category)}` : ''
    return list<BlogPost>(`/api/blog/posts/${query}`)
  },

  getBlogPost: (slug: string): Promise<BlogPost> =>
    request<BlogPost>(`/api/blog/posts/${encodeURIComponent(slug)}/`),

  updateBlogPost: (slug: string, payload: Partial<BlogPost>): Promise<BlogPost> =>
    request<BlogPost>(`/api/blog/posts/${encodeURIComponent(slug)}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteBlogPost: (slug: string): Promise<void> =>
    request(`/api/blog/posts/${encodeURIComponent(slug)}/`, { method: 'DELETE' }),

  getGalleries: (): Promise<Gallery[]> =>
    list<Gallery>('/api/blog/galleries/'),

  getGallery: (slug: string): Promise<Gallery> =>
    request<Gallery>(`/api/blog/galleries/${encodeURIComponent(slug)}/`),

  updateGallery: (slug: string, payload: Partial<Gallery>): Promise<Gallery> =>
    request<Gallery>(`/api/blog/galleries/${encodeURIComponent(slug)}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteGallery: (slug: string): Promise<void> =>
    request(`/api/blog/galleries/${encodeURIComponent(slug)}/`, { method: 'DELETE' }),

  syncWordPress: (): Promise<{ status: string; output?: string; errors?: string }> =>
    request('/api/blog/sync-wordpress/', { method: 'POST', body: JSON.stringify({}) }),
}

// ── Logo URL helpers ──────────────────────────────────────────────────────────
// Fallback chain: 2024/25 → 2023/24 → Django media → initials avatar (in UI)
export const LOGO_SOURCES = (slug: string): string[] => [
  `/team-logos/thenwfl_2425_teams/${slug}.png`,
  `/team-logos/2023-24 Teams/${slug}.png`,
  `${BASE}/media/team_logos/${slug}.png`,
]

export function teamLogoUrl(slug: string): string {
  return LOGO_SOURCES(slug)[0]
}

export function toMatchPayload(values: MatchFormValues) {
  const { home_team, away_team, ...rest } = values
  return {
    ...rest,
    home_team_id:  home_team === '' ? null : home_team,
    away_team_id:  away_team === '' ? null : away_team,
    date:          rest.date || null,
    kick_off:      rest.kick_off || null,
    pending_reason: values.status === 'PENDING' ? values.pending_reason : '',
    home_score:    rest.home_score === '' ? null : rest.home_score,
    away_score:    rest.away_score === '' ? null : rest.away_score,
    home_ht_score: rest.home_ht_score === '' ? null : rest.home_ht_score,
    away_ht_score: rest.away_ht_score === '' ? null : rest.away_ht_score,
  }
}
