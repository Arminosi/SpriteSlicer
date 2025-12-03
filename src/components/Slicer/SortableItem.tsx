import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Cell } from '../../types';
import { useSlicer } from '../../context/SlicerContext';

interface SortableItemProps {
  cell: Cell;
  imageUrl: string;
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent, cell: Cell) => void;
  onDoubleClick?: (e: React.MouseEvent, cell: Cell) => void;
  onContextMenu?: (e: React.MouseEvent, cell: Cell) => void;
}

export const SortableItem: React.FC<SortableItemProps> = ({ 
  cell, 
  imageUrl, 
  isSelected,
  onClick,
  onDoubleClick,
  onContextMenu 
}) => {
  const { settings } = useSlicer();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: cell.id });

  // Only use transition when not dragging for smooth reordering
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : (transition || 'transform 250ms ease'),
    zIndex: isDragging ? 999 : 'auto',
  };

  const { rows, cols, fontSize } = settings;

  // Use percentage-based position that accounts for the cell's position in the grid
  // This ensures each cell shows exactly its portion of the image without bleeding
  const bgX = cols > 1 ? (cell.col / (cols - 1)) * 100 : 50;
  const bgY = rows > 1 ? (cell.row / (rows - 1)) * 100 : 50;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => onClick?.(e, cell)}
      onDoubleClick={(e) => onDoubleClick?.(e, cell)}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          onContextMenu(e, cell);
        }
      }}
      className={`relative group cursor-move select-none touch-manipulation h-full overflow-hidden
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      <div 
        className={`w-full h-full border transition-all duration-200 overflow-hidden
          ${isSelected 
            ? 'border-primary ring-2 ring-primary/50 z-10' 
            : 'border-gray-700/50 hover:border-primary/50'
          }
        `}
      >
        {/* Inner container to clip the image precisely */}
        <div 
          className="w-full h-full bg-no-repeat"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundPosition: `${bgX}% ${bgY}%`,
            backgroundSize: `${cols * 100}% ${rows * 100}%`,
            imageRendering: 'pixelated',
            // Add a tiny inset to prevent sub-pixel bleeding at edges
            margin: '-0.5px',
            padding: '0.5px',
            boxSizing: 'content-box',
          }}
        />
      </div>
      
      {/* Overlay Number */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span 
          style={{ 
            fontSize: `${Math.max(12, fontSize * 0.5)}px`,
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
