import React, { useRef, useEffect } from 'react';
import { useSlicer } from '../../context/SlicerContext';
import { Check, RotateCcw, Clock } from 'lucide-react';

interface OperationHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

export const OperationHistoryPanel: React.FC<OperationHistoryPanelProps> = ({ isOpen, onClose, anchorRef }) => {
  const { past, future, jumpToHistory, t } = useSlicer();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current && 
        !panelRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  // Calculate position
  const style: React.CSSProperties = {
    top: '100%',
    left: 0,
  };
  
  if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      style.top = rect.bottom + 8;
      style.left = rect.left;
  }

  // History panel shows past actions for rollback
  // Click on a past action to roll back to that state
  
  return (
    <div 
      ref={panelRef}
      className="fixed z-50 w-64 bg-surface border border-border rounded-lg shadow-xl flex flex-col max-h-96 overflow-hidden"
      style={style}
    >
      <div className="p-3 border-b border-border bg-surface-hover/50">
        <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {t('action.historyOps')}
        </h3>
      </div>
      
      <div className="overflow-y-auto flex-1 p-1">
        {past.length === 0 && future.length === 0 && (
            <div className="p-4 text-center text-xs text-gray-500">
                {t('operations.noOps')}
            </div>
        )}

        {/* Future (Redo stack) - displayed at top if we want reverse chronological? 
            Usually history is list:
            Oldest
            ...
            Newest (Current)
            Future
        */}
        
        {/* Let's display in reverse chronological order (Newest top) */}
        
        {future.map((item, i) => (
             <div key={`future-${i}`} className="px-3 py-2 text-xs text-gray-500 border-l-2 border-transparent ml-2">
                {item.description}
             </div>
        ))}

        {/* Current State Indicator */}
        <div className="px-3 py-2 text-xs font-medium text-primary bg-primary/10 rounded border-l-2 border-primary flex items-center justify-between">
            <span>{t('operations.currentState')}</span>
            <Check className="w-3 h-3" />
        </div>

        {[...past].reverse().map((item, i) => {
            const originalIndex = past.length - 1 - i;
            return (
                <button
                    key={`past-${originalIndex}`}
                    onClick={() => {
                        jumpToHistory(originalIndex);
                        onClose();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-surface-hover rounded border-l-2 border-transparent hover:border-gray-500 transition-colors flex items-center gap-2 group"
                >
                    <RotateCcw className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item.description}
                    <span className="ml-auto text-gray-600 text-[10px]">
                        {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                </button>
            );
        })}
      </div>
    </div>
  );
};
