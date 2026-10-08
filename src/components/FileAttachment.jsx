import React, { useRef } from 'react'
import { Paperclip, Eye, X } from 'lucide-react'
import { fileToDataURL } from '../lib/storage.js'

export default function FileAttachment({ label, value, onChange }) {
  const inputRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const dataUrl = await fileToDataURL(file)
    onChange(dataUrl)
    e.target.value = ''
  }

  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        {value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-signal-blue hover:underline"
          >
            <Eye size={14} /> View {label.toLowerCase()}
          </a>
        ) : (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No file uploaded
          </span>
        )}

        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFile} className="hidden" />

        <button
          onClick={() => inputRef.current?.click()}
          className="ml-auto flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-[var(--surface-2)]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <Paperclip size={12} /> {value ? 'Replace' : 'Upload'}
        </button>

        {value && (
          <button
            onClick={() => onChange(null)}
            className="p-1 rounded text-signal-red hover:bg-signal-red/10"
            title="Remove file"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
