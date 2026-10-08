import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Calendar } from 'lucide-react'
import SignalBar from './SignalBar.jsx'
import { statusConfig } from '../lib/statusConfig.js'

export default function JobCard({ app, isSelected, onSelect, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
    data: { status: app.status },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const cfg = statusConfig(app.status)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(app.id)}
      className={`group relative rounded-lg border p-3 cursor-grab active:cursor-grabbing touch-none shadow-card transition-colors bg-[var(--surface)]
        ${isDragging ? 'dragging-card' : ''}
        ${isSelected ? 'border-signal-amber/70 ring-1 ring-signal-amber/40' : 'border-[var(--border)] hover:border-ink-400'}`}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 shrink-0 text-ink-500 group-hover:text-ink-300"
          aria-hidden="true"
        >
          <GripVertical size={14} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{app.title}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{app.company}</p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(app.id)
          }}
          className="shrink-0 text-ink-500 hover:text-signal-red opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete application"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-3">
        <SignalBar progress={app.progress} color={cfg.color} />
      </div>

      <div
        className="mt-2.5 flex items-center justify-between text-[11px] font-mono"
        style={{ color: 'var(--text-muted)' }}
      >
        <span className="tabular-nums">{app.date}</span>
        {app.interviewRounds?.length > 0 && (
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {app.interviewRounds.length}
          </span>
        )}
      </div>
    </div>
  )
}
