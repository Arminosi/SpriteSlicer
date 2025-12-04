import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { useSlicer } from '../../context/SlicerContext';
import { SortableItem } from './SortableItem';
import { ContextMenu } from '../UI/ContextMenu';
import { downloadSingleSlice, downloadMultipleSlices } from '../../utils/slicer';
import { Download, Trash2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Cell } from '../../types';

export const SortablePreview: React.FC = () => {
  const { cells, imageUrl, imageDimensions, settings, reorderCells, file, t, undo, redo, past, future } = useSlicer();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; cell: Cell } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const lastClickRef = React.useRef<{ id: string, time: number } | null>(null);
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [gridSize, setGridSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!containerRef.current || !imageDimensions) return;

    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const { width: containerW, height: containerH } = container.getBoundingClientRect();
      const padding = 48; // p-6 * 2
      const availableW = containerW - padding;
      const availableH = containerH - padding;
      
      if (availableW <= 0 || availableH <= 0) return;

      const { width: imgW, height: imgH } = imageDimensions;
      if (!imgW || !imgH) return;

      const { cols, rows } = settings;
      const gap = 4; // 4px gap

      // Calculate target cell ratio (width / height)
      // cellW / cellH = (imgW / cols) / (imgH / rows)
      const targetCellRatio = (imgW * rows) / (imgH * cols);

      if (!targetCellRatio || !isFinite(targetCellRatio)) return;

      const totalGapW = Math.max(0, (cols - 1) * gap);
      const totalGapH = Math.max(0, (rows - 1) * gap);

      // Calculate max cell height based on width constraint
      const maxCellH_byWidth = (availableW - totalGapW) / (cols * targetCellRatio);

      // Calculate max cell height based on height constraint
      const maxCellH_byHeight = (availableH - totalGapH) / rows;

      const cellH = Math.min(maxCellH_byWidth, maxCellH_byHeight);
      
      if (cellH <= 0 || !isFinite(cellH)) return;

      const cellW = cellH * targetCellRatio;

      const gridW = (cols * cellW + totalGapW) * zoom;
      const gridH = (rows * cellH + totalGapH) * zoom;

      setGridSize({ width: gridW, height: gridH });
    };

    updateSize();
    
    // Force update after a short delay to ensure layout is stable
    const timer = setTimeout(updateSize, 100);

    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [imageDimensions, settings.cols, settings.rows, zoom, cells.length]);
  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected items
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }
      
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (past.length > 0) {
          undo();
        }
        return;
      }
      
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (future.length > 0) {
          redo();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, cells, past, future, undo, redo]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;

    if (!selectedIds.has(id)) {
      // If dragging an unselected item, clear selection and select it
      setSelectedIds(new Set([id]));
      setLastSelectedId(id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId !== overId) {
      const oldIndex = cells.findIndex((cell) => cell.id === activeId);
      const newIndex = cells.findIndex((cell) => cell.id === overId);

      if (selectedIds.size <= 1) {
        // Single item reorder
        reorderCells(arrayMove(cells, oldIndex, newIndex));
      } else {
        // Multi-item reorder
        const itemsToMove = cells.filter(c => selectedIds.has(c.id));
        const remainingItems = cells.filter(c => !selectedIds.has(c.id));
        
        // Calculate insert index
        // We need to find where 'over' item is in the remaining items
        // But 'over' item might be one of the selected items (if we dragged a group onto itself? unlikely if we filter)
        // Actually, 'over' is the target drop position.
        
        // If we are moving down, we need to adjust because items were removed
        // But finding the index in the *original* array is easier
        
        // Let's try a simpler approach:
        // 1. Remove selected items
        // 2. Find the index of the 'over' item in the *remaining* list? 
        //    No, 'over' might be in the selected list if we dropped on selection?
        //    If we drop on something that is NOT selected, we find its index in remaining list.
        
        if (selectedIds.has(overId)) {
          // Dropped on itself or another selected item. 
          // Usually this means no change or move to that position.
          // Let's assume we want to place the group at the position of the 'over' item.
          // But since 'over' is moving too, it's ambiguous.
          // Fallback to single item move logic for simplicity or just return?
          // Standard behavior: if I drag a selection and drop it on one of the selected items, nothing happens usually.
          return;
        }

        const overIndexInRemaining = remainingItems.findIndex(c => c.id === overId);
        
        // If we are dragging downwards (oldIndex < newIndex), we want to insert AFTER the over item?
        // Or standard dnd-kit behavior: replace the over item.
        // If dragging down, usually we want to be after.
        
        let finalIndex = overIndexInRemaining;
        if (oldIndex < newIndex) {
           finalIndex += 1;
        }

        // Insert items
        const newCells = [
          ...remainingItems.slice(0, finalIndex),
          ...itemsToMove,
          ...remainingItems.slice(finalIndex)
        ];
        
        reorderCells(newCells);
      }
    }
  };

  const handleCellClick = (e: React.MouseEvent, cell: Cell) => {
    e.stopPropagation(); // Prevent triggering other clicks
    
    // Manual double click detection for mobile/touch devices
    const now = Date.now();
    const lastClick = lastClickRef.current;
    
    if (lastClick && lastClick.id === cell.id && (now - lastClick.time) < 500) {
      handleDoubleClick(e, cell);
      lastClickRef.current = null;
      return;
    }
    lastClickRef.current = { id: cell.id, time: now };

    const id = cell.id;
    let newSelected = new Set(selectedIds);

    if (e.ctrlKey || e.metaKey) {
      // Toggle selection
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setLastSelectedId(id);
    } else if (e.shiftKey && lastSelectedId) {
      // Range selection
      const startIdx = cells.findIndex(c => c.id === lastSelectedId);
      const endIdx = cells.findIndex(c => c.id === id);
      
      const start = Math.min(startIdx, endIdx);
      const end = Math.max(startIdx, endIdx);
      
      const range = cells.slice(start, end + 1);
      
      // If Ctrl is NOT pressed, clear previous selection? 
      // Standard behavior: Shift+Click extends selection from anchor.
      // Usually it clears others unless Ctrl is also held.
      // Let's keep it simple: Add range to current selection or replace?
      // Windows Explorer: Shift+Click selects range from anchor, clearing others.
      
      newSelected = new Set(); // Clear others
      range.forEach(c => newSelected.add(c.id));
      
    } else {
      // Single selection
      newSelected = new Set([id]);
      setLastSelectedId(id);
    }

    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    
    // Start delete animation
    setDeletingIds(new Set(selectedIds));
    
    // After animation completes, actually remove the items
    setTimeout(() => {
      const newCells = cells.filter(c => !selectedIds.has(c.id));
      reorderCells(newCells);
      setSelectedIds(new Set());
      setLastSelectedId(null);
      setDeletingIds(new Set());
    }, 300); // Match the CSS transition duration
  };

  const handleContextMenu = (e: React.MouseEvent, cell: Cell) => {
    e.preventDefault();
    
    // If right-clicking an unselected item, select it (and deselect others)
    if (!selectedIds.has(cell.id)) {
      setSelectedIds(new Set([cell.id]));
      setLastSelectedId(cell.id);
    }
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      cell
    });
  };

  const handleDoubleClick = (e: React.MouseEvent, cell: Cell) => {
    e.preventDefault();
    
    // Select the item if not already selected
    if (!selectedIds.has(cell.id)) {
      setSelectedIds(new Set([cell.id]));
      setLastSelectedId(cell.id);
    }

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      cell
    });
  };

  const handleDownloadSlice = async () => {
    if (!contextMenu || !file) return;
    
    try {
      if (selectedIds.size > 1) {
        // Download multiple selected slices as ZIP
        const selectedCells = cells.filter(c => selectedIds.has(c.id));
        await downloadMultipleSlices(file, settings, selectedCells);
      } else {
        // Download single slice
        await downloadSingleSlice(file, settings, contextMenu.cell);
      }
    } catch (error) {
      console.error('Failed to download slice:', error);
    }
    setContextMenu(null);
  };

  if (!imageUrl || !imageDimensions || cells.length === 0) return null;

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden relative min-h-0"
      onClick={() => setSelectedIds(new Set())} // Click background to deselect
    >
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-6 flex min-h-0"
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={cells.map(c => c.id)}
            strategy={rectSortingStrategy}
          >
            <div 
              className="grid gap-1 shadow-2xl bg-surface/30 p-1 rounded-lg transition-[width,height] duration-200 ease-out shrink-0 m-auto"
              style={{
                gridTemplateColumns: `repeat(${settings.cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${settings.rows}, minmax(0, 1fr))`,
                width: gridSize?.width ?? 'auto',
                height: gridSize?.height ?? 'auto',
              }}
              onClick={(e) => e.stopPropagation()} // Prevent deselect when clicking grid gap
            >
              {cells.map((cell) => (
                <div 
                  key={cell.id} 
                  className="transition-[transform,opacity] duration-300 ease-out"
                  style={{ 
                    width: '100%',
                    height: '100%',
                    aspectRatio: `${imageDimensions.width / settings.cols} / ${imageDimensions.height / settings.rows}`,
                    // Apply delete animation to wrapper
                    transform: deletingIds.has(cell.id) ? 'scale(0)' : 'scale(1)',
                    opacity: deletingIds.has(cell.id) ? 0 : 1,
                  }}
                >
                  <SortableItem
                    cell={cell}
                    imageUrl={imageUrl}
                    isSelected={selectedIds.has(cell.id)}
                    onClick={handleCellClick}
                    onContextMenu={handleContextMenu}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      
      {/* Bottom Right Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 z-10">
        {/* Status Text */}
        <div className="bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs text-gray-300 font-mono pointer-events-none">
          {selectedIds.size > 0 ? `${selectedIds.size} ${t('action.selected')}` : t('action.dragToReorder')}
        </div>
        
        {/* Zoom Controls */}
        <div 
          className="bg-black/50 backdrop-blur px-4 py-2 rounded-full flex items-center gap-3"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => setZoom(1)}
            className="text-gray-300 hover:text-white transition-colors" 
            title={t('action.fitToView')}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-gray-600" />
          <button 
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <input 
            type="range" 
            min="0.5" 
            max="2" 
            step="0.1" 
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary touch-none"
          />
          <button 
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 w-8 text-center">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => {
            setContextMenu(null);
            setDeleteConfirm(false);
          }}
          actions={[
            {
              label: selectedIds.size > 1 
                ? t('action.downloadSelectedZip').replace('{count}', String(selectedIds.size))
                : t('action.downloadSlice'),
              icon: <Download className="w-4 h-4" />,
              onClick: handleDownloadSlice
            },
            {
              label: deleteConfirm ? t('history.confirmDelete') : t('action.deleteSelected'),
              icon: <Trash2 className="w-4 h-4" />,
              danger: true,
              keepOpen: !deleteConfirm,
              onClick: () => {
                if (deleteConfirm) {
                  handleDeleteSelected();
                  setContextMenu(null);
                  setDeleteConfirm(false);
                } else {
                  setDeleteConfirm(true);
                }
              }
            }
          ]}
        />
      )}
    </div>
  );
};
