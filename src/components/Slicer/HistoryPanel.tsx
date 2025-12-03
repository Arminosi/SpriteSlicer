import React from 'react';
import { useSlicer } from '../../context/SlicerContext';
import { History, Trash2, Clock } from 'lucide-react';
import { Button } from '../UI/Button';
import Draggable from 'react-draggable';

export const HistoryPanel: React.FC = () => {
  const { history, clearHistory, loadHistoryItem, t } = useSlicer();
  const nodeRef = React.useRef(null);

  if (history.length === 0) return null;

  return (
    <Draggable nodeRef={nodeRef} handle=".handle" bounds="parent">
      <div 
        ref={nodeRef}
        className="absolute bottom-8 left-8 w-80 bg-surface/90 backdrop-blur-md border border-border rounded-lg shadow-2xl flex flex-col max-h-96 z-20"
      >
        <div className="handle p-3 border-b border-border flex items-center justify-between cursor-move select-none">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
            <History className="w-4 h-4" />
            {t('history.title')}
          </div>
          <Button variant="ghost" size="sm" onClick={clearHistory} title={t('history.clear')}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        <div className="overflow-y-auto p-2 space-y-2">
          {history.map((item) => (
            <div 
              key={item.id}
              className="p-2 rounded bg-surface-hover/50 hover:bg-surface-hover border border-transparent hover:border-border transition-colors group"
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-xs font-medium text-gray-300 truncate max-w-[180px]" title={item.fileName}>
                  {item.fileName}
                </span>
                <span className="text-[10px] text-gray-500">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span>{item.settings.rows}x{item.settings.cols} {t('history.grid')}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => loadHistoryItem(item)}
                    className="p-1 hover:bg-primary/20 hover:text-primary rounded"
                    title="Restore Settings"
                  >
                    <Clock className="w-3 h-3" />
                  </button>
                  {/* Re-download logic would go here if we stored the blob */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Draggable>
  );
};
