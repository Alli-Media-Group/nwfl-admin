import { AlertCircle, Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input, Select } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toast'
import { PlayerForm } from '../../components/domain/PlayerForm'
import { api } from '../../lib/api'
import type { Player, Team } from '../../types'

const POSITIONS = [
  { value: '', label: 'All positions' },
  { value: 'GK', label: 'Goalkeeper' },
  { value: 'DF', label: 'Defender' },
  { value: 'MF', label: 'Midfielder' },
  { value: 'FW', label: 'Forward' },
]

function PlayerCardSkeleton() {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between">
        <div className="w-2/3 space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--color-surface-2)]" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--color-surface-2)]" />
        </div>
        <div className="h-6 w-14 animate-pulse rounded bg-[var(--color-surface-2)]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="h-3 w-10 animate-pulse rounded bg-[var(--color-surface-2)]" />
          <div className="h-5 w-6 animate-pulse rounded bg-[var(--color-surface-2)]" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-10 animate-pulse rounded bg-[var(--color-surface-2)]" />
          <div className="h-5 w-6 animate-pulse rounded bg-[var(--color-surface-2)]" />
        </div>
      </div>
      <div className="mt-auto grid grid-cols-4 gap-2 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="col-span-3 h-9 animate-pulse rounded bg-[var(--color-surface-2)]" />
        <div className="h-9 animate-pulse rounded bg-[var(--color-surface-2)]" />
      </div>
    </Card>
  )
}

export function PlayersPage() {
  const { error: toastError, success } = useToast()

  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Player | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<Player | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [positionFilter, setPositionFilter] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [playersData, teamsData] = await Promise.all([
        api.getPlayers(),
        api.getTeams(),
      ])
      setPlayers(playersData)
      setTeams(teamsData)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not load players.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return players.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.team.name.toLowerCase().includes(term)
      const matchesTeam = !teamFilter || String(p.team.id) === teamFilter
      const matchesPosition = !positionFilter || p.position === positionFilter
      return matchesSearch && matchesTeam && matchesPosition
    })
  }, [players, search, teamFilter, positionFilter])

  const hasFilters = Boolean(search || teamFilter || positionFilter)

  function clearFilters() {
    setSearch('')
    setTeamFilter('')
    setPositionFilter('')
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) return
    setDeleting(true)
    try {
      await api.deletePlayer(deleteCandidate.slug)
      setDeleteCandidate(null)
      success('Player deleted')
      void refresh()
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not delete player.'
      toastError(message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--color-highlight)' }}>
            Player Registry
          </p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl" style={{ color: 'var(--color-text)' }}>
            Players
          </h1>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Create Player
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Field className="md:col-span-2" label="Search">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-muted)' }}
              />
              <Input
                className="pl-9"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or team..."
                value={search}
              />
            </div>
          </Field>
          <Field label="Team">
            <Select onChange={(e) => setTeamFilter(e.target.value)} value={teamFilter}>
              <option value="">All teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Position">
            <Select onChange={(e) => setPositionFilter(e.target.value)} value={positionFilter}>
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {hasFilters ? (
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={clearFilters} variant="ghost">
              <X size={14} />
              Clear filters
            </Button>
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        ) : null}
      </Card>

      {/* Error */}
      {error ? (
        <Alert icon={AlertCircle} title="Could not load players" variant="danger">
          <div className="space-y-3">
            <p>{error}</p>
            <Button onClick={() => void refresh()} variant="outline">
              Try again
            </Button>
          </div>
        </Alert>
      ) : null}

      {/* Create modal */}
      <Modal onClose={() => setShowCreate(false)} open={showCreate} title="Create Player">
        <PlayerForm
          key="create"
          onCancel={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false)
            success('Player created')
            void refresh()
          }}
          teams={teams}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        onClose={() => setSelected(null)}
        open={Boolean(selected)}
        title={selected ? `Edit ${selected.name}` : 'Edit Player'}
      >
        <PlayerForm
          key={selected?.id ?? 'edit'}
          onCancel={() => setSelected(null)}
          onSaved={() => {
            setSelected(null)
            success('Player saved')
            void refresh()
          }}
          player={selected}
          teams={teams}
        />
      </Modal>

      {/* Delete confirmation */}
      <Modal
        onClose={() => setDeleteCandidate(null)}
        open={Boolean(deleteCandidate)}
        title="Delete player?"
      >
        <div className="space-y-5">
          <p className="text-sm" style={{ color: 'var(--color-text-2)' }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: 'var(--color-text)' }}>{deleteCandidate?.name}</strong>?
            This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              disabled={deleting}
              onClick={() => setDeleteCandidate(null)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={deleting}
              onClick={() => void handleConfirmDelete()}
              variant="danger"
            >
              {deleting ? <Spinner size="sm" /> : <Trash2 size={16} />}
              Delete Player
            </Button>
          </div>
        </div>
      </Modal>

      {/* Content */}
      {loading ? (
        <div className="data-grid data-grid-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <PlayerCardSkeleton key={index} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <div
            className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: 'var(--color-surface)' }}
          >
            {hasFilters ? (
              <Search size={24} style={{ color: 'var(--color-highlight)' }} />
            ) : (
              <Users size={24} style={{ color: 'var(--color-highlight)' }} />
            )}
          </div>
          <h3 className="mb-2 text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {hasFilters ? 'No players match' : 'No players yet'}
          </h3>
          <p className="mx-auto mb-6 max-w-md text-sm" style={{ color: 'var(--color-muted)' }}>
            {hasFilters
              ? 'Try adjusting your search or filters to find what you are looking for.'
              : 'Players are auto-created from goal data, or you can add them manually.'}
          </p>
          {hasFilters ? (
            <Button onClick={clearFilters} variant="outline">
              Clear filters
            </Button>
          ) : (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              Add First Player
            </Button>
          )}
        </Card>
      ) : (
        <>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            {filtered.length} player{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== players.length ? ` of ${players.length}` : ''}
          </p>
          <div className="data-grid data-grid-3">
            {filtered.map((player) => (
              <PlayerCard
                key={player.id}
                onDelete={() => setDeleteCandidate(player)}
                onEdit={() => setSelected(player)}
                player={player}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PlayerCard({
  player,
  onEdit,
  onDelete,
}: {
  player: Player
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card className="flex flex-col gap-4 p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="truncate text-lg font-bold"
            style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
            title={player.name}
          >
            {player.name}
          </h3>
          <p className="truncate text-sm" style={{ color: 'var(--color-muted)' }}>
            {player.team.name}
          </p>
        </div>
        {player.position ? (
          <span
            className="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-2)',
            }}
          >
            {player.position}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            Goals
          </span>
          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
            {player.goals ?? 0}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            Jersey
          </span>
          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
            {player.jersey_number ?? '—'}
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <Button className="flex-1" onClick={onEdit} variant="outline">
          <Pencil size={14} />
          Edit
        </Button>
        <Button
          className="px-3"
          onClick={onDelete}
          variant="danger"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </Card>
  )
}
