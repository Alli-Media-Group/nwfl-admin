import { Edit2, FileText, ImageIcon, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input, Textarea } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { api } from '../../lib/api'
import type { BlogPost, Gallery } from '../../types'

type Tab = 'posts' | 'galleries'

const CATEGORY_LABELS: Record<BlogPost['category'], string> = {
  news: 'News',
  blog: 'Blog',
  match_report: 'Match Report',
  transfer: 'Transfer',
  feature: 'Feature',
}

const CATEGORY_OPTIONS: BlogPost['category'][] = ['news', 'blog', 'match_report', 'transfer', 'feature']

export function BlogPage() {
  const [tab, setTab] = useState<Tab>('posts')
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null)
  const [deletingPost, setDeletingPost] = useState<BlogPost | null>(null)
  const [deletingGallery, setDeletingGallery] = useState<Gallery | null>(null)

  async function loadPosts() {
    try {
      const data = await api.getBlogPosts()
      setPosts(data)
    } catch (e: any) {
      setError(e.message || 'Failed to load posts')
    }
  }

  async function loadGalleries() {
    try {
      const data = await api.getGalleries()
      setGalleries(data)
    } catch (e: any) {
      setError(e.message || 'Failed to load galleries')
    }
  }

  async function load() {
    setLoading(true)
    setError(null)
    await Promise.all([loadPosts(), loadGalleries()])
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    setError(null)
    try {
      const res = await api.syncWordPress()
      setSyncResult(res.output || 'Sync completed')
      await load()
    } catch (e: any) {
      setError(e.message || 'WordPress sync failed')
    } finally {
      setSyncing(false)
    }
  }

  async function handleSavePost(form: Partial<BlogPost>) {
    if (!editingPost) return
    try {
      await api.updateBlogPost(editingPost.slug, form)
      setEditingPost(null)
      await loadPosts()
    } catch (e: any) {
      setError(e.message || 'Failed to update post')
    }
  }

  async function handleDeletePost() {
    if (!deletingPost) return
    try {
      await api.deleteBlogPost(deletingPost.slug)
      setDeletingPost(null)
      await loadPosts()
    } catch (e: any) {
      setError(e.message || 'Failed to delete post')
    }
  }

  async function handleSaveGallery(form: Partial<Gallery>) {
    if (!editingGallery) return
    try {
      await api.updateGallery(editingGallery.slug, form)
      setEditingGallery(null)
      await loadGalleries()
    } catch (e: any) {
      setError(e.message || 'Failed to update gallery')
    }
  }

  async function handleDeleteGallery() {
    if (!deletingGallery) return
    try {
      await api.deleteGallery(deletingGallery.slug)
      setDeletingGallery(null)
      await loadGalleries()
    } catch (e: any) {
      setError(e.message || 'Failed to delete gallery')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--color-highlight)' }}>
            Content Management
          </p>
          <h3 className="mt-1 text-2xl" style={{ color: 'var(--color-off-white)' }}>
            News, Blog & Gallery
          </h3>
        </div>
        <Button
          icon={syncing ? <Spinner size="sm" /> : <RefreshCw size={16} />}
          onClick={() => void handleSync()}
          type="button"
        >
          {syncing ? 'Syncing from WordPress...' : 'Sync WordPress'}
        </Button>
      </div>

      {error && (
        <Card className="p-4" style={{ borderColor: 'rgba(186,26,26,0.30)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>{error}</p>
        </Card>
      )}

      {syncResult && (
        <Card className="p-4" style={{ borderColor: 'rgba(22,163,74,0.30)' }}>
          <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-success)' }}>Sync Result</p>
          <pre className="max-h-48 overflow-auto rounded-lg p-3 text-xs font-mono" style={{ background: 'var(--color-bg-subtle)', color: 'var(--color-success)' }}>
            {syncResult}
          </pre>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <TabButton active={tab === 'posts'} onClick={() => setTab('posts')} icon={<FileText size={16} />}>
          Posts ({posts.length})
        </TabButton>
        <TabButton active={tab === 'galleries'} onClick={() => setTab('galleries')} icon={<ImageIcon size={16} />}>
          Galleries ({galleries.length})
        </TabButton>
      </div>

      {loading ? (
        <Spinner label="Loading content" />
      ) : tab === 'posts' ? (
        <PostsTable posts={posts} onEdit={setEditingPost} onDelete={setDeletingPost} />
      ) : (
        <GalleriesTable galleries={galleries} onEdit={setEditingGallery} onDelete={setDeletingGallery} />
      )}

      {/* Edit Post Modal */}
      <Modal open={Boolean(editingPost)} onClose={() => setEditingPost(null)} title={editingPost ? `Edit: ${editingPost.title}` : 'Edit Post'}>
        {editingPost && (
          <PostForm
            post={editingPost}
            onCancel={() => setEditingPost(null)}
            onSave={(form) => void handleSavePost(form)}
          />
        )}
      </Modal>

      {/* Delete Post Modal */}
      <Modal open={Boolean(deletingPost)} onClose={() => setDeletingPost(null)} title="Delete Post">
        {deletingPost && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-text-2)' }}>
              Are you sure you want to delete <strong>{deletingPost.title}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeletingPost(null)} type="button">Cancel</Button>
              <Button onClick={() => void handleDeletePost()} type="button" style={{ background: 'var(--color-danger)' }}>
                <Trash2 size={15} /> Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Gallery Modal */}
      <Modal open={Boolean(editingGallery)} onClose={() => setEditingGallery(null)} title={editingGallery ? `Edit: ${editingGallery.title}` : 'Edit Gallery'}>
        {editingGallery && (
          <GalleryForm
            gallery={editingGallery}
            onCancel={() => setEditingGallery(null)}
            onSave={(form) => void handleSaveGallery(form)}
          />
        )}
      </Modal>

      {/* Delete Gallery Modal */}
      <Modal open={Boolean(deletingGallery)} onClose={() => setDeletingGallery(null)} title="Delete Gallery">
        {deletingGallery && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-text-2)' }}>
              Are you sure you want to delete <strong>{deletingGallery.title}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeletingGallery(null)} type="button">Cancel</Button>
              <Button onClick={() => void handleDeleteGallery()} type="button" style={{ background: 'var(--color-danger)' }}>
                <Trash2 size={15} /> Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors"
      style={{
        color: active ? 'var(--color-primary)' : 'var(--color-text-2)',
        borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
      }}
    >
      {icon}
      {children}
    </button>
  )
}

function PostsTable({ posts, onEdit, onDelete }: { posts: BlogPost[]; onEdit: (p: BlogPost) => void; onDelete: (p: BlogPost) => void }) {
  if (posts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p style={{ color: 'var(--color-muted)' }}>No posts yet. Sync from WordPress to import content.</p>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--color-surface)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Post</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Published</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {post.featured_image_url ? (
                      <img src={post.featured_image_url} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded" style={{ background: 'var(--color-surface-2)' }}>
                        <FileText size={16} style={{ color: 'var(--color-muted)' }} />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{post.title}</p>
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>/{post.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded px-2 py-1 text-xs font-medium" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-2)' }}>
                    {CATEGORY_LABELS[post.category]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${post.status === 'published' ? 'text-green-400' : 'text-amber-400'}`} style={{ background: post.status === 'published' ? 'rgba(22,163,74,0.10)' : 'rgba(217,119,6,0.10)' }}>
                    {post.status}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--color-muted)' }}>
                  {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => onEdit(post)} className="rounded p-1.5 transition-colors hover:bg-[var(--color-surface)]" style={{ color: 'var(--color-muted)' }}>
                      <Edit2 size={15} />
                    </button>
                    <button type="button" onClick={() => onDelete(post)} className="rounded p-1.5 transition-colors hover:bg-[var(--color-surface)]" style={{ color: 'var(--color-danger)' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function GalleriesTable({ galleries, onEdit, onDelete }: { galleries: Gallery[]; onEdit: (g: Gallery) => void; onDelete: (g: Gallery) => void }) {
  if (galleries.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p style={{ color: 'var(--color-muted)' }}>No galleries yet. Sync from WordPress to import galleries.</p>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--color-surface)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Gallery</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Images</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Published</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {galleries.map((gallery) => (
              <tr key={gallery.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {gallery.cover_image_url ? (
                      <img src={gallery.cover_image_url} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded" style={{ background: 'var(--color-surface-2)' }}>
                        <ImageIcon size={16} style={{ color: 'var(--color-muted)' }} />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{gallery.title}</p>
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>/{gallery.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--color-muted)' }}>
                  {gallery.images?.length || 0}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--color-muted)' }}>
                  {gallery.published_at ? new Date(gallery.published_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => onEdit(gallery)} className="rounded p-1.5 transition-colors hover:bg-[var(--color-surface)]" style={{ color: 'var(--color-muted)' }}>
                      <Edit2 size={15} />
                    </button>
                    <button type="button" onClick={() => onDelete(gallery)} className="rounded p-1.5 transition-colors hover:bg-[var(--color-surface)]" style={{ color: 'var(--color-danger)' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function PostForm({ post, onSave, onCancel }: { post: BlogPost; onSave: (form: Partial<BlogPost>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    status: post.status,
    featured_image_url: post.featured_image_url,
  })

  return (
    <div className="space-y-4">
      <Field label="Title">
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </Field>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Category</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as BlogPost['category'] })}
          className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Status</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as BlogPost['status'] })}
          className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
      <Field label="Featured Image URL">
        <Input
          value={form.featured_image_url}
          onChange={(e) => setForm({ ...form, featured_image_url: e.target.value })}
        />
      </Field>
      <Field label="Excerpt">
        <Textarea
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
        />
      </Field>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
        <Button onClick={() => onSave(form)} type="button">Save Changes</Button>
      </div>
    </div>
  )
}

function GalleryForm({ gallery, onSave, onCancel }: { gallery: Gallery; onSave: (form: Partial<Gallery>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    title: gallery.title,
    description: gallery.description,
    cover_image_url: gallery.cover_image_url,
  })

  return (
    <div className="space-y-4">
      <Field label="Title">
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </Field>
      <Field label="Cover Image URL">
        <Input
          value={form.cover_image_url}
          onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </Field>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
        <Button onClick={() => onSave(form)} type="button">Save Changes</Button>
      </div>
    </div>
  )
}
