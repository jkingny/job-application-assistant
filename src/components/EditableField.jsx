import React, { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'

// A click-to-edit text field: shows the value with an edit pencil,
// swaps to an input on click, saves on Enter/blur, cancels on Escape.
export default function EditableField({ label, value, onSave, placeholder = 'N/A', type = 'text', renderValue }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  const startEdit = () => {
    setDraft(value || '')
    setEditing(true)
  }

  const save = () => {
    onSave(draft)
    setEditing(false)
  }

  const cancel = () => setEditing(false)

  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape') cancel()
            }}
            className="flex-1 px-2.5 py-1.5 rounded-md border text-sm bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          />
          <button onClick={save} className="p-1.5 rounded-md text-signal-teal hover:bg-signal-teal/10">
            <Check size={15} />
          </button>
          <button onClick={cancel} className="p-1.5 rounded-md text-signal-red hover:bg-signal-red/10">
            <X size={15} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <div className="flex-1 text-sm py-1.5" style={{ color: value ? 'var(--text)' : 'var(--text-muted)' }}>
            {renderValue ? renderValue(value) : value || placeholder}
          </div>
          <button
            onClick={startEdit}
            className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <Pencil size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
