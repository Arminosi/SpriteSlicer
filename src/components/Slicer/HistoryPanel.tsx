import React, { useState } from 'react';
import { useSlicer } from '../../context/SlicerContext';
import { History, Trash2, X, AlertTriangle, RotateCcw, Download, Grid3X3 } from 'lucide-react';
import { Button } from '../UI/Button';
import { Tooltip } from '../UI/Tooltip';
import Draggable from 'react-draggable';
import { saveAs } from 'file-saver';
import { HistoryItem } from '../../types';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose }) => {
  const { history, clearHistory, deleteHistoryItem, loadHistoryItem, t } = useSlicer();
  const nodeRef = React.useRef(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClear = () => {
    if (confirmClear) {
      clearHistory();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      deleteHistoryItem(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleDownloadZip = (item: HistoryItem) => {
    if (item.zipData) {
      const baseName = item.fileName.split('.')[0];
      saveAs(item.zipData, `${baseName}_sliced.zip`);
    }
  };

  return (
    <Draggable nodeRef={nodeRef} handle=".handle" bounds="parent">
      <div 
        ref={nodeRef}
        className="absolute top-4 right-4 w-80 bg-surface/90 backdrop-blur-md border border-border rounded-lg shadow-2xl flex flex-col max-h-[calc(100vh-6rem)] z-20"
      >
        <div className="handle p-3 border-b border-border flex items-center justify-between cursor-move select-none">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
            <History className="w-4 h-4" />
            {t('history.title')}
          </div>
          <div className="flex items-center gap-1">
            <Tooltip content={confirmClear ? t('history.confirmClear') : t('history.clear')}>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClear} 
                className={confirmClear ? "text-red-400 hover:text-red-300" : ""}
              >
                {confirmClear ? <AlertTriangle className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
              </Button>
            </Tooltip>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {confirmClear && (
          <div className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] text-center border-b border-red-500/20">
            {t('history.confirmClear')}
          </div>
        )}

        <div className="overflow-y-auto p-2 space-y-2">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              {t('history.noHistory')}
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id}
                className="p-3 rounded-lg bg-surface-hover/50 hover:bg-surface-hover border border-transparent hover:border-border transition-colors group"
              >
                {/* Header: Filename and Time */}
                <div className="flex items-center justify-between mb-2">
                  <Tooltip content={item.fileName}>
                    <span className="text-xs font-medium text-gray-200 truncate max-w-[160px]">
                      {item.fileName}
                    </span>
                  </Tooltip>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {/* Info: Grid size and cell count */}
                <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Grid3X3 className="w-3 h-3" />
                    {item.settings.rows}×{item.settings.cols}
                  </span>
                  {item.cellCount && (
                    <span>{item.cellCount} {t('history.slices')}</span>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Download ZIP Button */}
                  {item.zipData && (
                    <Tooltip content={t('history.downloadZip')}>
                      <button 
                        onClick={() => handleDownloadZip(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded text-[11px] font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        ZIP
                      </button>
                    </Tooltip>
                  )}
                  
                  {/* Restore Button */}
                  <Tooltip content={t('history.restore')}>
                    <button 
                      onClick={() => loadHistoryItem(item)}
                      className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded text-[11px] transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  
                  {/* Delete Button */}
                  {confirmDeleteId === item.id ? (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-2 py-1.5 bg-red-500/20 text-red-400 rounded text-[10px] hover:bg-red-500/30 transition-colors"
                    >
                      {t('history.confirmDelete')}
                    </button>
                  ) : (
                    <Tooltip content={t('history.delete')}>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="flex items-center justify-center px-2 py-1.5 bg-gray-700/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Draggable>
  );
};
