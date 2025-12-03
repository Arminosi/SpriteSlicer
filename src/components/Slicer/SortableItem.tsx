import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Cell } from '../../types';
import { useSlicer } from '../../context/SlicerContext';

interface SortableItemProps {
  cell: Cell;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
}

export const SortableItem: React.FC<SortableItemProps> = ({ cell, imageUrl, imageWidth, imageHeight }) => {
  const { settings } = useSlicer();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: cell.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 'auto',
  };

  const { rows, cols, fontSize } = settings;
  const cellWidth = imageWidth / cols;
  const cellHeight = imageHeight / rows;

  // Calculate background position based on original row/col
  const bgX = cell.col * cellWidth;
  const bgY = cell.row * cellHeight;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group cursor-move select-none ${isDragging ? 'opacity-50' : ''}`}
    >
      <div 
        className="w-full h-full bg-no-repeat border border-gray-700/50 hover:border-primary/50 transition-colors"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundPosition: `-${bgX}px -${bgY}px`,
          backgroundSize: `${imageWidth}px ${imageHeight}px`,
          width: '100%',
          paddingBottom: `${(cellHeight / cellWidth) * 100}%`, // Maintain aspect ratio
        }}
      />
      
      {/* Overlay Number */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span 
          style={{ 
            fontSize: `${Math.max(12, fontSize * 0.5)}px`, // Scale down font for preview
            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
          }}
          className="font-bold text-white"
        >
          {cell.displayId}
        </span>
      </div>
    </div>
  );
};
