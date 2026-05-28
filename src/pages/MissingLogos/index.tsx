import { AlertCircle, ImagePlus, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { api } from '../../lib/api'
import type { MediaImage, MissingLogoTeam, Team } from '../../types'

function SuggestedImage({ image, team, onAssigned }: { image: MediaImage; team: Team; onAssigned: () => void }) {
  const [assigning, setAssigning] = useState(false)

  async function handleAssign() {
    setAssigning(true)
    try {
      // Fetch the image file from the URL and upload it as the team's logo
      const res = await fetch(image.url)
      const blob = await res.blob()
      const file = new File([blob], image.filename, { type: blob.type })
      await api.updateTeamLogo(team.id, file)
      onAssigned()
    } catch (e: any) {
      alert(e.message || 'Failed to assign logo')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
      <img
        src={image.url}
        alt={image.filename}
        className="h-12 w-12 rounded-md object-cover"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-[var(--color-off-white)]">{image.filename}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {image.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded bg-[var(--color-bg)] px-1.5 py-0.5 text-[9px] uppercase text-[var(--color-muted)]">
              {t}
            </span>
          ))}
        </div>
      </div>
      <Button
        onClick={() => void handleAssign()}
        disabled={assigning}
        type="button"
      >
        {assigning ? <Loader2 size={12} className="animate-spin" /> : 'Assign'}
      </Button>
    </div>
  )
}

export function MissingLogosPage() {
  const [data, setData] = useState<MissingLogoTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set())

  async function load() {
    setLoading(true)
    try {
      const res = await api.getTeamsMissingLogos()
      setData(res.teams || [])
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const visible = data.filter((d) => !assignedIds.has(d.team.id))

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <AlertCircle size={22} className="text-[var(--color-highlight)]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-highlight)]">
              Asset Health
            </p>
            <h3 className="mt-1 text-2xl text-[var(--color-off-white)]">Missing Logos</h3>
          </div>
        </div>

        <p className="mb-5 max-w-xl text-sm text-[var(--color-muted)]">
          Teams without logos are listed below with suggested images from the media library. Click "Assign" to set a logo.
        </p>

        <div className="flex items-center gap-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
            <p className="text-2xl font-bold text-[var(--color-off-white)]">{visible.length}</p>
            <p className="text-xs text-[var(--color-muted)]">Teams without logos</p>
          </div>
          <Button
            variant="outline"
            icon={<ImagePlus size={16} />}
            onClick={() => window.location.href = '/media-library'}
            type="button"
          >
            Upload Images
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner label="Checking teams..." />
        </div>
      ) : visible.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle size={40} className="mx-auto mb-3 text-[var(--color-success)]" />
          <p className="text-sm font-medium text-[var(--color-off-white)]">All teams have logos!</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Every team in the database has a logo assigned.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {visible.map(({ team, suggestions }) => (
            <Card key={team.id} className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--color-surface-2)] text-sm font-bold text-[var(--color-white)]">
                  {team.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-off-white)]">{team.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Group {team.group} · {team.city}, {team.state}
                  </p>
                </div>
              </div>

              {suggestions.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                    Suggested Images ({suggestions.length})
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {suggestions.map((img) => (
                      <SuggestedImage
                        key={img.id}
                        image={img}
                        team={team}
                        onAssigned={() => {
                          setAssignedIds((prev) => new Set(prev).add(team.id))
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
                  <p className="text-xs text-[var(--color-muted)]">
                    No suggestions found. Try uploading images with tags like "{team.slug}", "{team.short_name.toLowerCase()}", or "logo".
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
