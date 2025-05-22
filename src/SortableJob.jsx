import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableJob({ id, children, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const [dragging, setDragging] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'pointer'
  };

  const handleMouseDown = () => {
    setDragging(false);
  };

  const handleMouseMove = () => {
    setDragging(true);
  };

  const handleClick = (e) => {
    // Only trigger the click if no drag operation occurred
    if (!dragging && onClick) {
      onClick(e);
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseDown={handleMouseDown} // Reset dragging state on mouse down
      onMouseMove={handleMouseMove} // Set dragging state on mouse move
      onClick={handleClick} // Trigger click only if not dragging
    >
      {children}
    </li>
  );
}

export default SortableJob;
