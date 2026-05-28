import { ImagePlus, Search, Tag, Trash2, Upload, Wand2, Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { api } from '../../lib/api'
import type { MediaImage } from '../../types'

interface BatchItem {
  file: File
  id: string
  status: 'pending' | 'suggesting' | 'ready' | 'uploading' | 'done' | 'error' | 'duplicate'
  aiTags: string[]
  manualTags: string
  previewUrl: string
  error?: string
  existingId?: number
  existingFilename?: string
}

export function MediaLibraryPage() {
  const [images, setImages] = useState<MediaImage[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTag, setSearchTag] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [preview, setPreview] = useState<MediaImage | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [batch, setBatch] = useState<BatchItem[]>([])
  const [batchOpen, setBatchOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MediaImage | null>(null)
  const [editTarget, setEditTarget] = useState<MediaImage | null>(null)
  const [editTags, setEditTags] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const folderRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  async function load() {
    setLoading(true)
    try {
      const [imgRes, tagRes] = await Promise.all([
        api.getMediaImages(),
        api.getMediaTags(),
      ])
      setImages(imgRes.results || [])
      setTags(tagRes.tags || [])
    } catch (e: any) {
      console.error(e)
      setToast({ message: 'Failed to load media library.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function handleSearch() {
    if (!searchTag.trim() && selectedTags.length === 0) {
      void load()
      return
    }
    setLoading(true)
    try {
      const tagsToSearch = selectedTags.length > 0 ? selectedTags : [searchTag.trim()]
      const res = await api.searchMediaByTags(tagsToSearch)
      setImages(res.results || [])
    } catch (e: any) {
      console.error(e)
      setToast({ message: 'Search failed.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleteError('')
    try {
      await api.deleteMediaImage(deleteTarget.id)
      setImages((prev) => prev.filter((i) => i.id !== deleteTarget.id))
      setDeleteTarget(null)
      setToast({ message: 'Image deleted.', type: 'success' })
    } catch (e: any) {
      setDeleteError(e.message || 'Delete failed')
    }
  }

  function openEdit(img: MediaImage) {
    setEditTarget(img)
    setEditTags(img.tags.join(', '))
    setEditSaving(false)
  }

  async function handleSaveEdit() {
    if (!editTarget) return
    setEditSaving(true)
    try {
      const tagList = editTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0)
      const updated = await api.updateMediaImage(editTarget.id, tagList)
      setImages((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      setEditTarget(null)
      setToast({ message: 'Tags updated.', type: 'success' })
      // Refresh tag list in case new tags were added
      void api.getMediaTags().then((r) => setTags(r.tags || []))
    } catch (e: any) {
      setToast({ message: e.message || 'Update failed', type: 'error' })
    } finally {
      setEditSaving(false)
    }
  }

  async function checkDuplicate(file: File): Promise<{ duplicate: boolean; existingId?: number; existingFilename?: string }> {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    const existing = images.find((img) => img.file_hash === hashHex)
    if (existing) {
      return { duplicate: true, existingId: existing.id, existingFilename: existing.filename }
    }
    return { duplicate: false }
  }

  async function startBatch(files: FileList | null) {
    if (!files || files.length === 0) return
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    const items: BatchItem[] = []
    for (const file of imageFiles) {
      const dup = await checkDuplicate(file)
      items.push({
        file,
        id: Math.random().toString(36).slice(2),
        status: dup.duplicate ? 'duplicate' : 'pending',
        aiTags: [],
        manualTags: '',
        previewUrl: URL.createObjectURL(file),
        existingId: dup.existingId,
        existingFilename: dup.existingFilename,
      })
    }

    if (items.length === 0) return
    setBatch(items)
    setBatchOpen(true)

    const toSuggest = items.filter((i) => i.status !== 'duplicate')
    if (toSuggest.length > 0) {
      void suggestTagsForBatch(toSuggest)
    }
  }

  async function suggestTagsForBatch(items: BatchItem[]) {
    await Promise.all(
      items.map(async (item) => {
        setBatch((prev) =>
          prev.map((b) => (b.id === item.id ? { ...b, status: 'suggesting' } : b))
        )
        try {
          const res = await api.suggestImageTags(item.file)
          setBatch((prev) =>
            prev.map((b) =>
              b.id === item.id
                ? { ...b, status: 'ready', aiTags: res.tags || [], manualTags: (res.tags || []).join(', ') }
                : b
            )
          )
        } catch (e: any) {
          const data = e?.data || {}
          const isVisionUnavailable = data.error === 'vision_unavailable' || e.status === 503
          setBatch((prev) =>
            prev.map((b) =>
              b.id === item.id
                ? {
                    ...b,
                    status: 'ready',
                    aiTags: [],
                    manualTags: '',
                    error: isVisionUnavailable ? 'AI unavailable — add tags manually' : undefined,
                  }
                : b
            )
          )
        }
      })
    )
  }

  async function uploadBatch() {
    for (const item of batch) {
      if (item.status === 'done' || item.status === 'duplicate') continue
      setBatch((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, status: 'uploading' } : b))
      )
      try {
        const tagList = item.manualTags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0)
        await api.uploadMediaImage(item.file, tagList)
        setBatch((prev) =>
          prev.map((b) => (b.id === item.id ? { ...b, status: 'done' } : b))
        )
      } catch (e: any) {
        const data = e?.data
        if (data?.duplicate) {
          setBatch((prev) =>
            prev.map((b) =>
              b.id === item.id
                ? {
                    ...b,
                    status: 'duplicate',
                    existingId: data.existing_id,
                    existingFilename: data.existing_filename,
                    error: data.detail,
                  }
                : b
            )
          )
        } else {
          setBatch((prev) =>
            prev.map((b) => (b.id === item.id ? { ...b, status: 'error', error: e.message } : b))
          )
        }
      }
    }
    void load()
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    startBatch(files)
  }

  const pendingCount = batch.filter((b) => b.status !== 'done' && b.status !== 'duplicate').length
  const doneCount = batch.filter((b) => b.status === 'done').length
  const allFinished = batch.every((b) => b.status === 'done' || b.status === 'duplicate' || b.status === 'error')

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-all ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <ImagePlus size={22} className="text-[var(--color-highlight)]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-highlight)]">
              Asset Management
            </p>
            <h3 className="mt-1 text-2xl text-[var(--color-off-white)]">Media Library</h3>
          </div>
        </div>

        <p className="mb-5 max-w-xl text-sm text-[var(--color-muted)]">
          Upload, tag, and search images. Drag a folder of images and AI will auto-suggest tags for each one.
        </p>
      </Card>

      {/* Upload zone */}
      <Card className="p-6">
        <div
          className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? 'border-[var(--color-highlight)] bg-[rgba(138,61,255,0.08)]'
              : 'border-[var(--color-border)] bg-transparent'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <Upload size={32} className="mx-auto mb-3 text-[var(--color-muted)]" />
          <p className="mb-2 text-sm font-medium text-[var(--color-off-white)]">
            Drop files or a folder here, or{' '}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-[var(--color-highlight)] underline"
            >
              browse files
            </button>{' '}
            /{' '}
            <button
              type="button"
              onClick={() => folderRef.current?.click()}
              className="text-[var(--color-highlight)] underline"
            >
              select folder
            </button>
          </p>
          <p className="text-xs text-[var(--color-muted)]">PNG, JPG, WEBP up to 5MB each</p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              startBatch(e.target.files)
              e.target.value = ''
            }}
          />
          <input
            ref={folderRef}
            type="file"
            accept="image/*"
            {...{ webkitdirectory: '', directory: '' } as any}
            multiple
            className="hidden"
            onChange={(e) => {
              startBatch(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      </Card>

      {/* Search & Tags */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2">
            <Search size={16} className="text-[var(--color-muted)]" />
            <Input
              placeholder="Search by tag..."
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
            />
          </div>
          <Button onClick={() => void handleSearch()} type="button">
            Search
          </Button>
          {selectedTags.length > 0 && (
            <Button variant="outline" onClick={() => { setSelectedTags([]); setSearchTag(''); void load() }} type="button">
              Clear
            </Button>
          )}
        </div>

        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setSelectedTags((prev) =>
                    prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                  )
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  selectedTags.includes(t)
                    ? 'bg-[var(--color-highlight)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-off-white)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Image Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner label="Loading images..." />
        </div>
      ) : images.length === 0 ? (
        <Card className="p-8 text-center">
          <ImagePlus size={40} className="mx-auto mb-3 text-[var(--color-muted)]" />
          <p className="text-sm text-[var(--color-muted)]">No images found.</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">Upload some images or adjust your search.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] transition-all hover:border-[var(--color-highlight)]"
            >
              <button
                type="button"
                onClick={() => setPreview(img)}
                className="block aspect-square w-full overflow-hidden"
              >
                <img
                  src={img.file}
                  alt={img.filename}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </button>

              <div className="p-3">
                <p className="truncate text-xs text-[var(--color-muted)]">{img.filename}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {img.tags.length === 0 ? (
                    <span className="text-[10px] text-[var(--color-muted)] italic">No tags</span>
                  ) : (
                    img.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-highlight)]"
                      >
                        {t}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => openEdit(img)}
                  className="rounded-lg bg-black/50 p-1.5 text-white hover:bg-[var(--color-highlight)]/80"
                  title="Edit tags"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(img)}
                  className="rounded-lg bg-black/50 p-1.5 text-white hover:bg-red-500/80"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Batch Upload Modal */}
      <Modal
        open={batchOpen}
        onClose={() => {
          if (allFinished) {
            setBatchOpen(false)
            setBatch([])
            void load()
          }
        }}
        title={`Upload Batch (${doneCount}/${batch.length} done)`}
      >
        <div className="max-h-[60vh] space-y-3 overflow-auto">
          {batch.map((item) => (
            <div key={item.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex items-start gap-3">
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="h-14 w-14 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[var(--color-off-white)]">{item.file.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {item.status === 'suggesting' && (
                      <span className="flex items-center gap-1 text-xs text-[var(--color-highlight)]">
                        <Wand2 size={10} className="animate-pulse" />
                        AI suggesting tags...
                      </span>
                    )}
                    {item.status === 'uploading' && (
                      <span className="flex items-center gap-1 text-xs text-[var(--color-highlight)]">
                        <Spinner size="sm" />
                        Uploading...
                      </span>
                    )}
                    {item.status === 'done' && (
                      <span className="text-xs text-[var(--color-success)]">Uploaded</span>
                    )}
                    {item.status === 'duplicate' && (
                      <span className="flex items-center gap-2 text-xs text-amber-400">
                        <span>Already exists: {item.existingFilename}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setBatch((prev) => prev.filter((b) => b.id !== item.id))
                          }
                          className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-300 hover:bg-red-500/30"
                        >
                          Remove
                        </button>
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-xs text-red-400">{item.error || 'Failed'}</span>
                    )}
                    {item.status === 'ready' && (
                      <span className="text-xs text-[var(--color-muted)]">Ready</span>
                    )}
                    {item.status === 'pending' && (
                      <span className="text-xs text-[var(--color-muted)]">Waiting...</span>
                    )}
                  </div>

                  {(item.status === 'ready' || item.status === 'uploading' || item.status === 'done' || item.status === 'error' || item.status === 'duplicate') && (
                    <div className="mt-2 flex items-center gap-2">
                      <Tag size={12} className="shrink-0 text-[var(--color-muted)]" />
                      <input
                        type="text"
                        value={item.manualTags}
                        onChange={(e) =>
                          setBatch((prev) =>
                            prev.map((b) =>
                              b.id === item.id ? { ...b, manualTags: e.target.value } : b
                            )
                          )
                        }
                        placeholder="tags, separated, by, commas"
                        className="w-full rounded bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-off-white)] outline-none focus:ring-1 focus:ring-[var(--color-highlight)]"
                        disabled={item.status === 'uploading' || item.status === 'done'}
                      />
                    </div>
                  )}

                  {item.aiTags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {item.aiTags.map((t) => (
                        <span key={t} className="rounded bg-[var(--color-bg)] px-1.5 py-0.5 text-[9px] text-[var(--color-highlight)]">
                          {t}
                        </span>
                      ))}
                      <span className="text-[9px] text-[var(--color-muted)]">← AI suggested</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setBatchOpen(false)
              setBatch([])
              void load()
            }}
            type="button"
          >
            Close
          </Button>
          <Button
            onClick={() => void uploadBatch()}
            disabled={pendingCount === 0 || batch.some((b) => b.status === 'uploading')}
            type="button"
          >
            Upload All ({pendingCount} remaining)
          </Button>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.filename || 'Image'}>
        {preview && (
          <div className="space-y-4">
            <img
              src={preview.file}
              alt={preview.filename}
              className="max-h-[60vh] w-full rounded-lg object-contain"
            />
            <div className="flex flex-wrap gap-2">
              {preview.tags.length === 0 ? (
                <span className="text-xs text-[var(--color-muted)] italic">No tags</span>
              ) : (
                preview.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-highlight)]"
                  >
                    {t}
                  </span>
                ))
              )}
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              Uploaded {new Date(preview.uploaded_at).toLocaleString()}
            </p>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => { setDeleteTarget(null); setDeleteError('') }} title="Delete Image">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-off-white)]">
              Are you sure you want to delete <strong>{deleteTarget.filename}</strong>? This cannot be undone.
            </p>
            {deleteError && (
              <p className="text-xs text-red-400">{deleteError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteError('') }} type="button">
                Cancel
              </Button>
              <Button
                onClick={() => void handleConfirmDelete()}
                type="button"
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Tags Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={editTarget ? `Edit Tags: ${editTarget.filename}` : 'Edit Tags'}>
        {editTarget && (
          <div className="space-y-4">
            <img
              src={editTarget.file}
              alt={editTarget.filename}
              className="max-h-[40vh] w-full rounded-lg object-contain"
            />
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                Tags
              </label>
              <Input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="logo, rivers angels, 2025"
              />
              <p className="text-xs text-[var(--color-muted)]">Separate tags with commas.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTarget(null)} type="button">
                Cancel
              </Button>
              <Button onClick={() => void handleSaveEdit()} disabled={editSaving} type="button">
                {editSaving ? <Spinner size="sm" /> : 'Save Tags'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
