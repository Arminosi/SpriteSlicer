import React, { useState, useEffect } from 'react';
import { useSlicer } from '../../context/SlicerContext';
import { History, Trash2, X, AlertTriangle, RotateCcw, Download, Grid3X3, Eye, FileImage } from 'lucide-react';
import { Button } from '../UI/Button';
import { Tooltip } from '../UI/Tooltip';
import Draggable from 'react-draggable';
import { saveAs } from 'file-saver';
import { HistoryItem } from '../../types';
import { createPortal } from 'react-dom';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PreviewModal: React.FC<{ 
  item: HistoryItem; 
  onClose: () => void;
  onDownload: () => void;
  onRestore: () => void;
}> = ({ item, onClose, onDownload, onRestore }) => {
  const { t } = useSlicer();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  const handleRestore = () => {
    if (confirmRestore) {
      onRestore();
      onClose();
    } else {
      setConfirmRestore(true);
      setTimeout(() => setConfirmRestore(false), 3000);
    }
  };

  const cellIdMap = React.useMemo(() => {
    const { rows, cols, sortMode, startId } = item.settings;
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({ r, c });
      }
    }
    
    cells.sort((a, b) => {
      if (sortMode === 'snake-1') {
        const rowDiff = a.r - b.r;
        if (rowDiff !== 0) return rowDiff;
        return a.r % 2 !== 0 ? b.c - a.c : a.c - b.c;
      }
      if (sortMode === 'snake-2') {
        const rowDiff = a.r - b.r;
        if (rowDiff !== 0) return rowDiff;
        return a.r % 2 === 0 ? b.c - a.c : a.c - b.c;
      }
      if (sortMode === 'reverse') {
        const rowDiff = b.r - a.r;
        if (rowDiff !== 0) return rowDiff;
        return b.c - a.c;
      }
      if (sortMode === 'vertical') {
        const colDiff = a.c - b.c;
        if (colDiff !== 0) return colDiff;
        return a.r - b.r;
      }
      if (sortMode === 'vertical-reverse') {
        const colDiff = b.c - a.c;
        if (colDiff !== 0) return colDiff;
        return b.r - a.r;
      }
      // Normal
      const rowDiff = a.r - b.r;
      if (rowDiff !== 0) return rowDiff;
      return a.c - b.c;
    });

    const map = new Map<string, number>();
    cells.forEach((cell, index) => {
      map.set(`${cell.r}-${cell.c}`, startId + index);
    });
    return map;
  }, [item.settings]);

  useEffect(() => {
    let url: string | null = null;
    if (item.fileData) {
      url = URL.createObjectURL(item.fileData);
      setImageUrl(url);
    } else if (item.thumbnail) {
      url = item.thumbnail;
      setImageUrl(url);
    }

    if (url) {
      const img = new Image();
      img.onload = () => {
        setDimensions({ w: img.width, h: img.height });
      };
      img.src = url;
    }

    return () => {
      if (item.fileData && url) {
        // Delay revocation to avoid ERR_FILE_NOT_FOUND if image is still loading
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    };
  }, [item]);

  if (!imageUrl) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="relative bg-surface border border-border rounded-lg shadow-2xl p-4 w-[90vw] h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-sm font-medium text-gray-200">{item.fileName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="relative flex-1 min-h-0 rounded bg-black/20 flex items-center justify-center overflow-hidden">
          {dimensions ? (
            <div 
              className="relative shadow-lg"
              style={{
                aspectRatio: `${dimensions.w} / ${dimensions.h}`,
                maxHeight: '100%',
                maxWidth: '100%'
              }}
            >
              <img src={imageUrl} alt="Preview" className="w-full h-full object-contain block" />
              
              {/* Grid Overlay */}
              <div 
                className="absolute inset-0 pointer-events-none border border-blue-500/30"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${item.settings.cols}, 1fr)`,
                  gridTemplateRows: `repeat(${item.settings.rows}, 1fr)`,
                }}
              >
                {Array.from({ length: item.settings.rows * item.settings.cols }).map((_, i) => {
                  const row = Math.floor(i / item.settings.cols);
                  const col = i % item.settings.cols;
                  const displayId = cellIdMap.get(`${row}-${col}`);
                  
                  return (
                    <div key={i} className="border border-blue-500/30 flex items-center justify-center overflow-hidden">
                      <span className="text-[10px] text-white bg-black/40 px-1 rounded shadow-sm backdrop-blur-[1px]">
                        {displayId}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Loading...</div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex flex-col gap-1 text-xs text-gray-400">
            <span>{item.settings.rows} × {item.settings.cols}</span>
            <span>{new Date(item.timestamp).toLocaleString()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {item.zipData && (
              <Button size="sm" onClick={onDownload} className="gap-2">
                <Download className="w-4 h-4" />
                {t('history.downloadZip')}
              </Button>
            )}
            <Button 
              size="sm" 
              variant={confirmRestore ? "danger" : "secondary"} 
              onClick={handleRestore} 
              className="gap-2"
            >
              {confirmRestore ? <AlertTriangle className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
              {confirmRestore ? t('history.confirmImport') : t('history.importToCanvas')}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose }) => {
  const { history, clearHistory, deleteHistoryItem, loadHistoryItem, t } = useSlicer();
  const nodeRef = React.useRef(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<HistoryItem | null>(null);

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

  const handleRestore = (id: string, item: HistoryItem) => {
    if (confirmRestoreId === id) {
      loadHistoryItem(item);
      setConfirmRestoreId(null);
    } else {
      setConfirmRestoreId(id);
      setTimeout(() => setConfirmRestoreId(null), 3000);
    }
  };

  const handleDownloadZip = (item: HistoryItem) => {
    if (item.zipData) {
      const baseName = item.fileName.split('.')[0];
      saveAs(item.zipData, `${baseName}_sliced.zip`);
    }
  };

  const handleDownloadOriginal = (item: HistoryItem) => {
    if (item.fileData) {
      saveAs(item.fileData, item.fileName);
    }
  };

  return (
    <>
      <Draggable nodeRef={nodeRef} handle=".handle" bounds="parent" cancel=".no-drag">
        <div 
          ref={nodeRef}
        className="absolute top-4 right-4 w-80 bg-surface/90 backdrop-blur-md border border-border rounded-lg shadow-2xl flex flex-col max-h-[calc(100vh-6rem)] z-20"
      >
        <div className="handle p-3 border-b border-border flex items-center justify-between cursor-move select-none">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
            <History className="w-4 h-4" />
            {t('history.title')}
          </div>
          <div className="flex items-center gap-1 no-drag">
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
                  
                  {/* Download Original Button */}
                  {item.fileData && (
                    <Tooltip content={t('history.downloadOriginal')}>
                      <button 
                        onClick={() => handleDownloadOriginal(item)}
                        className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded text-[11px] transition-colors"
                      >
                        <FileImage className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  )}
                  
                  {/* Preview Button */}
                  <Tooltip content={t('history.preview')}>
                    <button 
                      onClick={() => setPreviewItem(item)}
                      className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded text-[11px] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  
                  {/* Restore Button */}
                  {confirmRestoreId === item.id ? (
                    <button
                      onClick={() => handleRestore(item.id, item)}
                      className="px-2 py-1.5 bg-yellow-500/20 text-yellow-400 rounded text-[10px] hover:bg-yellow-500/30 transition-colors"
                    >
                      {t('history.confirmImport')}
                    </button>
                  ) : (
                    <Tooltip content={t('history.importToCanvas')}>
                      <button 
                        onClick={() => handleRestore(item.id, item)}
                        className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded text-[11px] transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  )}
                  
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
      {previewItem && (
        <PreviewModal 
          item={previewItem} 
          onClose={() => setPreviewItem(null)} 
          onDownload={() => handleDownloadZip(previewItem)}
          onRestore={() => loadHistoryItem(previewItem)}
        />
      )}
    </>
  );
};
