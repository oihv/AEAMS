"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import RodCard, { RodCardProps } from './RodCard';

interface SortableRodCardProps extends RodCardProps {
  isEditMode: boolean;
}

export default function SortableRodCard({ isEditMode, ...rodProps }: SortableRodCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rodProps.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
      className={isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}
    >
      <RodCard {...rodProps} isEditMode={isEditMode} />
    </div>
  );
}