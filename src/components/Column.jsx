import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import JobCard from './JobCard.jsx'

export default function Column({ status, jobs, selectedJobId, onSelect, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id, data: { status: status.id } })

  return (
    <div className="flex flex-col min-w-[260px] w-[260px] shrink-0">
      <div className="flex items-center gap-2 px-1 mb-3">
        <span
          className={`w-2 h-2 rounded-full ${status.live ? 'pulse-dot' : ''}`}
          style={{ color: status.color, backgroundColor: status.color }}
        />
        <h3
          className="text-xs font-semibold uppercase tracking-wider font-display"
          style={{ color: 'var(--text-muted)' }}
        >
          {status.label}
        </h3>
        <span className="ml-auto font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {jobs.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl border border-dashed p-2 space-y-2 min-h-[120px] transition-colors
          ${isOver ? 'border-signal-amber/50 bg-signal-amber/5' : ''}`}
        style={!isOver ? { borderColor: 'var(--border-soft)' } : undefined}
      >
        <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((app) => (
            <JobCard
              key={app.id}
              app={app}
              isSelected={selectedJobId === app.id}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {jobs.length === 0 && (
          <p className="text-[11px] text-center py-6 px-2" style={{ color: 'var(--text-muted)' }}>
            Nothing here yet.
          </p>
        )}
      </div>
    </div>
  )
}
