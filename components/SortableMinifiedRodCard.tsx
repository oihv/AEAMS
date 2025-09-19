"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MinifiedRodCard from './MinifiedRodCard';
import { RodCardProps } from './RodCard';

interface SortableMinifiedRodCardProps extends RodCardProps {
  isEditMode: boolean;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  isBeingDragged?: boolean;
}

export default function SortableMinifiedRodCard({ 
  isEditMode, 
  position, 
  onPositionChange, 
  isBeingDragged = false,
  ...rodProps 
}: SortableMinifiedRodCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rodProps.id });

  // For map view, we handle positioning directly - don't use sortable transform
  const style = {
    transform: isBeingDragged ? 'none' : CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging || isBeingDragged ? 0.8 : 1,
    zIndex: isDragging || isBeingDragged ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
    >
      <MinifiedRodCard 
        {...rodProps} 
        isEditMode={isEditMode} 
        position={position}
        onPositionChange={onPositionChange}
      />
    </div>
  );
}