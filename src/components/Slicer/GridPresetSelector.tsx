import React, { useState } from 'react';
import { useSlicer } from '../../context/SlicerContext';
import { ChevronDown, Plus, Trash2, GripVertical, X } from 'lucide-react';
import { Tooltip } from '../UI/Tooltip';
import { GridPreset } from '../../types';
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
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortablePresetItemProps {
  preset: GridPreset;
  onApply: (preset: GridPreset) => void;
  onDelete: (id: string) => void;
  isManaging: boolean;
}

const SortablePresetItem: React.FC<SortablePresetItemProps> = ({ 
  preset, 
  onApply, 
  onDelete,
  isManaging 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: preset.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 ${isManaging ? 'bg-surface-hover/50' : ''} rounded`}
    >
      {isManaging && (
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-3 h-3" />
        </button>
      )}
      <button
        onClick={() => onApply(preset)}
        className="flex-1 px-2 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-surface-hover rounded transition-colors text-left"
      >
        {preset.rows}×{preset.cols}
      </button>
      {isManaging && (
        <button
          onClick={() => onDelete(preset.id)}
          className="p-1 text-gray-500 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export const GridPresetSelector: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    gridPresets, 
    addGridPreset, 
    deleteGridPreset, 
    reorderGridPresets,
    t 
  } = useSlicer();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleApplyPreset = (preset: GridPreset) => {
    updateSettings({ rows: preset.rows, cols: preset.cols });
    if (!isManaging) {
      setIsOpen(false);
    }
  };

  const handleAddCurrentAsPreset = () => {
    addGridPreset(settings.rows, settings.cols);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = gridPresets.findIndex((p) => p.id === active.id);
      const newIndex = gridPresets.findIndex((p) => p.id === over.id);
      reorderGridPresets(arrayMove(gridPresets, oldIndex, newIndex));
    }
  };

  const currentPresetExists = gridPresets.some(
    p => p.rows === settings.rows && p.cols === settings.cols
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:text-white bg-surface hover:bg-surface-hover border border-border rounded-md transition-colors"
      >
        <span className="flex items-center gap-2">
          {t('settings.presets')}: {settings.rows}×{settings.cols}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => {
              setIsOpen(false);
              setIsManaging(false);
            }} 
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-lg z-20 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-surface-hover/30">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                {t('settings.presets')}
              </span>
              <div className="flex items-center gap-1">
                {isManaging ? (
                  <button
                    onClick={() => setIsManaging(false)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <Tooltip content={t('settings.managePresets')}>
                    <button
                      onClick={() => setIsManaging(true)}
                      className="p-1 text-gray-500 hover:text-gray-300 text-[10px]"
                    >
                      {t('settings.managePresets')}
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Preset List */}
            <div className="max-h-48 overflow-y-auto p-1">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={gridPresets.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                  disabled={!isManaging}
                >
                  {gridPresets.map((preset) => (
                    <SortablePresetItem
                      key={preset.id}
                      preset={preset}
                      onApply={handleApplyPreset}
                      onDelete={deleteGridPreset}
                      isManaging={isManaging}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {gridPresets.length === 0 && (
                <div className="text-center py-3 text-gray-500 text-xs">
                  {t('settings.noPresets')}
                </div>
              )}
            </div>

            {/* Add Current */}
            <div className="border-t border-border p-1">
              <Tooltip content={currentPresetExists ? t('settings.presetExists') : t('settings.addPreset')}>
                <button
                  onClick={handleAddCurrentAsPreset}
                  disabled={currentPresetExists}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-surface-hover rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3" />
                  {t('settings.addPreset')} ({settings.rows}×{settings.cols})
                </button>
              </Tooltip>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
