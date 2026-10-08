import React, { useState } from 'react'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import Column from './Column.jsx'
import JobCard from './JobCard.jsx'
import { STATUSES, STATUS_IDS } from '../lib/statusConfig.js'

export default function Board({ applications, setApplications, selectedJobId, onSelect, onDelete }) {
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const findContainer = (id) => {
    if (STATUS_IDS.includes(id)) return id
    return applications.find((a) => a.id === id)?.status
  }

  const handleDragStart = (event) => setActiveId(event.active.id)

  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) return

    const activeContainer = findContainer(active.id)
    const overContainer = findContainer(over.id)

    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    setApplications((prev) =>
      prev.map((a) => (a.id === active.id ? { ...a, status: overContainer } : a))
    )
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeContainer = findContainer(active.id)
    const overContainer = findContainer(over.id)
    if (!activeContainer || !overContainer) return

    if (active.id !== over.id) {
      setApplications((prev) => {
        const oldIndex = prev.findIndex((a) => a.id === active.id)
        const newIndex = prev.findIndex((a) => a.id === over.id)
        if (newIndex === -1) return prev
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  const activeApp = applications.find((a) => a.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 px-1 -mx-1">
        {STATUSES.map((status) => (
          <Column
            key={status.id}
            status={status}
            jobs={applications.filter((a) => a.status === status.id)}
            selectedJobId={selectedJobId}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </div>

      <DragOverlay>
        {activeApp ? (
          <div className="rotate-2 w-[260px]">
            <JobCard app={activeApp} isSelected={false} onSelect={() => {}} onDelete={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
