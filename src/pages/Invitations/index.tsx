import { Mail, Plus, Shield, User, Loader2, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { api } from '../../lib/api'
import { useToast } from '../../components/ui/Toast'
import type { Invitation } from '../../types'

export function InvitationsPage() {
  const { success, error } = useToast()
  const [invites, setInvites] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [revokingId, setRevokingId] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'superadmin' | 'staff'>('staff')

  async function load() {
    setLoading(true)
    try {
      const data = await api.getInvitations()
      setInvites(data)
    } catch {
      error('Failed to load invitations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    try {
      const invite = await api.createInvitation({ email: email.trim(), role })
      setInvites(prev => [invite, ...prev])
      setEmail('')
      success(`Invitation sent to ${invite.email}`)
    } catch (err: any) {
      error(err.message || 'Failed to send invitation.')
    } finally {
      setSending(false)
    }
  }

  async function handleRevoke(id: number) {
    if (!window.confirm('Are you sure you want to revoke this invitation?')) return
    setRevokingId(id)
    try {
      await api.revokeInvitation(id)
      setInvites(prev => prev.filter(i => i.id !== id))
      success('Invitation revoked.')
    } catch (err: any) {
      error(err.message || 'Failed to revoke invitation.')
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <Mail size={20} style={{ color: 'var(--color-primary)' }} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--color-primary)' }}>
              User Management
            </p>
            <h3 className="mt-1 text-2xl" style={{ color: 'var(--color-text)' }}>Invite Team Member</h3>
          </div>
        </div>

        <form onSubmit={handleSend} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-muted)' }}>
              Email Address
            </label>
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-muted)' }}>
              Role
            </label>
            <select
              className="field-base"
              value={role}
              onChange={e => setRole(e.target.value as 'superadmin' | 'staff')}
            >
              <option value="staff">Staff</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
          <Button type="submit" disabled={sending} icon={sending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}>
            Send Invite
          </Button>
        </form>
      </Card>

      {/* Invitations list */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--color-highlight)' }}>
            Sent Invitations
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition hover:opacity-80"
            style={{ color: 'var(--color-muted)' }}
          >
            <RotateCcw size={13} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8">
            <Spinner label="Loading invitations..." />
          </div>
        ) : invites.length === 0 ? (
          <div className="p-8 text-center">
            <Mail size={32} className="mx-auto mb-3" style={{ color: 'var(--color-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No invitations sent yet.</p>
          </div>
        ) : (
          <div className="table-shell rounded-none border-0">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Sent</th>
                  <th>Sent By</th>
                  <th style={{ width: 48 }} />
                </tr>
              </thead>
              <tbody>
                {invites.map(invite => (
                  <tr key={invite.id}>
                    <td className="font-medium" style={{ color: 'var(--color-text)' }}>{invite.email}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5">
                        {invite.role === 'superadmin' ? (
                          <Shield size={12} style={{ color: 'var(--color-primary)' }} />
                        ) : (
                          <User size={12} style={{ color: 'var(--color-muted)' }} />
                        )}
                        <span className="text-sm capitalize">{invite.role}</span>
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={invite.status} />
                    </td>
                    <td className="text-sm" style={{ color: 'var(--color-muted)' }}>
                      {new Date(invite.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-sm" style={{ color: 'var(--color-muted)' }}>
                      {invite.invited_by_name}
                    </td>
                    <td>
                      {invite.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(invite.id)}
                          disabled={revokingId === invite.id}
                          className="inline-flex items-center justify-center rounded p-1.5 transition hover:bg-red-500/10 disabled:opacity-40"
                          title="Revoke invitation"
                        >
                          {revokingId === invite.id ? (
                            <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-danger)' }} />
                          ) : (
                            <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: Invitation['status'] }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:  { bg: 'rgba(217,119,6,0.12)', color: 'var(--color-warning)', label: 'Pending' },
    accepted: { bg: 'rgba(22,163,74,0.12)', color: 'var(--color-success)', label: 'Accepted' },
    expired:  { bg: 'rgba(100,100,100,0.12)', color: 'var(--color-muted)', label: 'Expired' },
  }
  const s = map[status] || map.pending
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}
// force vercel rebuild 1780054605
