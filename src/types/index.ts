export interface Team {
  id: number;
  name: string;
  short_name: string;
  slug: string;
  city: string;
  state: string;
  group: 'A' | 'B';
  founded: number | null;
  manager: string;
  logo: string | null;
  titles: number;
  bio: string;
}

export interface Match {
  id: number;
  home_team: Team;
  away_team: Team;
  matchday: number;
  date: string | null;
  kick_off: string | null;
  venue: string;
  status: 'UPCOMING' | 'LIVE' | 'FT' | 'PENDING';
  home_score: number | null;
  away_score: number | null;
  pending_reason: string;
  notify_admin: boolean;
}

export interface Standing {
  id: number;
  team: Team;
  season: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form: string[];
}

export interface ParsedMatchResult {
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  matchday: number | null;
  date: string | null;
  kick_off: string | null;
  venue: string | null;
  status: 'UPCOMING' | 'LIVE' | 'FT' | 'PENDING';
  pending_reason: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface TeamExistenceResult {
  exists: boolean;
  team: Team | null;
}

export interface ParsedTeamResult {
  name: string;
  short_name: string;
  slug: string;
  city: string | null;
  state: string | null;
  group: 'A' | 'B' | null;
  founded: number | null;
  manager: string | null;
  titles: number;
  bio: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface TeamResearchResult {
  team_name: string;
  result: ParsedTeamResult | null;
  error: string | null;
}

export interface ParsedStandingRow {
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  is_superuser: boolean;
  is_staff: boolean;
}

export interface DashboardStats {
  totalTeams: number;
  totalMatches: number;
  pendingMatches: number;
  upcomingMatches: number;
}

export interface MatchFormValues {
  home_team: number | '';
  away_team: number | '';
  home_score: number | '';
  away_score: number | '';
  matchday: number | '';
  date: string;
  kick_off: string;
  venue: string;
  status: Match['status'];
  pending_reason: string;
}

export interface MediaImage {
  id: number;
  file: string;
  url: string;
  filename: string;
  tags: string[];
  uploaded_at: string;
}

export interface MissingLogoTeam {
  team: Team;
  suggestions: MediaImage[];
}
