import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { useSlicer } from '../../context/SlicerContext';
import { SortableItem } from './SortableItem';

export const SortablePreview: React.FC = () => {
  const { cells, imageUrl, imageDimensions, settings, reorderCells } = useSlicer();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = cells.findIndex((cell) => cell.id === active.id);
      const newIndex = cells.findIndex((cell) => cell.id === over.id);
      
      reorderCells(arrayMove(cells, oldIndex, newIndex));
    }
  };

  if (!imageUrl || !imageDimensions || cells.length === 0) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={cells.map(c => c.id)}
            strategy={rectSortingStrategy}
          >
            <div 
              className="grid gap-1 mx-auto shadow-2xl bg-surface/30 p-1 rounded-lg"
              style={{
                gridTemplateColumns: `repeat(${settings.cols}, minmax(0, 1fr))`,
                maxWidth: '100%',
                width: 'fit-content' // Allow grid to shrink to content
              }}
            >
              {cells.map((cell) => (
                <div 
                  key={cell.id} 
                  style={{ 
                    width: imageDimensions.width / settings.cols,
                    maxWidth: '200px' // Limit max size for better usability
                  }}
                >
                  <SortableItem
                    cell={cell}
                    imageUrl={imageUrl}
                    imageWidth={imageDimensions.width}
                    imageHeight={imageDimensions.height}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      
      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs text-gray-300 font-mono pointer-events-none">
        Drag to Reorder
      </div>
    </div>
  );
};
