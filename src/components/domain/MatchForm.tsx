import { Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, toMatchPayload } from '../../lib/api'
import type { Match, MatchFormValues, ParsedMatchResult, Team } from '../../types'
import { Button } from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Input'
import { Spinner } from '../ui/Spinner'
import { AIParserBox } from './AIParserBox'

const emptyValues: MatchFormValues = {
  away_score: '',
  away_ht_score: '',
  away_team: '',
  date: '',
  home_score: '',
  home_ht_score: '',
  home_team: '',
  kick_off: '',
  matchday: '',
  notes: '',
  pending_reason: '',
  status: 'UPCOMING',
  venue: '',
}

function toFormValues(match?: Match | null): MatchFormValues {
  if (!match) return emptyValues

  return {
    away_score: match.away_score ?? '',
    away_ht_score: match.away_ht_score ?? '',
    away_team: match.away_team.id,
    date: match.date ?? '',
    home_score: match.home_score ?? '',
    home_ht_score: match.home_ht_score ?? '',
    home_team: match.home_team.id,
    kick_off: match.kick_off ?? '',
    matchday: match.matchday ?? '',
    notes: match.notes ?? '',
    pending_reason: match.pending_reason ?? '',
    status: match.status,
    venue: match.venue ?? '',
  }
}

export function MatchForm({
  match,
  onSaved,
}: {
  match?: Match | null
  onSaved: () => void
}) {
  const [teams, setTeams] = useState<Team[]>([])
  const [values, setValues] = useState<MatchFormValues>(toFormValues(match))
  const [saving, setSaving] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValues(toFormValues(match))
  }, [match])

  useEffect(() => {
    async function loadTeams() {
      try {
        const response = await api.getTeams()
        setTeams(response)
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not load teams.')
      } finally {
        setLoadingTeams(false)
      }
    }

    void loadTeams()
  }, [])

  function updateValue<K extends keyof MatchFormValues>(key: K, value: MatchFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleParsed(result: ParsedMatchResult) {
    const homeTeam = teams.find(
      (team) => team.name.toLowerCase() === result.home_team.toLowerCase() || team.short_name.toLowerCase() === result.home_team.toLowerCase(),
    )
    const awayTeam = teams.find(
      (team) => team.name.toLowerCase() === result.away_team.toLowerCase() || team.short_name.toLowerCase() === result.away_team.toLowerCase(),
    )

    setValues((current) => ({
      ...current,
      away_score: result.away_score ?? '',
      away_ht_score: '',
      away_team: awayTeam?.id ?? current.away_team,
      date: result.date ?? current.date,
      home_score: result.home_score ?? '',
      home_ht_score: '',
      home_team: homeTeam?.id ?? current.home_team,
      kick_off: result.kick_off ?? '',
      matchday: result.matchday ?? '',
      notes: '',
      pending_reason: result.pending_reason ?? '',
      status: result.status,
      venue: result.venue ?? '',
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = toMatchPayload(values)
      if (match) {
        await api.updateMatch(match.id, payload)
      } else {
        await api.createMatch(payload)
      }
      onSaved()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save match.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <AIParserBox onParsed={handleParsed} />

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Home Team" required>
          <Select
            disabled={loadingTeams}
            onChange={(event) => updateValue('home_team', Number(event.target.value) || '')}
            value={values.home_team}
          >
            <option value="">Select home team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Away Team" required>
          <Select
            disabled={loadingTeams}
            onChange={(event) => updateValue('away_team', Number(event.target.value) || '')}
            value={values.away_team}
          >
            <option value="">Select away team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Home Score">
          <Input
            min="0"
            onChange={(event) => updateValue('home_score', event.target.value === '' ? '' : Number(event.target.value))}
            type="number"
            value={values.home_score}
          />
        </Field>
        <Field label="Away Score">
          <Input
            min="0"
            onChange={(event) => updateValue('away_score', event.target.value === '' ? '' : Number(event.target.value))}
            type="number"
            value={values.away_score}
          />
        </Field>
        <Field label="HT Home">
          <Input
            min="0"
            onChange={(event) => updateValue('home_ht_score', event.target.value === '' ? '' : Number(event.target.value))}
            type="number"
            value={values.home_ht_score}
          />
        </Field>
        <Field label="HT Away">
          <Input
            min="0"
            onChange={(event) => updateValue('away_ht_score', event.target.value === '' ? '' : Number(event.target.value))}
            type="number"
            value={values.away_ht_score}
          />
        </Field>
        <Field label="Matchday" required>
          <Input
            min="1"
            onChange={(event) => updateValue('matchday', event.target.value === '' ? '' : Number(event.target.value))}
            type="number"
            value={values.matchday}
          />
        </Field>
        <Field label="Date" required>
          <Input onChange={(event) => updateValue('date', event.target.value)} type="date" value={values.date} />
        </Field>
        <Field label="Kick Off">
          <Input onChange={(event) => updateValue('kick_off', event.target.value)} type="time" value={values.kick_off} />
        </Field>
        <Field label="Status" required>
          <Select onChange={(event) => updateValue('status', event.target.value as Match['status'])} value={values.status}>
            <option value="UPCOMING">UPCOMING</option>
            <option value="FT">FT</option>
            <option value="LIVE">LIVE</option>
            <option value="PENDING">PENDING</option>
          </Select>
        </Field>
        <div className="md:col-span-2">
          <Field label="Venue">
            <Input onChange={(event) => updateValue('venue', event.target.value)} value={values.venue} />
          </Field>
        </div>
        {values.status === 'PENDING' ? (
          <div className="md:col-span-2">
            <Field label="Pending Reason">
              <Textarea
                onChange={(event) => updateValue('pending_reason', event.target.value)}
                placeholder="Explain what is missing or needs review"
                rows={4}
                value={values.pending_reason}
              />
            </Field>
          </div>
        ) : null}
        <div className="md:col-span-2">
          <Field label="Notes">
            <Textarea
              onChange={(event) => updateValue('notes', event.target.value)}
              placeholder="Match notes, postponements, admin remarks..."
              rows={3}
              value={values.notes}
            />
          </Field>
        </div>
      </div>

      {error ? <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p> : null}

      <div className="flex justify-end">
        <Button icon={saving ? <Spinner size="sm" /> : <Save size={16} />} type="submit">
          {match ? 'Update Match' : 'Save Match'}
        </Button>
      </div>
    </form>
  )
}
