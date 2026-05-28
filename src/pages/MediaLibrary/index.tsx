import { ImagePlus, Search, Tag, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { api } from '../../lib/api'
import type { MediaImage } from '../../types'

export function MediaLibraryPage() {
  const [images, setImages] = useState<MediaImage[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTag, setSearchTag] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [preview, setPreview] = useState<MediaImage | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [newTags, setNewTags] = useState('')

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
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(file: File) {
    const tagList = newTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)
    setUploading(true)
    try {
      await api.uploadMediaImage(file, tagList)
      setNewTags('')
      void load()
    } catch (e: any) {
      alert(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this image?')) return
    try {
      await api.deleteMediaImage(id)
      setImages((prev) => prev.filter((i) => i.id !== id))
    } catch (e: any) {
      alert(e.message || 'Delete failed')
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleUpload(file)
  }

  return (
    <div className="space-y-6">
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
          Upload, tag, and search images. Tag images with team names so they can be easily found and assigned to clubs.
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
            Drop an image here, or{' '}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-[var(--color-highlight)] underline"
            >
              browse
            </button>
          </p>
          <p className="mb-4 text-xs text-[var(--color-muted)]">PNG, JPG, WEBP up to 5MB</p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleUpload(file)
              e.target.value = ''
            }}
          />

          <div className="mx-auto flex max-w-sm items-center gap-2">
            <Tag size={14} className="shrink-0 text-[var(--color-muted)]" />
            <Input
              placeholder="Enter tags separated by commas (e.g. rivers-angels, logo, 2024)"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
            />
          </div>

          {uploading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--color-highlight)]">
              <Spinner size="sm" />
              Uploading...
            </div>
          )}
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
                  src={img.url}
                  alt={img.filename}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </button>

              <div className="p-3">
                <p className="truncate text-xs text-[var(--color-muted)]">{img.filename}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {img.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-highlight)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleDelete(img.id)}
                className="absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/80"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.filename || 'Image'}>
        {preview && (
          <div className="space-y-4">
            <img
              src={preview.url}
              alt={preview.filename}
              className="max-h-[60vh] w-full rounded-lg object-contain"
            />
            <div className="flex flex-wrap gap-2">
              {preview.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-highlight)]"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              Uploaded {new Date(preview.uploaded_at).toLocaleString()}
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
