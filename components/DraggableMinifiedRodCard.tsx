"use client";

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import MinifiedRodCard from './MinifiedRodCard';
import { RodCardProps } from './RodCard';

interface DraggableMinifiedRodCardProps extends RodCardProps {
  isEditMode: boolean;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
}

export default function DraggableMinifiedRodCard({ 
  isEditMode, 
  position, 
  onPositionChange, 
  ...rodProps 
}: DraggableMinifiedRodCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: rodProps.id });

  return (
    <div
      ref={setNodeRef}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
      style={{
        opacity: isDragging ? 0.5 : 1, // Semi-transparent during drag for feedback
        transform: CSS.Transform.toString(transform), // Apply drag transform for real-time movement
        zIndex: isDragging ? 1000 : 'auto',
        transition: isDragging ? 'none' : 'transform 0.2s ease',
      }}
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