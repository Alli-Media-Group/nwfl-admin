import { Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Team } from '../../types'
import { Button } from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Input'
import { Spinner } from '../ui/Spinner'

interface TeamFormProps {
  onSaved: () => void;
  team: Team | null;
}

export function TeamForm({ onSaved, team }: TeamFormProps) {
  const [form, setForm] = useState({
    bio: '',
    city: '',
    founded: '',
    group: 'A',
    logo: null as File | null,
    manager: '',
    name: '',
    short_name: '',
    slug: '',
    state: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!team) return
    setForm({
      bio: team.bio ?? '',
      city: team.city ?? '',
      founded: team.founded ? String(team.founded) : '',
      group: team.group,
      logo: null,
      manager: team.manager ?? '',
      name: team.name ?? '',
      short_name: team.short_name ?? '',
      slug: team.slug ?? '',
      state: team.state ?? '',
    })
  }, [team])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!team) return
    setSaving(true)
    setError(null)

    try {
      const payload = new FormData()
      payload.append('name', form.name)
      payload.append('short_name', form.short_name)
      payload.append('slug', form.slug)
      payload.append('city', form.city)
      payload.append('state', form.state)
      payload.append('group', form.group)
      payload.append('founded', form.founded)
      payload.append('manager', form.manager)
      payload.append('bio', form.bio)
      if (form.logo) payload.append('logo', form.logo)

      await api.updateTeam(team.id, payload)
      onSaved()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save team.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      <Field label="Name" required>
        <Input onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} value={form.name} />
      </Field>
      <Field label="Short Name" required>
        <Input
          onChange={(event) => setForm((current) => ({ ...current, short_name: event.target.value }))}
          value={form.short_name}
        />
      </Field>
      <Field label="Slug" required>
        <Input onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} value={form.slug} />
      </Field>
      <Field label="Group" required>
        <Select onChange={(event) => setForm((current) => ({ ...current, group: event.target.value as 'A' | 'B' }))} value={form.group}>
          <option value="A">A</option>
          <option value="B">B</option>
        </Select>
      </Field>
      <Field label="City">
        <Input onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} value={form.city} />
      </Field>
      <Field label="State">
        <Input onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} value={form.state} />
      </Field>
      <Field label="Founded">
        <Input
          onChange={(event) => setForm((current) => ({ ...current, founded: event.target.value }))}
          type="number"
          value={form.founded}
        />
      </Field>
      <Field label="Manager">
        <Input onChange={(event) => setForm((current) => ({ ...current, manager: event.target.value }))} value={form.manager} />
      </Field>
      <div className="md:col-span-2">
        <Field label="Logo">
          <Input onChange={(event) => setForm((current) => ({ ...current, logo: event.target.files?.[0] ?? null }))} type="file" />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Bio">
          <Textarea onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} rows={5} value={form.bio} />
        </Field>
      </div>
      {error ? <p className="md:col-span-2 text-sm text-red-300">{error}</p> : null}
      <div className="md:col-span-2 flex justify-end">
        <Button icon={saving ? <Spinner size="sm" /> : <Save size={16} />} type="submit">
          Save Team
        </Button>
      </div>
    </form>
  )
}
