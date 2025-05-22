import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

function DraggableJob({ id, app, selectedJobId, onSelect, onDelete, progress, onStatusChange }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    zIndex: isDragging ? 999 : undefined,
  };

  const showQuickActions = !isDragging;

  return (
    <>
      <div className={`dropzone-indicator ${isOver ? 'active' : ''}`} />
      <motion.li
        ref={setNodeRef}
        className={`job-item ${isDragging ? 'dragging' : ''}`}
        style={style}
        layout
        layoutId={id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: isDragging ? 1.02 : 1,
          boxShadow: isDragging 
            ? '0 8px 20px rgba(0,0,0,0.12)' 
            : '0 0 0 rgba(0,0,0,0)'
        }}
        transition={{
          layout: { duration: 0.2, ease: "easeOut" },
          opacity: { duration: 0.2 },
          scale: { duration: 0.15 },
          boxShadow: { duration: 0.15 }
        }}
      >
        <div
          className="drag-handle"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </div>

        <div style={{ flex: 1 }}>
          <button
            className={`job-button ${app.id === selectedJobId ? 'selected' : ''}`}
            onClick={() => onSelect(app.id)}
          >
            {app.company} — {app.title}
            <div className={`status-tag status-${app.status.toLowerCase().replace(/ /g, '-')}`}>
              {app.status}
            </div>
          </button>
          <div className="progress-container">
            <motion.div
              className="progress-fill"
              style={{ width: `${progress}%` }}
              layoutId={`progress-${id}`}
            />
            <span>{progress}%</span>
          </div>
          
          {/* Quick Actions */}
          {showQuickActions && (
            <div className="quick-actions">
              {app.status === 'Not started' && (
                <button 
                  onClick={() => onStatusChange(id, 'Applied')}
                  className="quick-action applied"
                >
                  Mark Applied
                </button>
              )}
              {app.status === 'Applied' && (
                <button 
                  onClick={() => onStatusChange(id, 'Interviewing')}
                  className="quick-action interviewing"
                >
                  Mark Interviewing
                </button>
              )}
            </div>
          )}
        </div>

        <button
          className="delete-button"
          onClick={() => onDelete(app.id)}
        >
          ×
        </button>
      </motion.li>
      <div className={`dropzone-indicator ${isOver ? 'active' : ''}`} />
    </>
  );
}

export default DraggableJob;