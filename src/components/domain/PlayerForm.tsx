import { AlertCircle, Save, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '../../lib/api'
import type { Player, Team } from '../../types'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Input'
import { Spinner } from '../ui/Spinner'

interface PlayerFormProps {
  onSaved: () => void
  onCancel?: () => void
  player?: Player | null
  teams: Team[]
}

const emptyForm = {
  name: '',
  slug: '',
  team: '' as string | number,
  position: '' as Player['position'],
  jersey_number: '',
  nationality: 'Nigeria',
  date_of_birth: '',
  joined_date: '',
  bio: '',
  photo: null as File | null,
  is_active: true,
}

export function PlayerForm({ onSaved, onCancel, player, teams }: PlayerFormProps) {
  const isCreate = !player
  const initialForm = useMemo(() => {
    if (!player) return emptyForm
    return {
      name: player.name ?? '',
      slug: player.slug ?? '',
      team: player.team?.id ?? '',
      position: player.position ?? '',
      jersey_number: player.jersey_number ? String(player.jersey_number) : '',
      nationality: player.nationality ?? 'Nigeria',
      date_of_birth: player.date_of_birth ?? '',
      joined_date: player.joined_date ?? '',
      bio: player.bio ?? '',
      photo: null as File | null,
      is_active: player.is_active ?? true,
    }
  }, [player])

  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = new FormData()
      payload.append('name', form.name)
      payload.append('slug', form.slug)
      payload.append('team', String(form.team))
      payload.append('position', form.position)
      if (form.jersey_number) payload.append('jersey_number', form.jersey_number)
      payload.append('nationality', form.nationality)
      if (form.date_of_birth) payload.append('date_of_birth', form.date_of_birth)
      if (form.joined_date) payload.append('joined_date', form.joined_date)
      payload.append('bio', form.bio)
      payload.append('is_active', form.is_active ? 'true' : 'false')
      if (form.photo) payload.append('photo', form.photo)

      if (isCreate) {
        await api.createPlayer(payload)
      } else {
        await api.updatePlayer(player.slug, payload)
      }
      onSaved()
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not save player.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      <Field label="Name" required>
        <Input
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          value={form.name}
        />
      </Field>
      <Field label="Slug" required>
        <Input
          onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
          value={form.slug}
        />
      </Field>
      <Field label="Team" required>
        <Select
          onChange={(event) => setForm((current) => ({ ...current, team: event.target.value }))}
          value={String(form.team)}
        >
          <option value="">Select team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Position">
        <Select
          onChange={(event) => setForm((current) => ({ ...current, position: event.target.value as Player['position'] }))}
          value={form.position}
        >
          <option value="">Unknown</option>
          <option value="GK">Goalkeeper</option>
          <option value="DF">Defender</option>
          <option value="MF">Midfielder</option>
          <option value="FW">Forward</option>
        </Select>
      </Field>
      <Field label="Jersey Number">
        <Input
          onChange={(event) => setForm((current) => ({ ...current, jersey_number: event.target.value }))}
          type="number"
          min={1}
          value={form.jersey_number}
        />
      </Field>
      <Field label="Nationality">
        <Input
          onChange={(event) => setForm((current) => ({ ...current, nationality: event.target.value }))}
          value={form.nationality}
        />
      </Field>
      <Field label="Date of Birth">
        <Input
          onChange={(event) => setForm((current) => ({ ...current, date_of_birth: event.target.value }))}
          type="date"
          value={form.date_of_birth}
        />
      </Field>
      <Field label="Joined Date">
        <Input
          onChange={(event) => setForm((current) => ({ ...current, joined_date: event.target.value }))}
          type="date"
          value={form.joined_date}
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="Photo">
          <Input
            onChange={(event) => setForm((current) => ({ ...current, photo: event.target.files?.[0] ?? null }))}
            type="file"
            accept="image/*"
          />
          {form.photo ? (
            <p className="mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>
              Selected: {form.photo.name}
            </p>
          ) : null}
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Bio">
          <Textarea
            onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
            rows={4}
            value={form.bio}
          />
        </Field>
      </div>
      <div className="md:col-span-2 flex items-center gap-2">
        <input
          id="is_active"
          type="checkbox"
          checked={form.is_active}
          onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
        />
        <label htmlFor="is_active" className="text-sm" style={{ color: 'var(--color-text)' }}>
          Active player
        </label>
      </div>

      {error ? (
        <div className="md:col-span-2">
          <Alert icon={AlertCircle} title="Could not save player" variant="danger">
            {error}
          </Alert>
        </div>
      ) : null}

      <div className="md:col-span-2 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          <X size={16} />
          Cancel
        </Button>
        <Button
          disabled={saving}
          icon={saving ? <Spinner size="sm" /> : <Save size={16} />}
          type="submit"
        >
          {isCreate ? 'Create Player' : 'Save Player'}
        </Button>
      </div>
    </form>
  )
}
