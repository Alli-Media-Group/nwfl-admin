import { Copy, Eye, EyeOff, KeyRound, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { SkeletonRows } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { api } from '../../lib/api'
import type { ApiClientInfo } from '../../types'

const messageOf = (err: unknown) => (err instanceof Error ? err.message : '')
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : 'never')

/**
 * The league's API keys. Only a superadmin sees this page. A key is shown in full once when it is made and can be
 * shown again here (with the eye button); "Replace" makes a new key and ends the old one.
 */
export function ApiAccessPage() {
  const { success, error } = useToast()
  const [clients, setClients] = useState<ApiClientInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState<number | null>(null)
  // The keys currently on screen, by client id. Hidden again when the page is left.
  const [shown, setShown] = useState<Record<number, string>>({})

  async function load() {
    try {
      setClients(await api.getApiClients())
    } catch {
      error('Failed to load the API keys.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    try {
      const made = await api.createApiClient(name.trim())
      const { key, ...info } = made
      setClients(prev => [info, ...prev])
      setShown(prev => ({ ...prev, [info.id]: key }))
      setName('')
      success('Key created. Copy it into the site\'s settings now; you can also come back here to see it.')
    } catch (err) {
      error(messageOf(err) || 'Failed to create the key.')
    } finally {
      setCreating(false)
    }
  }

  async function handleToggle(c: ApiClientInfo) {
    if (shown[c.id]) {
      setShown(prev => { const next = { ...prev }; delete next[c.id]; return next })
      return
    }
    setBusy(c.id)
    try {
      const { key } = await api.revealApiClient(c.id)
      setShown(prev => ({ ...prev, [c.id]: key }))
    } catch (err) {
      error(messageOf(err) || 'Could not show the key.')
    } finally {
      setBusy(null)
    }
  }

  async function handleCopy(key: string) {
    try {
      await navigator.clipboard.writeText(key)
      success('Copied.')
    } catch {
      error('Could not copy. Select the key and copy it by hand.')
    }
  }

  async function handleRotate(c: ApiClientInfo) {
    if (!window.confirm('Replace this key? The old key stops working at once, and the site must be given the new one.')) return
    setBusy(c.id)
    try {
      const made = await api.rotateApiClient(c.id)
      const { key, ...info } = made
      setClients(prev => prev.map(x => (x.id === c.id ? info : x)))
      setShown(prev => ({ ...prev, [c.id]: key }))
      success('New key made. The old one no longer works.')
    } catch (err) {
      error(messageOf(err) || 'Failed to replace the key.')
    } finally {
      setBusy(null)
    }
  }

  async function handleRevoke(c: ApiClientInfo) {
    if (!window.confirm('Switch this key off for good? The site using it will stop getting data.')) return
    setBusy(c.id)
    try {
      const info = await api.revokeApiClient(c.id)
      setClients(prev => prev.map(x => (x.id === c.id ? info : x)))
      setShown(prev => { const next = { ...prev }; delete next[c.id]; return next })
      success('Key switched off.')
    } catch (err) {
      error(messageOf(err) || 'Failed to switch the key off.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <KeyRound size={20} style={{ color: 'var(--color-primary)' }} />
          <div>
            <p className="eyebrow">
              Data access
            </p>
            <h3 className="mt-1 text-2xl" style={{ color: 'var(--color-text)' }}>Make an API key</h3>
          </div>
        </div>
        <p className="mb-4 text-sm" style={{ color: 'var(--color-muted)' }}>
          The key lets one website read the league's data. Keep it in the site's server settings, never in the page
          itself. Only superadmins can see this page.
        </p>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Name (the site it is for)
            </label>
            <Input placeholder="NWFL website" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <Button type="submit" disabled={creating} icon={creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}>
            Make key
          </Button>
        </form>
      </Card>

      {loading ? (
        <SkeletonRows rows={2} />
      ) : clients.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No keys yet.</p>
        </Card>
      ) : (
        clients.map(c => (
          <Card key={c.id} className="space-y-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-lg" style={{ color: 'var(--color-text)' }}>{c.name}</h4>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {c.active ? 'Active' : `Switched off ${when(c.revoked_at)}`} · made {when(c.created_at)}
                  {c.created_by_name ? ` by ${c.created_by_name}` : ''}
                  {c.rotated_at ? ` · replaced ${when(c.rotated_at)}` : ''} · last used {when(c.last_used_at)} · up to{' '}
                  {c.requests_per_minute} requests a minute
                </p>
              </div>
              {c.active && (
                <div className="flex gap-2">
                  <Button variant="outline" disabled={busy === c.id} onClick={() => void handleRotate(c)} icon={<RefreshCw size={15} />}>
                    Replace
                  </Button>
                  <Button variant="outline" disabled={busy === c.id} onClick={() => void handleRevoke(c)} icon={<Trash2 size={15} />}>
                    Switch off
                  </Button>
                </div>
              )}
            </div>
            {c.active && (
              <div className="flex flex-wrap items-center gap-2">
                <code
                  className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                >
                  {shown[c.id] ?? `${c.key_prefix}${'•'.repeat(24)}`}
                </code>
                <Button variant="outline" disabled={busy === c.id} onClick={() => void handleToggle(c)} icon={shown[c.id] ? <EyeOff size={15} /> : <Eye size={15} />}>
                  {shown[c.id] ? 'Hide' : 'Show'}
                </Button>
                {shown[c.id] && (
                  <Button variant="outline" onClick={() => void handleCopy(shown[c.id] as string)} icon={<Copy size={15} />}>
                    Copy
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  )
}
