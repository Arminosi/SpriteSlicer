import React, { useState, useEffect } from 'react';
import { SlicerProvider, useSlicer } from './context/SlicerContext';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { DropZone } from './components/Slicer/DropZone';
import { SortablePreview } from './components/Slicer/SortablePreview';
import { HistoryPanel } from './components/Slicer/HistoryPanel';
import { Button } from './components/UI/Button';
import { Loader2, ChevronDown, FileImage, FolderArchive } from 'lucide-react';
import { sliceImage, sliceImageDirectly } from './utils/slicer';

const MainContent: React.FC = () => {
  const { file, settings, addToHistory, setFile, t, cells } = useSlicer();
  const [isSlicing, setIsSlicing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [exportMode, setExportMode] = useState<'zip' | 'direct'>('zip');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSlice = async () => {
    if (!file) return;
    
    setIsSlicing(true);
    try {
      if (exportMode === 'zip') {
        const zipBlob = await sliceImage(file, settings, cells);
        addToHistory({
          id: Date.now().toString(),
          timestamp: Date.now(),
          fileName: file.name,
          settings: { ...settings },
          zipData: zipBlob,
          cellCount: cells.length
        });
      } else {
        await sliceImageDirectly(file, settings, cells);
        // For direct download, we don't add to history as we don't have the zip blob
        // and generating it would be double work.
      }
    } catch (error) {
      console.error('Slicing failed:', error);
      alert('Failed to slice image');
    } finally {
      setIsSlicing(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          if (file && !isSlicing) handleSlice();
        } else if (e.key === 'o') {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, isSlicing, settings, cells]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-close sidebar on mobile when selecting a file
  useEffect(() => {
    if (isMobile && file) {
      setIsSidebarOpen(false);
    }
  }, [file, isMobile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-gray-200 overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
      />
      <Header 
        isSidebarOpen={isSidebarOpen} 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isHistoryOpen={isHistoryOpen}
        onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isMobile && isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/50 z-20 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className={`
          transition-all duration-300 ease-in-out overflow-hidden shrink-0 z-30 bg-background
          ${isMobile ? 'absolute h-full shadow-2xl border-r border-border' : ''}
          ${isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'}
        `}>
          <Sidebar />
        </div>
        
        <main className="flex-1 flex flex-col relative bg-grid-pattern min-w-0">
          {file ? (
            <>
              <div className="flex-1 flex flex-col overflow-hidden relative min-h-0">
                <SortablePreview />
              </div>
              
              <div className="h-16 border-t border-border bg-surface/50 backdrop-blur flex items-center justify-between px-6 shrink-0 z-10">
                <div className="text-sm text-gray-400 truncate min-w-0 flex-1 mr-4">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
                
                <div className="relative flex items-center shadow-lg shadow-primary/20 rounded-md shrink-0">
                  <Button 
                    size="lg" 
                    onClick={handleSlice} 
                    disabled={isSlicing}
                    className="rounded-r-none shadow-none border-r border-primary-foreground/20"
                  >
                    {isSlicing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap max-w-0 opacity-0 sm:max-w-[150px] sm:opacity-100 sm:ml-2">
                          {t('action.processing')}
                        </span>
                      </>
                    ) : (
                      <>
                        {exportMode === 'zip' ? <FolderArchive className="w-5 h-5" /> : <FileImage className="w-5 h-5" />}
                        <span className="transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap max-w-0 opacity-0 sm:max-w-[150px] sm:opacity-100 sm:ml-2">
                          {exportMode === 'zip' ? t('action.slice') : t('action.downloadImages')}
                        </span>
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    className="rounded-l-none px-2 shadow-none"
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    disabled={isSlicing}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                  </Button>

                  {/* Dropdown Menu */}
                  {isExportMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsExportMenuOpen(false)}
                      />
                      <div className="absolute bottom-full right-0 mb-2 w-48 bg-surface border border-border rounded-md shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <button
                          onClick={() => {
                            setExportMode('zip');
                            setIsExportMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                            exportMode === 'zip' ? 'bg-primary/10 text-primary' : 'text-gray-300 hover:bg-surface-hover hover:text-white'
                          }`}
                        >
                          <FolderArchive className="w-4 h-4" />
                          {t('action.sliceZip')}
                        </button>
                        <button
                          onClick={() => {
                            setExportMode('direct');
                            setIsExportMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                            exportMode === 'direct' ? 'bg-primary/10 text-primary' : 'text-gray-300 hover:bg-surface-hover hover:text-white'
                          }`}
                        >
                          <FileImage className="w-4 h-4" />
                          {t('action.downloadImages')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <DropZone />
          )}
          
          <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <SlicerProvider>
      <MainContent />
    </SlicerProvider>
  );
}

export default App;
