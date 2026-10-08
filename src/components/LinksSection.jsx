import React, { useState } from 'react'
import { Plus, Trash2, ExternalLink, Link2, Pencil } from 'lucide-react'

const inputClass =
  'w-full px-2.5 py-1.5 rounded-md border text-sm bg-transparent'

function emptyLink() {
  return { label: '', url: '' }
}

// Users often paste/type URLs without a scheme (e.g. "anthropic.com/careers").
// Without one, an <a href> treats it as a relative path and the link breaks.
// This resolves it to an absolute, openable URL without altering what's stored/displayed in the input.
function resolveHref(rawUrl) {
  const trimmed = (rawUrl || '').trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^mailto:|^tel:/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function safeHostname(rawUrl) {
  try {
    return new URL(resolveHref(rawUrl)).hostname
  } catch {
    return rawUrl
  }
}

export default function LinksSection({ links, onChange }) {
  const items = links || []
  // Index of the entry currently in edit mode (only one at a time). New entries open in edit mode.
  const [editingIdx, setEditingIdx] = useState(null)

  const updateLink = (idx, patch) => {
    onChange(items.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }

  const addLink = () => {
    onChange([...items, emptyLink()])
    setEditingIdx(items.length)
  }

  const removeLink = (idx) => {
    onChange(items.filter((_, i) => i !== idx))
    setEditingIdx(null)
  }

  // Commit on Enter/blur: drop the entry if it was left empty, otherwise return to display mode.
  const commit = (idx) => {
    const link = items[idx]
    if (link && !link.url?.trim() && !link.label?.trim()) {
      removeLink(idx)
    } else {
      setEditingIdx(null)
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          Other Links
        </label>
        <button
          onClick={addLink}
          className="flex items-center gap-1 text-xs font-medium text-signal-amber hover:brightness-110"
        >
          <Plus size={13} /> Add link
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Research pages, custom company links, culture decks, anything else worth keeping handy.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((link, idx) => {
            const href = resolveHref(link.url)
            const isEditing = editingIdx === idx

            if (isEditing) {
              return (
                <div
                  key={idx}
                  className="rounded-md border p-2.5 space-y-2"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) commit(idx)
                  }}
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="Label (e.g. Research page)"
                    value={link.label || ''}
                    onChange={(e) => updateLink(idx, { label: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && commit(idx)}
                    className={inputClass}
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <input
                    type="text"
                    placeholder="anthropic.com/careers or full URL"
                    value={link.url || ''}
                    onChange={(e) => updateLink(idx, { url: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && commit(idx)}
                    className={inputClass}
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              )
            }

            return (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-md border px-2.5 py-1.5"
                style={{ borderColor: 'var(--border)' }}
              >
                <Link2 size={13} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0 truncate inline-flex items-center gap-1 text-sm text-signal-blue hover:underline"
                  >
                    {link.label || safeHostname(link.url)} <ExternalLink size={11} className="shrink-0" />
                  </a>
                ) : (
                  <span className="flex-1 min-w-0 truncate text-sm" style={{ color: 'var(--text-muted)' }}>
                    {link.label || 'Untitled link'}
                  </span>
                )}
                <button
                  onClick={() => setEditingIdx(idx)}
                  className="shrink-0 p-1 rounded hover:bg-[var(--surface-2)]"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Edit link"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => removeLink(idx)}
                  className="shrink-0 p-1 rounded text-ink-500 hover:text-signal-red"
                  aria-label="Remove link"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
